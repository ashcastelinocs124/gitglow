/**
 * GET /api/assets/:login/:kind
 *
 * Generates and serves SVG asset cards on-the-fly.
 * kind: "activity.svg" | "languages.svg" | "timeline.svg"
 *
 * Fetches the user's GitHub data, builds the profile model,
 * and generates the requested SVG card. No auth required —
 * this is a public endpoint so GitHub can embed it.
 */

import { importGitHubProfile } from "@/lib/github/import-profile";
import { buildProfileModel } from "@/lib/profile/profile-model";
import { defaultQuestionnaire } from "@/lib/profile/questionnaire";
import { generateAsset } from "@/lib/assets/generate-asset";
import { getUserStore } from "@/lib/store";
import { GitHubClient } from "@/lib/github/client";
import { normalizeImportPayload } from "@/lib/github/import-profile";

// Map URL kind to asset generator kind
const KIND_MAP: Record<string, { assetKind: string; dataBuilder: (model: ReturnType<typeof buildProfileModel>, repos: unknown[]) => Record<string, unknown> }> = {
  "activity.svg": {
    assetKind: "activity-card",
    dataBuilder: (model) => ({
      login: model.login,
      totalRepos: model.totalRepos,
      totalStars: model.totalStars,
      recentlyActiveRepos: model.recentlyActiveRepos,
    }),
  },
  "languages.svg": {
    assetKind: "language-card",
    dataBuilder: (model) => ({
      login: model.login,
      languages: model.languages,
    }),
  },
  "timeline.svg": {
    assetKind: "timeline-card",
    dataBuilder: (_, repos) => ({
      login: (repos as Array<{ ownerLogin?: string }>)[0]?.ownerLogin ?? "user",
      repositories: repos,
    }),
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ login: string; kind: string }> },
): Promise<Response> {
  const { login, kind } = await params;

  const mapping = KIND_MAP[kind];
  if (!mapping) {
    return new Response("Unknown asset kind. Use: activity.svg, languages.svg, timeline.svg", {
      status: 400,
    });
  }

  try {
    // Try to get data from the in-memory store first (for logged-in users)
    // Fall back to public GitHub API (no auth token, limited to public repos)
    let importData;
    const storeEntries = Array.from(Object.keys(getUserStore("")));

    // Try public API fetch for the requested login
    const client = new GitHubClient("");  // empty token = public access
    const publicFetch = await fetch(`https://api.github.com/users/${login}`);
    if (!publicFetch.ok) {
      return new Response("User not found", { status: 404 });
    }
    const user = await publicFetch.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${login}/repos?sort=pushed&per_page=100&type=owner`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    const repos = reposRes.ok ? await reposRes.json() : [];

    importData = normalizeImportPayload({
      ...user,
      repos,
    });

    const narrative = {
      ...defaultQuestionnaire(),
      bio: importData.profile.bio ?? "Developer",
      goals: "Showcase my work",
      archetype: "",
    };

    const featuredIds = importData.repositories
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 6)
      .map((r) => r.githubRepoId);

    const profileModel = buildProfileModel({
      profile: importData.profile,
      repositories: importData.repositories,
      narrative,
      featuredProjectIds: featuredIds,
    });

    // Build repo data for timeline
    const timelineRepos = importData.repositories
      .filter((r) => r.pushedAt)
      .map((r) => ({
        name: r.name,
        date: r.pushedAt!.toISOString(),
        language: r.primaryLanguage,
        stars: r.stars,
      }));

    const data = kind === "timeline.svg"
      ? { login, repositories: timelineRepos }
      : mapping.dataBuilder(profileModel, timelineRepos);

    const asset = await generateAsset({
      kind: mapping.assetKind as "activity-card" | "language-card" | "journey-card" | "timeline-card",
      data,
    });

    return new Response(asset.content, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Asset generation failed";
    return new Response(`<!-- Error: ${msg} -->`, {
      status: 500,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}
