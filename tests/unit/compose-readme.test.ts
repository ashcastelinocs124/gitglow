import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Helpers — build test fixtures
// ---------------------------------------------------------------------------

import type { ReadmeInput } from "@/lib/readme/compose-readme";

function makeMinimalInput(overrides: Partial<ReadmeInput> = {}): ReadmeInput {
  return {
    headline: "Hi, I'm Ash",
    about: "I build systems",
    ...overrides,
  };
}

function makeFullInput(): ReadmeInput {
  return {
    headline: "Hi, I'm Ash — a backend engineer",
    about: "I build robust backend systems and APIs.",
    goals: "Contribute more to open source in 2026.",
    journeySummary: "Started coding in college, fell in love with distributed systems.",
    featuredProjects: [
      {
        name: "api-gateway",
        description: "A high-performance API gateway",
        language: "Go",
        stars: 120,
        url: "https://github.com/ash/api-gateway",
      },
      {
        name: "data-pipeline",
        description: null,
        language: "Python",
        stars: 45,
        url: "https://github.com/ash/data-pipeline",
      },
    ],
    languages: [
      { name: "Go", repoCount: 8 },
      { name: "Python", repoCount: 5 },
      { name: "TypeScript", repoCount: 3 },
    ],
    totalStars: 200,
    totalForks: 50,
    totalRepos: 16,
    recentlyActiveRepos: ["api-gateway", "dotfiles", "notes"],
    assets: [
      { alt: "Activity graph", url: "https://example.com/activity.png" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Core composition tests
// ---------------------------------------------------------------------------

describe("README composition", () => {
  it("renders GitHub-flavored markdown with headline and about", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme({
      headline: "Hi, I'm Ash",
      about: "I build systems",
    });

    expect(markdown).toContain("Hi, I'm Ash");
    expect(markdown).toContain("I build systems");
  });

  it("renders with no assets", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeMinimalInput());

    expect(markdown).toContain("Hi, I'm Ash");
    expect(markdown).toContain("I build systems");
    expect(markdown).not.toContain("![");
  });

  it("renders featured projects with name, stars, and description", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        featuredProjects: [
          {
            name: "cool-lib",
            description: "A very cool library",
            language: "TypeScript",
            stars: 42,
            url: "https://github.com/ash/cool-lib",
          },
        ],
      }),
    );

    expect(markdown).toContain("cool-lib");
    expect(markdown).toContain("A very cool library");
    expect(markdown).toContain("42");
    expect(markdown).toContain("https://github.com/ash/cool-lib");
  });

  it("renders languages and stats section", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        languages: [
          { name: "Rust", repoCount: 5 },
          { name: "Go", repoCount: 3 },
        ],
        totalStars: 100,
        totalForks: 20,
        totalRepos: 8,
      }),
    );

    expect(markdown).toContain("Rust");
    expect(markdown).toContain("Go");
    expect(markdown).toContain("100");
    expect(markdown).toContain("20");
    expect(markdown).toContain("8");
  });

  it("works with minimal input (just headline + about)", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme({
      headline: "Hello World",
      about: "I write code.",
    });

    expect(markdown).toContain("Hello World");
    expect(markdown).toContain("I write code.");
    // Should not throw or produce empty output
    expect(markdown.length).toBeGreaterThan(0);
  });

  it("includes goals in the about section when provided", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        goals: "Ship more open source projects",
      }),
    );

    expect(markdown).toContain("Ship more open source projects");
  });

  it("includes journey summary when provided", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        journeySummary: "Started coding at age 12 with BASIC.",
      }),
    );

    expect(markdown).toContain("Started coding at age 12 with BASIC.");
  });

  it("includes recently active repos in journey section", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        journeySummary: "Always learning.",
        recentlyActiveRepos: ["project-alpha", "project-beta"],
      }),
    );

    expect(markdown).toContain("project-alpha");
    expect(markdown).toContain("project-beta");
  });
});

// ---------------------------------------------------------------------------
// Section ordering
// ---------------------------------------------------------------------------

describe("section ordering", () => {
  it("headline comes before about", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    const headlinePos = markdown.indexOf("Hi, I'm Ash");
    const aboutPos = markdown.indexOf("## About Me");

    expect(headlinePos).toBeLessThan(aboutPos);
  });

  it("about comes before journey", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    const aboutPos = markdown.indexOf("## About Me");
    const journeyPos = markdown.indexOf("## My Journey");

    expect(aboutPos).toBeLessThan(journeyPos);
  });

  it("featured projects comes before journey", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    const projectsPos = markdown.indexOf("## Projects I'm working on");
    const journeyPos = markdown.indexOf("## My Journey");

    expect(projectsPos).toBeLessThan(journeyPos);
  });

  it("journey comes before stats", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    const journeyPos = markdown.indexOf("## My Journey");
    const statsPos = markdown.indexOf("## GitHub Statistics");

    expect(journeyPos).toBeLessThan(statsPos);
  });

  it("about comes first after headline", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    const headlinePos = markdown.indexOf("Hi, I'm Ash");
    const aboutPos = markdown.indexOf("## About Me");

    expect(headlinePos).toBeLessThan(aboutPos);
  });
});

// ---------------------------------------------------------------------------
// profileModelToReadmeInput mapping
// ---------------------------------------------------------------------------

describe("profileModelToReadmeInput", () => {
  it("maps ProfileModel fields to ReadmeInput", async () => {
    const { profileModelToReadmeInput } = await import(
      "@/lib/readme/compose-readme"
    );
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    // Build a ProfileModel from real builder to ensure compatibility
    const model = buildProfileModel({
      profile: {
        login: "ash",
        name: "Ash Dev",
        bio: "I code things",
        avatarUrl: "https://github.com/ash.png",
        profileUrl: "https://github.com/ash",
        followers: 10,
        following: 5,
        publicRepos: 3,
      },
      repositories: [
        {
          githubRepoId: "1",
          name: "my-project",
          ownerLogin: "ash",
          description: "A cool project",
          primaryLanguage: "TypeScript",
          stars: 30,
          forks: 5,
          isPinned: true,
          pushedAt: new Date(),
        },
      ],
      narrative: {
        bio: "Backend engineer",
        goals: "Learn Rust",
        archetype: "backend",
      },
      featuredProjectIds: ["1"],
    });

    const input = profileModelToReadmeInput(model);

    expect(input.headline).toBe(model.headline);
    expect(input.about).toBe(model.aboutSummary);
    expect(input.goals).toBe(model.goals);
    expect(input.totalStars).toBe(model.totalStars);
    expect(input.totalForks).toBe(model.totalForks);
    expect(input.totalRepos).toBe(model.totalRepos);
    expect(input.languages).toEqual(model.languages);
    expect(input.featuredProjects).toHaveLength(1);
    expect(input.featuredProjects![0].name).toBe("my-project");
    expect(input.recentlyActiveRepos).toEqual(model.recentlyActiveRepos);
  });

  it("maps experienceOutsideGitHub to journeySummary", async () => {
    const { profileModelToReadmeInput } = await import(
      "@/lib/readme/compose-readme"
    );
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: {
        login: "ash",
        name: "Ash",
        bio: null,
        avatarUrl: null,
        profileUrl: null,
        followers: 0,
        following: 0,
        publicRepos: 0,
      },
      repositories: [],
      narrative: {
        bio: "coder",
        goals: "grow",
        archetype: "fullstack",
        experienceOutsideGitHub: "10 years in enterprise Java",
      },
      featuredProjectIds: [],
    });

    const input = profileModelToReadmeInput(model);

    expect(input.journeySummary).toBe("10 years in enterprise Java");
  });

  it("sets journeySummary to undefined when experienceOutsideGitHub is null", async () => {
    const { profileModelToReadmeInput } = await import(
      "@/lib/readme/compose-readme"
    );
    const { buildProfileModel } = await import("@/lib/profile/profile-model");

    const model = buildProfileModel({
      profile: {
        login: "ash",
        name: "Ash",
        bio: null,
        avatarUrl: null,
        profileUrl: null,
        followers: 0,
        following: 0,
        publicRepos: 0,
      },
      repositories: [],
      narrative: {
        bio: "coder",
        goals: "grow",
        archetype: "fullstack",
      },
      featuredProjectIds: [],
    });

    const input = profileModelToReadmeInput(model);

    expect(input.journeySummary).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// No HTML in output (pure GFM)
// ---------------------------------------------------------------------------

describe("GFM compliance", () => {
  it("output contains no HTML tags", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeFullInput());

    // Match any HTML tag pattern like <div>, <br/>, <img src="...">, etc.
    const htmlTagPattern = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\/?>/;
    expect(markdown).not.toMatch(htmlTagPattern);
  });

  it("projects with null description do not produce empty content", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        featuredProjects: [
          {
            name: "no-desc",
            description: null,
            language: "Rust",
            stars: 10,
            url: "https://github.com/ash/no-desc",
          },
        ],
      }),
    );

    expect(markdown).toContain("no-desc");
    // Should not have empty table cells or broken formatting
    expect(markdown).not.toContain("||");
  });

  it("projects with null language render gracefully", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(
      makeMinimalInput({
        featuredProjects: [
          {
            name: "mystery-lang",
            description: "Unknown language project",
            language: null,
            stars: 5,
            url: "https://github.com/ash/mystery-lang",
          },
        ],
      }),
    );

    expect(markdown).toContain("mystery-lang");
  });
});

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

describe("footer", () => {
  it("includes a Gitglow attribution footer", async () => {
    const { composeReadme } = await import("@/lib/readme/compose-readme");

    const markdown = composeReadme(makeMinimalInput());

    expect(markdown).toContain("Gitglow");
  });
});
