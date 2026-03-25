import { describe, expect, it } from "vitest";

import type { SelectableRepository } from "@/lib/profile/featured-projects";

// ---------------------------------------------------------------------------
// Helpers — build test fixtures
// ---------------------------------------------------------------------------

function makeRepo(
  overrides: Partial<SelectableRepository> & { id: string; name: string },
): SelectableRepository {
  return {
    stars: 0,
    description: null,
    primaryLanguage: null,
    isPinned: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// chooseFeaturedProjects
// ---------------------------------------------------------------------------

describe("chooseFeaturedProjects", () => {
  it("filters repos by selected IDs and returns matching subset", async () => {
    const { chooseFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "1", name: "repo-a", stars: 3 }),
      makeRepo({ id: "2", name: "repo-b", stars: 10 }),
      makeRepo({ id: "3", name: "repo-c", stars: 4 }),
    ];

    const chosen = chooseFeaturedProjects(repos, ["2", "3"]);

    expect(chosen).toHaveLength(2);
    expect(chosen.map((r) => r.id)).toEqual(["2", "3"]);
  });

  it("returns empty array when no IDs are selected", async () => {
    const { chooseFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "1", name: "repo-a", stars: 5 }),
    ];

    const chosen = chooseFeaturedProjects(repos, []);
    expect(chosen).toHaveLength(0);
  });

  it("returns empty array when repos list is empty", async () => {
    const { chooseFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const chosen = chooseFeaturedProjects([], ["1", "2"]);
    expect(chosen).toHaveLength(0);
  });

  it("ignores selected IDs that do not match any repo", async () => {
    const { chooseFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "1", name: "repo-a", stars: 5 }),
    ];

    const chosen = chooseFeaturedProjects(repos, ["999"]);
    expect(chosen).toHaveLength(0);
  });

  it("clamps selection to MAX_FEATURED_PROJECTS", async () => {
    const { chooseFeaturedProjects, MAX_FEATURED_PROJECTS } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = Array.from({ length: 10 }, (_, i) =>
      makeRepo({ id: String(i + 1), name: `repo-${i + 1}`, stars: i }),
    );
    const allIds = repos.map((r) => r.id);

    const chosen = chooseFeaturedProjects(repos, allIds);
    expect(chosen.length).toBeLessThanOrEqual(MAX_FEATURED_PROJECTS);
    expect(chosen).toHaveLength(MAX_FEATURED_PROJECTS);
  });

  it("preserves order of selectedIds", async () => {
    const { chooseFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "a", name: "alpha" }),
      makeRepo({ id: "b", name: "bravo" }),
      makeRepo({ id: "c", name: "charlie" }),
    ];

    const chosen = chooseFeaturedProjects(repos, ["c", "a"]);
    expect(chosen.map((r) => r.id)).toEqual(["c", "a"]);
  });
});

// ---------------------------------------------------------------------------
// suggestFeaturedProjects
// ---------------------------------------------------------------------------

describe("suggestFeaturedProjects", () => {
  it("suggests top repos by stars, limited to default limit", async () => {
    const { suggestFeaturedProjects, MAX_FEATURED_PROJECTS } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = Array.from({ length: 10 }, (_, i) =>
      makeRepo({ id: String(i + 1), name: `repo-${i + 1}`, stars: i * 2 }),
    );

    const suggested = suggestFeaturedProjects(repos);

    expect(suggested.length).toBeLessThanOrEqual(MAX_FEATURED_PROJECTS);
    // Should include the highest-star repos
    expect(suggested[0].stars).toBeGreaterThanOrEqual(suggested[1].stars);
  });

  it("prioritises pinned repos in suggestions", async () => {
    const { suggestFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "1", name: "low-stars-pinned", stars: 1, isPinned: true }),
      makeRepo({ id: "2", name: "high-stars", stars: 100 }),
      makeRepo({ id: "3", name: "mid-stars", stars: 50 }),
    ];

    const suggested = suggestFeaturedProjects(repos, 2);

    // The pinned repo should appear in the suggestions despite low stars
    const suggestedIds = suggested.map((r) => r.id);
    expect(suggestedIds).toContain("1");
  });

  it("returns empty array for empty input", async () => {
    const { suggestFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const suggested = suggestFeaturedProjects([]);
    expect(suggested).toHaveLength(0);
  });

  it("returns fewer than limit when not enough repos exist", async () => {
    const { suggestFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = [
      makeRepo({ id: "1", name: "only-one", stars: 5 }),
    ];

    const suggested = suggestFeaturedProjects(repos, 6);
    expect(suggested).toHaveLength(1);
  });

  it("respects custom limit parameter", async () => {
    const { suggestFeaturedProjects } = await import(
      "@/lib/profile/featured-projects"
    );

    const repos = Array.from({ length: 10 }, (_, i) =>
      makeRepo({ id: String(i + 1), name: `repo-${i + 1}`, stars: i }),
    );

    const suggested = suggestFeaturedProjects(repos, 3);
    expect(suggested).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// MAX_FEATURED_PROJECTS constant
// ---------------------------------------------------------------------------

describe("MAX_FEATURED_PROJECTS", () => {
  it("is exported and equals 6", async () => {
    const { MAX_FEATURED_PROJECTS } = await import(
      "@/lib/profile/featured-projects"
    );
    expect(MAX_FEATURED_PROJECTS).toBe(6);
  });
});
