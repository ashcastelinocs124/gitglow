import { describe, expect, it } from "vitest";

import type { NormalizedProfile, NormalizedRepository } from "@/lib/github/import-profile";
import type { QuestionnaireData } from "@/lib/profile/questionnaire";

// ---------------------------------------------------------------------------
// Helpers — build test fixtures
// ---------------------------------------------------------------------------

function makeProfile(
  overrides: Partial<NormalizedProfile> = {},
): NormalizedProfile {
  return {
    login: "octocat",
    name: "Octo Cat",
    bio: "I code",
    avatarUrl: "https://github.com/octocat.png",
    profileUrl: "https://github.com/octocat",
    followers: 10,
    following: 5,
    publicRepos: 3,
    ...overrides,
  };
}

function makeRepo(
  overrides: Partial<NormalizedRepository> & {
    githubRepoId: string;
    name: string;
  },
): NormalizedRepository {
  return {
    ownerLogin: "octocat",
    description: null,
    primaryLanguage: null,
    stars: 0,
    forks: 0,
    isPinned: false,
    pushedAt: null,
    ...overrides,
  };
}

function makeNarrative(
  overrides: Partial<QuestionnaireData> = {},
): QuestionnaireData {
  return {
    bio: "Backend engineer who loves APIs",
    goals: "Show growth as a developer",
    archetype: "backend",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildProfileModel — core assembly
// ---------------------------------------------------------------------------

describe("buildProfileModel", () => {
  it("combines GitHub data and narrative inputs into a stable profile model", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({
          githubRepoId: "1",
          name: "hello-world",
          description: "A repo",
          primaryLanguage: "JavaScript",
          stars: 10,
          forks: 2,
        }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: ["1"],
    });

    expect(model.developerArchetype).toBe("backend");
    expect(model.featuredProjects).toHaveLength(1);
    expect(model.login).toBe("octocat");
    expect(model.displayName).toBe("Octo Cat");
  });

  it("uses login as displayName when name is null", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile({ name: null }),
      repositories: [],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.displayName).toBe("octocat");
  });

  it("handles empty repositories gracefully", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.totalStars).toBe(0);
    expect(model.totalForks).toBe(0);
    expect(model.totalRepos).toBe(0);
    expect(model.languages).toHaveLength(0);
    expect(model.topLanguage).toBeNull();
    expect(model.featuredProjects).toHaveLength(0);
    expect(model.recentlyActiveRepos).toHaveLength(0);
  });

  it("handles sparse narrative (no optional fields)", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [],
      narrative: {
        bio: "Coder",
        goals: "Learn",
        archetype: "fullstack",
      },
      featuredProjectIds: [],
    });

    expect(model.developerArchetype).toBe("fullstack");
    expect(model.experienceOutsideGitHub).toBeNull();
    expect(model.voiceNotes).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Headline generation
// ---------------------------------------------------------------------------

describe("headline generation", () => {
  it("generates headline from name and archetype", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile({ name: "Jane Dev" }),
      repositories: [],
      narrative: makeNarrative({ archetype: "frontend" }),
      featuredProjectIds: [],
    });

    expect(model.headline).toContain("Jane Dev");
    expect(model.headline).toContain("frontend");
  });

  it("uses login in headline when name is null", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile({ name: null, login: "janedev" }),
      repositories: [],
      narrative: makeNarrative({ archetype: "devops" }),
      featuredProjectIds: [],
    });

    expect(model.headline).toContain("janedev");
    expect(model.headline).toContain("devops");
  });
});

// ---------------------------------------------------------------------------
// Language breakdown
// ---------------------------------------------------------------------------

describe("language breakdown", () => {
  it("computes language breakdown by counting repos per language", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1", primaryLanguage: "TypeScript" }),
        makeRepo({ githubRepoId: "2", name: "r2", primaryLanguage: "TypeScript" }),
        makeRepo({ githubRepoId: "3", name: "r3", primaryLanguage: "Python" }),
        makeRepo({ githubRepoId: "4", name: "r4", primaryLanguage: null }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.languages).toHaveLength(2);

    const tsEntry = model.languages.find((l) => l.name === "TypeScript");
    expect(tsEntry).toBeDefined();
    expect(tsEntry!.repoCount).toBe(2);

    const pyEntry = model.languages.find((l) => l.name === "Python");
    expect(pyEntry).toBeDefined();
    expect(pyEntry!.repoCount).toBe(1);
  });

  it("sorts languages by repo count descending", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1", primaryLanguage: "Go" }),
        makeRepo({ githubRepoId: "2", name: "r2", primaryLanguage: "Rust" }),
        makeRepo({ githubRepoId: "3", name: "r3", primaryLanguage: "Rust" }),
        makeRepo({ githubRepoId: "4", name: "r4", primaryLanguage: "Rust" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.languages[0].name).toBe("Rust");
    expect(model.languages[0].repoCount).toBe(3);
    expect(model.languages[1].name).toBe("Go");
    expect(model.languages[1].repoCount).toBe(1);
  });

  it("sets topLanguage to the most-used language", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1", primaryLanguage: "Java" }),
        makeRepo({ githubRepoId: "2", name: "r2", primaryLanguage: "Java" }),
        makeRepo({ githubRepoId: "3", name: "r3", primaryLanguage: "Kotlin" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.topLanguage).toBe("Java");
  });

  it("sets topLanguage to null when no repos have languages", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1", primaryLanguage: null }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.topLanguage).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Metrics aggregation
// ---------------------------------------------------------------------------

describe("metrics aggregation", () => {
  it("sums totalStars and totalForks across all repos", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1", stars: 10, forks: 3 }),
        makeRepo({ githubRepoId: "2", name: "r2", stars: 25, forks: 7 }),
        makeRepo({ githubRepoId: "3", name: "r3", stars: 5, forks: 0 }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.totalStars).toBe(40);
    expect(model.totalForks).toBe(10);
  });

  it("derives totalRepos from repositories array length", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile({ publicRepos: 100 }),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "r1" }),
        makeRepo({ githubRepoId: "2", name: "r2" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    // totalRepos should reflect repositories array, not publicRepos
    expect(model.totalRepos).toBe(2);
  });

  it("carries through followers and following from profile", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile({ followers: 42, following: 17 }),
      repositories: [],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.followers).toBe(42);
    expect(model.following).toBe(17);
  });
});

// ---------------------------------------------------------------------------
// Featured projects
// ---------------------------------------------------------------------------

describe("featured projects", () => {
  it("filters and maps featured projects by ID", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({
          githubRepoId: "1",
          name: "alpha",
          ownerLogin: "octocat",
          description: "First project",
          primaryLanguage: "TypeScript",
          stars: 50,
          forks: 12,
        }),
        makeRepo({
          githubRepoId: "2",
          name: "bravo",
          ownerLogin: "octocat",
          description: "Second project",
          primaryLanguage: "Python",
          stars: 30,
          forks: 5,
        }),
        makeRepo({ githubRepoId: "3", name: "charlie" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: ["2", "1"],
    });

    expect(model.featuredProjects).toHaveLength(2);
    // Order should follow selectedIds order (from chooseFeaturedProjects)
    expect(model.featuredProjects[0].name).toBe("bravo");
    expect(model.featuredProjects[1].name).toBe("alpha");
  });

  it("constructs URLs for featured projects from ownerLogin/name", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "my-repo", ownerLogin: "octocat" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: ["1"],
    });

    expect(model.featuredProjects[0].url).toBe(
      "https://github.com/octocat/my-repo",
    );
  });

  it("ignores featured IDs that do not match any repository", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "only-repo" }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: ["1", "999"],
    });

    expect(model.featuredProjects).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Recently active repos
// ---------------------------------------------------------------------------

describe("recently active repos", () => {
  it("includes repos pushed within the last 90 days", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneHundredDaysAgo = new Date(
      now.getTime() - 100 * 24 * 60 * 60 * 1000,
    );

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({
          githubRepoId: "1",
          name: "recent-repo",
          pushedAt: thirtyDaysAgo,
        }),
        makeRepo({
          githubRepoId: "2",
          name: "stale-repo",
          pushedAt: oneHundredDaysAgo,
        }),
        makeRepo({
          githubRepoId: "3",
          name: "no-push-repo",
          pushedAt: null,
        }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.recentlyActiveRepos).toContain("recent-repo");
    expect(model.recentlyActiveRepos).not.toContain("stale-repo");
    expect(model.recentlyActiveRepos).not.toContain("no-push-repo");
  });

  it("returns empty array when no repos are recently active", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const longAgo = new Date("2020-01-01");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [
        makeRepo({ githubRepoId: "1", name: "old", pushedAt: longAgo }),
      ],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    expect(model.recentlyActiveRepos).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// aboutSummary and goals
// ---------------------------------------------------------------------------

describe("aboutSummary and goals", () => {
  it("derives aboutSummary from narrative bio and goals", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [],
      narrative: makeNarrative({
        bio: "Systems programmer",
        goals: "Contribute to open source",
      }),
      featuredProjectIds: [],
    });

    expect(model.aboutSummary).toContain("Systems programmer");
    expect(model.goals).toBe("Contribute to open source");
  });
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe("metadata", () => {
  it("sets generatedAt to a valid ISO timestamp", async () => {
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const before = new Date().toISOString();

    const model = buildProfileModel({
      profile: makeProfile(),
      repositories: [],
      narrative: makeNarrative(),
      featuredProjectIds: [],
    });

    const after = new Date().toISOString();

    // generatedAt should be a valid ISO string between before and after
    expect(model.generatedAt).toBeDefined();
    expect(model.generatedAt >= before).toBe(true);
    expect(model.generatedAt <= after).toBe(true);
  });
});
