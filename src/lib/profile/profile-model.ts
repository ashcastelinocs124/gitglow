/**
 * Structured profile model builder.
 *
 * `buildProfileModel` is a **pure function** that assembles the central
 * data structure consumed by the README composer and asset generator.
 * It combines GitHub data (NormalizedProfile + NormalizedRepository[]),
 * narrative inputs (QuestionnaireData), and the user's featured project
 * selections into a single, well-typed `ProfileModel`.
 *
 * No database, network, or side-effect access — trivially testable.
 */

import type {
  NormalizedProfile,
  NormalizedRepository,
} from "@/lib/github/import-profile";
import type { QuestionnaireData } from "@/lib/profile/questionnaire";
import { chooseFeaturedProjects } from "@/lib/profile/featured-projects";
import type { SelectableRepository } from "@/lib/profile/featured-projects";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeaturedProjectEntry {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  /** Constructed URL: https://github.com/{ownerLogin}/{name} */
  url: string;
}

export interface LanguageEntry {
  name: string;
  repoCount: number;
}

export interface ProfileModel {
  // Identity
  login: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;

  // Narrative
  headline: string;
  aboutSummary: string;
  developerArchetype: string;
  goals: string;
  experienceOutsideGitHub: string | null;
  voiceNotes: string | null;

  // Metrics (refresh-safe — recomputed from repo data)
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  followers: number;
  following: number;

  // Language breakdown (refresh-safe)
  languages: LanguageEntry[];
  topLanguage: string | null;

  // Featured projects
  featuredProjects: FeaturedProjectEntry[];

  // Activity signals
  recentlyActiveRepos: string[];

  // Metadata
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export interface BuildProfileModelInput {
  profile: NormalizedProfile;
  repositories: NormalizedRepository[];
  narrative: QuestionnaireData;
  featuredProjectIds: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of days within which a repo is considered "recently active". */
const RECENTLY_ACTIVE_DAYS = 90;

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build a structured `ProfileModel` from GitHub data, narrative inputs,
 * and the user's featured project selections.
 */
export function buildProfileModel(input: BuildProfileModelInput): ProfileModel {
  const { profile, repositories, narrative, featuredProjectIds } = input;

  const displayName = profile.name ?? profile.login;

  // --- Narrative ---
  const developerArchetype =
    narrative.archetype || inferArchetypeFromLanguages(repositories);
  const headline = `Hi, I'm ${displayName} — a ${developerArchetype} engineer`;
  const aboutSummary = narrative.bio;
  const goals = narrative.goals;
  const experienceOutsideGitHub = narrative.experienceOutsideGitHub ?? null;
  const voiceNotes = narrative.voiceNotes ?? null;

  // --- Metrics ---
  const totalStars = repositories.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = repositories.reduce((sum, r) => sum + r.forks, 0);
  const totalRepos = repositories.length;

  // --- Language breakdown ---
  const languages = computeLanguageBreakdown(repositories);
  const topLanguage = languages.length > 0 ? languages[0].name : null;

  // --- Featured projects ---
  const selectableRepos = toSelectableRepositories(repositories);
  const chosen = chooseFeaturedProjects(selectableRepos, featuredProjectIds);
  const repoByGithubId = new Map(repositories.map((r) => [r.githubRepoId, r]));
  const featuredProjects = chosen.map((sel) => {
    const original = repoByGithubId.get(sel.id)!;
    return toFeaturedProjectEntry(original);
  });

  // --- Recently active repos ---
  const cutoff = new Date(
    Date.now() - RECENTLY_ACTIVE_DAYS * 24 * 60 * 60 * 1000,
  );
  const recentlyActiveRepos = repositories
    .filter((r) => r.pushedAt !== null && r.pushedAt >= cutoff)
    .map((r) => r.name);

  return {
    // Identity
    login: profile.login,
    displayName,
    avatarUrl: profile.avatarUrl ?? null,
    profileUrl: profile.profileUrl ?? null,

    // Narrative
    headline,
    aboutSummary,
    developerArchetype,
    goals,
    experienceOutsideGitHub,
    voiceNotes,

    // Metrics
    totalStars,
    totalForks,
    totalRepos,
    followers: profile.followers,
    following: profile.following,

    // Languages
    languages,
    topLanguage,

    // Featured
    featuredProjects,

    // Activity
    recentlyActiveRepos,

    // Metadata
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers (internal)
// ---------------------------------------------------------------------------

/**
 * Convert NormalizedRepository[] to SelectableRepository[] so we can
 * pass them to `chooseFeaturedProjects`.
 */
function toSelectableRepositories(
  repos: NormalizedRepository[],
): SelectableRepository[] {
  return repos.map((r) => ({
    id: r.githubRepoId,
    name: r.name,
    stars: r.stars,
    description: r.description,
    primaryLanguage: r.primaryLanguage,
    isPinned: r.isPinned,
  }));
}

/**
 * Convert a NormalizedRepository into a FeaturedProjectEntry.
 */
function toFeaturedProjectEntry(repo: NormalizedRepository): FeaturedProjectEntry {
  return {
    name: repo.name,
    description: repo.description,
    language: repo.primaryLanguage,
    stars: repo.stars,
    forks: repo.forks,
    url: `https://github.com/${repo.ownerLogin}/${repo.name}`,
  };
}

/**
 * Compute language breakdown: count repos per primary language,
 * sorted descending by repo count. Repos with null language are excluded.
 */
function computeLanguageBreakdown(
  repos: NormalizedRepository[],
): LanguageEntry[] {
  const counts = new Map<string, number>();

  for (const repo of repos) {
    if (repo.primaryLanguage === null) continue;
    counts.set(
      repo.primaryLanguage,
      (counts.get(repo.primaryLanguage) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([name, repoCount]) => ({ name, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount);
}

/**
 * Fallback archetype inference when the user did not select one.
 * Uses the most common primary language to guess a category.
 */
function inferArchetypeFromLanguages(
  repos: NormalizedRepository[],
): string {
  const breakdown = computeLanguageBreakdown(repos);
  if (breakdown.length === 0) return "fullstack";

  const top = breakdown[0].name.toLowerCase();

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
