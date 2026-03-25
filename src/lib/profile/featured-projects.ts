/**
 * Featured project selection logic.
 *
 * Pure functions for choosing and suggesting featured projects from a
 * user's imported repositories.  No database or network access — these
 * operate entirely on in-memory data so they are trivially testable.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectableRepository {
  id: string;
  name: string;
  stars: number;
  description?: string | null;
  primaryLanguage?: string | null;
  isPinned?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of featured projects a user can select. */
export const MAX_FEATURED_PROJECTS = 6;

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Return the subset of `repos` whose `id` appears in `selectedIds`.
 *
 * - Preserves the order of `selectedIds` (not `repos`).
 * - Silently ignores IDs that do not match any repository.
 * - Clamps the result to `MAX_FEATURED_PROJECTS` entries — if the caller
 *   passes more IDs than the limit, only the first N are kept.
 */
export function chooseFeaturedProjects(
  repos: SelectableRepository[],
  selectedIds: string[],
): SelectableRepository[] {
  const repoById = new Map(repos.map((r) => [r.id, r]));

  const result: SelectableRepository[] = [];

  for (const id of selectedIds) {
    if (result.length >= MAX_FEATURED_PROJECTS) break;
    const repo = repoById.get(id);
    if (repo) {
      result.push(repo);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Suggestion
// ---------------------------------------------------------------------------

/**
 * Auto-suggest the best repos to feature.
 *
 * Ranking heuristic (higher = better):
 *   1. Pinned repos are boosted — they appear first regardless of stars.
 *   2. Within each group (pinned / unpinned), repos are sorted by stars
 *      descending.
 *
 * Returns at most `limit` repos (default `MAX_FEATURED_PROJECTS`).
 */
export function suggestFeaturedProjects(
  repos: SelectableRepository[],
  limit: number = MAX_FEATURED_PROJECTS,
): SelectableRepository[] {
  if (repos.length === 0) return [];

  const effectiveLimit = Math.min(limit, MAX_FEATURED_PROJECTS);

  // Separate pinned from unpinned, sort each group by stars desc
  const pinned = repos
    .filter((r) => r.isPinned)
    .sort((a, b) => b.stars - a.stars);

  const unpinned = repos
    .filter((r) => !r.isPinned)
    .sort((a, b) => b.stars - a.stars);

  // Pinned first, then fill remaining slots with highest-star unpinned
  return [...pinned, ...unpinned].slice(0, effectiveLimit);
}
