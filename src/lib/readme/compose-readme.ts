/**
 * README markdown composition entry point.
 *
 * `composeReadme` assembles a full GitHub profile README from a `ReadmeInput`
 * object. The input is a simplified, composer-friendly shape derived from
 * `ProfileModel` — keeping the composer testable without the full model.
 *
 * Section order: headline -> assets (top) -> about -> journey ->
 * featured projects -> stats -> footer.
 *
 * All output is valid GitHub-flavored markdown with no HTML tags.
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

/**
 * Assemble a full GitHub profile README from the given input.
 *
 * @param input - The simplified README input derived from a ProfileModel.
 * @returns A complete GitHub-flavored markdown string.
 */
export function composeReadme(input: ReadmeInput): string {
  const sections: string[] = [];

  // --- Headline ---
  sections.push(`# ${input.headline}`);

  // --- Assets (between headline and about) ---
  if (input.assets && input.assets.length > 0) {
    const assetLines = input.assets
      .map((asset) => `![${asset.alt}](${asset.url})`)
      .join("\n\n");
    sections.push(assetLines);
  }

  // --- About Me ---
  sections.push(renderAboutSection(input.about, input.goals));

  // --- My Journey ---
  const journey = renderJourneySection(
    input.journeySummary,
    input.recentlyActiveRepos,
  );
  if (journey) {
    sections.push(journey);
  }

  // --- Featured Projects ---
  const projects = renderProjectsSection(input.featuredProjects);
  if (projects) {
    sections.push(projects);
  }

  // --- Stats ---
  const stats = renderStatsSection(
    input.languages,
    input.totalStars,
    input.totalForks,
    input.totalRepos,
  );
  if (stats) {
    sections.push(stats);
  }

  // --- Footer ---
  sections.push("---");
  sections.push("*Generated with [Gitglow](https://gitglow.dev)*");

  return sections.join("\n\n") + "\n";
}

// ---------------------------------------------------------------------------
// ProfileModel -> ReadmeInput mapping
// ---------------------------------------------------------------------------

/**
 * Map a full `ProfileModel` to a `ReadmeInput` suitable for the composer.
 *
 * This keeps the composer decoupled from the ProfileModel shape while
 * providing a convenient one-liner for production use.
 *
 * @param model - The structured profile model.
 * @returns A ReadmeInput ready to pass to `composeReadme`.
 */
export function profileModelToReadmeInput(model: ProfileModel): ReadmeInput {
  return {
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
    // assets are not part of ProfileModel — they come from the asset pipeline
  };
}
