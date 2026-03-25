/**
 * GitHub import normalization layer.
 *
 * `normalizeImportPayload` is a **pure function** that transforms the raw
 * shape returned by the GitHub API into the structured data that Gitglow
 * stores in its database.  It is designed to be easily unit-testable without
 * any network calls or database access.
 *
 * `importGitHubProfile` is the higher-level orchestrator that uses the
 * GitHubClient to fetch data and then normalizes it.
 */

import type { RawGitHubRepo, RawGitHubUser } from "./client";
import { GitHubClient } from "./client";

// ---------- Normalized output types ----------

export interface NormalizedProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  followers: number;
  following: number;
  publicRepos: number;
}

export interface NormalizedRepository {
  githubRepoId: string;
  name: string;
  ownerLogin: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  isPinned: boolean;
  pushedAt: Date | null;
}

export interface NormalizedImportPayload {
  profile: NormalizedProfile;
  repositories: NormalizedRepository[];
}

// ---------- Raw payload shape accepted by normalizeImportPayload ----------

/**
 * The raw input shape mirrors the GitHub API response. It includes the
 * user-level fields from the /user endpoint plus a `repos` array from
 * the /user/repos endpoint, and an optional `pinned_repos` list of
 * repository names that the user has pinned on their profile.
 */
export interface RawImportPayload extends RawGitHubUser {
  repos: RawGitHubRepo[];
  pinned_repos?: string[];
}

// ---------- Pure normalization function ----------

/**
 * Transform a raw GitHub API payload into Gitglow's normalized shape.
 *
 * - Handles missing/null fields gracefully with sensible defaults.
 * - Marks repositories as pinned if their name appears in `pinned_repos`.
 * - Converts `pushed_at` ISO strings to Date objects (or null).
 */
export function normalizeImportPayload(
  raw: RawImportPayload,
): NormalizedImportPayload {
  const pinnedSet = new Set(raw.pinned_repos ?? []);

  const profile: NormalizedProfile = {
    login: raw.login,
    name: raw.name ?? null,
    bio: raw.bio ?? null,
    avatarUrl: raw.avatar_url ?? null,
    profileUrl: raw.html_url ?? null,
    followers: raw.followers ?? 0,
    following: raw.following ?? 0,
    publicRepos: raw.public_repos ?? 0,
  };

  const repositories: NormalizedRepository[] = (raw.repos ?? []).map(
    (repo) => ({
      githubRepoId: String(repo.id ?? 0),
      name: repo.name,
      ownerLogin: repo.owner?.login ?? raw.login,
      description: repo.description ?? null,
      primaryLanguage: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      isPinned: pinnedSet.has(repo.name),
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
    }),
  );

  return { profile, repositories };
}

// ---------- Orchestrator (uses network) ----------

/**
 * Full import: fetches data from GitHub and returns normalized payload.
 *
 * This function makes real API calls and should NOT be called in tests
 * unless the GitHubClient is mocked or replaced.
 */
export async function importGitHubProfile(
  accessToken: string,
): Promise<NormalizedImportPayload> {
  const client = new GitHubClient(accessToken);

  const [user, repos] = await Promise.all([
    client.fetchUser(),
    client.fetchRepos(),
  ]);

  const pinnedNames = await client.fetchPinnedRepoNames(user.login);

  return normalizeImportPayload({
    ...user,
    repos,
    pinned_repos: pinnedNames,
  });
}
