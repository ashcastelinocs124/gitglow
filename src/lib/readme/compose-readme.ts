/**
 * README markdown composition entry point.
 *
 * Section order: headline -> about -> featured projects -> journey ->
 * stats (with GitHub cards) -> connect -> footer.
 */

import type { ProfileModel } from "@/lib/profile/profile-model";
import { renderAboutSection } from "@/lib/readme/sections/about";
import { renderJourneySection } from "@/lib/readme/sections/journey";
import { renderProjectsSection } from "@/lib/readme/sections/projects";
import { renderStatsSection } from "@/lib/readme/sections/stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetEmbed {
  alt: string;
  url: string;
}

export interface ReadmeInput {
  login?: string;
  headline: string;
  about: string;
  goals?: string;
  journeySummary?: string;
  featuredProjects?: {
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    url: string;
  }[];
  languages?: { name: string; repoCount: number }[];
  totalStars?: number;
  totalForks?: number;
  totalRepos?: number;
  recentlyActiveRepos?: string[];
  assets?: AssetEmbed[];
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

export function composeReadme(input: ReadmeInput): string {
  const sections: string[] = [];

  // --- Headline ---
  sections.push(`# ${input.headline}`);

  // --- Visual cards (activity, languages, timeline) ---
  if (input.assets && input.assets.length > 0) {
    const assetLines = input.assets
      .map((asset) => `![${asset.alt}](${asset.url})`)
      .join("\n\n");
    sections.push(assetLines);
  }

  // --- About Me ---
  sections.push(renderAboutSection(input.about, input.goals));

  // --- Featured Projects ---
  const projects = renderProjectsSection(input.featuredProjects);
  if (projects) {
    sections.push(projects);
  }

  // --- My Journey ---
  const journey = renderJourneySection(
    input.journeySummary,
    input.recentlyActiveRepos,
  );
  if (journey) {
    sections.push(journey);
  }

  // --- Stats ---
  const stats = renderStatsSection(
    input.languages,
    input.totalStars,
    input.totalForks,
    input.totalRepos,
    input.login,
  );
  if (stats) {
    sections.push(stats);
  }

  // --- Connect ---
  if (input.login) {
    const connect: string[] = [];
    connect.push("## Let's Connect");
    connect.push("");
    connect.push(`Want to collaborate or have feedback? Open an issue/PR in any of my repos or reach out on [GitHub](https://github.com/${input.login}).`);
    sections.push(connect.join("\n"));
  }

  // --- Footer ---
  sections.push("---");
  sections.push("*Generated with [Gitglow](https://gitglow.dev)*");

  return sections.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// ProfileModel -> ReadmeInput mapping
// ---------------------------------------------------------------------------

export function profileModelToReadmeInput(model: ProfileModel): ReadmeInput {
  return {
    login: model.login,
    headline: model.headline,
    about: model.aboutSummary,
    goals: model.goals,
    journeySummary: model.experienceOutsideGitHub ?? undefined,
    featuredProjects: model.featuredProjects.map((p) => ({
      name: p.name,
      description: p.description,
      language: p.language,
      stars: p.stars,
      url: p.url,
    })),
    languages: model.languages,
    totalStars: model.totalStars,
    totalForks: model.totalForks,
    totalRepos: model.totalRepos,
    recentlyActiveRepos: model.recentlyActiveRepos,
  };
}
