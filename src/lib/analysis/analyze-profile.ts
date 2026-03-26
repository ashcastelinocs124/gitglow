/**
 * GPT-4o profile analyzer with heuristic fallback.
 *
 * `analyzeProfile` is the main entry point. It calls OpenAI GPT-4o to
 * generate a structured narrative profile from GitHub data. If the API
 * key is not set or the call fails, it falls back to a pure heuristic
 * analysis that requires no LLM.
 *
 * All functions except `analyzeProfile` are pure and side-effect-free,
 * making them trivially testable.
 */

import type {
  NormalizedImportPayload,
  NormalizedRepository,
} from "@/lib/github/import-profile";
import type { AnalysisResult } from "@/lib/analysis/types";

// Re-export so consumers can import from this module
export type { AnalysisResult } from "@/lib/analysis/types";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the user message for GPT-4o with all repo data serialized.
 * Instructs the model to return JSON matching the AnalysisResult shape.
 */
export function buildAnalysisPrompt(
  importData: NormalizedImportPayload,
): string {
  const { profile, repositories } = importData;

  const repoLines = repositories.map((repo) => {
    const parts = [
      `  - name: ${repo.name}`,
      `    description: ${repo.description ?? "(none)"}`,
      `    language: ${repo.primaryLanguage ?? "(none)"}`,
      `    stars: ${repo.stars}`,
      `    forks: ${repo.forks}`,
      `    isPinned: ${repo.isPinned}`,
      `    pushedAt: ${repo.pushedAt ? repo.pushedAt.toISOString() : "(never)"}`,
      `    id: ${repo.githubRepoId}`,
    ];
    return parts.join("\n");
  });

  const reposSection =
    repositories.length > 0
      ? `Repositories:\n${repoLines.join("\n\n")}`
      : "Repositories: (none)";

  return `Analyze the following GitHub developer profile and return a JSON object.

Developer Profile:
  login: ${profile.login}
  name: ${profile.name ?? "(not set)"}
  bio: ${profile.bio ?? "(not set)"}
  followers: ${profile.followers}
  following: ${profile.following}
  publicRepos: ${profile.publicRepos}

${reposSection}

Return a JSON object with exactly these fields:
- headline: string — a catchy one-liner for the developer's profile (e.g. "Hi, I'm X — a Y developer who loves Z")
- bio: string — a 2-3 sentence narrative bio summarizing who they are as a developer
- goals: string — a 1-2 sentence description of what they seem to be working toward
- archetype: string — one of: backend, frontend, fullstack, data, devops, mobile, ml, indie, systems
- experienceOutsideGitHub: string | null — infer any experience outside GitHub from their bio/projects, or null if unclear
- featuredProjectIds: string[] — array of repo IDs (as strings) for the top projects to feature (max 6), chosen by impact and diversity
- featuredProjectReasons: object — keys are repo IDs, values are 1-sentence reasons why each project was featured
- visualSuggestions: object with:
  - showTimeline: boolean — whether a contribution timeline would be valuable
  - showLanguageBreakdown: boolean — whether a language breakdown chart would be valuable
  - showActivityCard: boolean — whether an activity summary card would be valuable
  - emphasisThemes: string[] — 2-4 thematic keywords that characterize this developer
- voiceNotes: string — brief internal notes about the developer's profile character and tone`;
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/**
 * Parse the raw LLM response string into a validated AnalysisResult.
 * Falls back to heuristic defaults for any missing or invalid fields.
 */
export function parseAnalysisResponse(
  raw: string,
  importData: NormalizedImportPayload,
): AnalysisResult {
  const fallback = buildFallbackAnalysis(importData);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return fallback;
  }

  // Validate and extract each field, falling back individually
  const headline =
    typeof parsed.headline === "string" && parsed.headline.length > 0
      ? parsed.headline
      : fallback.headline;

  const bio =
    typeof parsed.bio === "string" && parsed.bio.length > 0
      ? parsed.bio
      : fallback.bio;

  const goals =
    typeof parsed.goals === "string" && parsed.goals.length > 0
      ? parsed.goals
      : fallback.goals;

  const archetype =
    typeof parsed.archetype === "string" && parsed.archetype.length > 0
      ? parsed.archetype
      : fallback.archetype;

  const experienceOutsideGitHub =
    typeof parsed.experienceOutsideGitHub === "string"
      ? parsed.experienceOutsideGitHub
      : parsed.experienceOutsideGitHub === null
        ? null
        : fallback.experienceOutsideGitHub;

  const featuredProjectIds =
    Array.isArray(parsed.featuredProjectIds) &&
    parsed.featuredProjectIds.every((id: unknown) => typeof id === "string")
      ? (parsed.featuredProjectIds as string[])
      : fallback.featuredProjectIds;

  const featuredProjectReasons =
    typeof parsed.featuredProjectReasons === "object" &&
    parsed.featuredProjectReasons !== null &&
    !Array.isArray(parsed.featuredProjectReasons)
      ? (parsed.featuredProjectReasons as Record<string, string>)
      : fallback.featuredProjectReasons;

  const visualSuggestions = parseVisualSuggestions(
    parsed.visualSuggestions,
    fallback.visualSuggestions,
  );

  const voiceNotes =
    typeof parsed.voiceNotes === "string"
      ? parsed.voiceNotes
      : fallback.voiceNotes;

  return {
    headline,
    bio,
    goals,
    archetype,
    experienceOutsideGitHub,
    featuredProjectIds,
    featuredProjectReasons,
    visualSuggestions,
    voiceNotes,
  };
}

/**
 * Parse visualSuggestions sub-object with individual field fallbacks.
 */
function parseVisualSuggestions(
  raw: unknown,
  fallback: AnalysisResult["visualSuggestions"],
): AnalysisResult["visualSuggestions"] {
  if (typeof raw !== "object" || raw === null) {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;

  return {
    showTimeline:
      typeof obj.showTimeline === "boolean"
        ? obj.showTimeline
        : fallback.showTimeline,
    showLanguageBreakdown:
      typeof obj.showLanguageBreakdown === "boolean"
        ? obj.showLanguageBreakdown
        : fallback.showLanguageBreakdown,
    showActivityCard:
      typeof obj.showActivityCard === "boolean"
        ? obj.showActivityCard
        : fallback.showActivityCard,
    emphasisThemes:
      Array.isArray(obj.emphasisThemes) &&
      obj.emphasisThemes.every((t: unknown) => typeof t === "string")
        ? (obj.emphasisThemes as string[])
        : fallback.emphasisThemes,
  };
}

// ---------------------------------------------------------------------------
// Fallback (pure heuristic, no LLM)
// ---------------------------------------------------------------------------

/**
 * Build a complete AnalysisResult using only heuristics. No LLM call needed.
 *
 * - Infers archetype from the most common primary language
 * - Generates a simple headline from the user's name/login and archetype
 * - Picks top 6 repos by stars as featured
 * - Defaults all visual suggestions to true
 */
export function buildFallbackAnalysis(
  importData: NormalizedImportPayload,
): AnalysisResult {
  const { profile, repositories } = importData;
  const displayName = profile.name ?? profile.login;

  // Infer archetype from top language
  const archetype = inferArchetypeFromLanguages(repositories);

  // Headline
  const headline = `Hi, I'm ${displayName} — a ${archetype} developer`;

  // Bio from profile bio or generate a basic one
  const bio =
    profile.bio && profile.bio.trim().length > 0
      ? profile.bio
      : `${displayName} is a ${archetype} developer with ${repositories.length} public repositories on GitHub.`;

  // Goals
  const goals =
    repositories.length > 0
      ? `Building and maintaining ${repositories.length} open source projects.`
      : "Exploring open source and building new projects.";

  // Top 6 repos by stars as featured
  const sortedRepos = [...repositories].sort((a, b) => b.stars - a.stars);
  const featured = sortedRepos.slice(0, 6);
  const featuredProjectIds = featured.map((r) => r.githubRepoId);

  // Reasons for each featured project
  const featuredProjectReasons: Record<string, string> = {};
  for (const repo of featured) {
    const parts: string[] = [];
    if (repo.stars > 0) parts.push(`${repo.stars} stars`);
    if (repo.isPinned) parts.push("pinned by user");
    if (repo.primaryLanguage) parts.push(`written in ${repo.primaryLanguage}`);
    featuredProjectReasons[repo.githubRepoId] =
      parts.length > 0
        ? `Featured: ${parts.join(", ")}.`
        : "Selected as a notable project.";
  }

  // Compute emphasis themes from languages
  const languageCounts = computeLanguageCounts(repositories);
  const emphasisThemes = Object.keys(languageCounts)
    .sort((a, b) => languageCounts[b] - languageCounts[a])
    .slice(0, 4)
    .map((lang) => lang.toLowerCase());

  return {
    headline,
    bio,
    goals,
    archetype,
    experienceOutsideGitHub: null,
    featuredProjectIds,
    featuredProjectReasons,
    visualSuggestions: {
      showTimeline: true,
      showLanguageBreakdown: true,
      showActivityCard: true,
      emphasisThemes,
    },
    voiceNotes: `Heuristic analysis for ${displayName}. ${archetype} archetype inferred from repository languages.`,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Analyze a developer's GitHub profile using GPT-4o.
 *
 * If OPENAI_API_KEY is not set, returns a heuristic fallback immediately.
 * On any error from the OpenAI API, also returns the fallback.
 */
export async function analyzeProfile(
  importData: NormalizedImportPayload,
): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackAnalysis(importData);
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a developer profile analyst. Analyze the GitHub data and return a JSON object with the developer's profile narrative. Return ONLY valid JSON, no markdown or extra text.",
        },
        {
          role: "user",
          content: buildAnalysisPrompt(importData),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return buildFallbackAnalysis(importData);
    }

    return parseAnalysisResponse(raw, importData);
  } catch {
    return buildFallbackAnalysis(importData);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute language repo counts from repositories.
 */
function computeLanguageCounts(
  repos: NormalizedRepository[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.primaryLanguage === null) continue;
    counts[repo.primaryLanguage] = (counts[repo.primaryLanguage] ?? 0) + 1;
  }
  return counts;
}

/**
 * Infer developer archetype from the most common primary language.
 * Mirrors the logic from profile-model.ts.
 */
function inferArchetypeFromLanguages(repos: NormalizedRepository[]): string {
  const counts = computeLanguageCounts(repos);
  const entries = Object.entries(counts).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return "fullstack";

  const top = entries[0][0].toLowerCase();

  const mapping: Record<string, string> = {
    python: "backend",
    java: "backend",
    go: "backend",
    rust: "systems",
    c: "systems",
    "c++": "systems",
    javascript: "fullstack",
    typescript: "fullstack",
    swift: "mobile",
    kotlin: "mobile",
    dart: "mobile",
    "jupyter notebook": "data",
    r: "data",
    hcl: "devops",
    terraform: "devops",
    dockerfile: "devops",
    css: "frontend",
    html: "frontend",
    vue: "frontend",
    svelte: "frontend",
  };

  return mapping[top] ?? "fullstack";
}
