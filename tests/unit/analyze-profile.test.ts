import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type {
  NormalizedImportPayload,
  NormalizedProfile,
  NormalizedRepository,
} from "@/lib/github/import-profile";

// ---------------------------------------------------------------------------
// Helpers -- build test fixtures
// ---------------------------------------------------------------------------

function makeProfile(
  overrides: Partial<NormalizedProfile> = {},
): NormalizedProfile {
  return {
    login: "octocat",
    name: "Octo Cat",
    bio: "I code things",
    avatarUrl: "https://github.com/octocat.png",
    profileUrl: "https://github.com/octocat",
    followers: 100,
    following: 50,
    publicRepos: 10,
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

function makeImportData(
  overrides: Partial<NormalizedImportPayload> = {},
): NormalizedImportPayload {
  return {
    profile: makeProfile(),
    repositories: [
      makeRepo({
        githubRepoId: "1",
        name: "awesome-project",
        description: "A really cool project",
        primaryLanguage: "TypeScript",
        stars: 120,
        forks: 15,
        isPinned: true,
        pushedAt: new Date("2026-03-01"),
      }),
      makeRepo({
        githubRepoId: "2",
        name: "side-project",
        description: "Experimental stuff",
        primaryLanguage: "Python",
        stars: 30,
        forks: 5,
        isPinned: false,
        pushedAt: new Date("2026-02-15"),
      }),
      makeRepo({
        githubRepoId: "3",
        name: "utils-lib",
        description: null,
        primaryLanguage: "TypeScript",
        stars: 5,
        forks: 0,
        isPinned: false,
        pushedAt: new Date("2025-12-01"),
      }),
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

describe("module exports", () => {
  it("exports analyzeProfile and buildAnalysisPrompt", async () => {
    const mod = await import("@/lib/analysis/analyze-profile");

    expect(typeof mod.analyzeProfile).toBe("function");
    expect(typeof mod.buildAnalysisPrompt).toBe("function");
    expect(typeof mod.parseAnalysisResponse).toBe("function");
    expect(typeof mod.buildFallbackAnalysis).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// buildAnalysisPrompt
// ---------------------------------------------------------------------------

describe("buildAnalysisPrompt", () => {
  it("includes repo data in output", async () => {
    const { buildAnalysisPrompt } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();
    const prompt = buildAnalysisPrompt(importData);

    // Should include profile info
    expect(prompt).toContain("octocat");
    expect(prompt).toContain("Octo Cat");

    // Should include repo names
    expect(prompt).toContain("awesome-project");
    expect(prompt).toContain("side-project");
    expect(prompt).toContain("utils-lib");

    // Should include languages
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Python");

    // Should include star counts
    expect(prompt).toContain("120");
    expect(prompt).toContain("30");
  });

  it("includes instructions for JSON output shape", async () => {
    const { buildAnalysisPrompt } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();
    const prompt = buildAnalysisPrompt(importData);

    // Should mention the expected fields
    expect(prompt).toContain("headline");
    expect(prompt).toContain("bio");
    expect(prompt).toContain("archetype");
    expect(prompt).toContain("featuredProjectIds");
    expect(prompt).toContain("visualSuggestions");
  });

  it("handles empty repositories", async () => {
    const { buildAnalysisPrompt } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData({ repositories: [] });
    const prompt = buildAnalysisPrompt(importData);

    expect(prompt).toContain("octocat");
    // Should still be a valid string
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseAnalysisResponse
// ---------------------------------------------------------------------------

describe("parseAnalysisResponse", () => {
  it("extracts structured fields from valid JSON", async () => {
    const { parseAnalysisResponse } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const validJson = JSON.stringify({
      headline: "Hi, I'm Octo Cat -- a fullstack developer",
      bio: "Passionate TypeScript developer building web tools",
      goals: "Build impactful open source projects",
      archetype: "fullstack",
      experienceOutsideGitHub: "5 years at a startup",
      featuredProjectIds: ["1", "2"],
      featuredProjectReasons: {
        "1": "Most starred project, showcases TypeScript expertise",
        "2": "Shows breadth with Python skills",
      },
      visualSuggestions: {
        showTimeline: true,
        showLanguageBreakdown: true,
        showActivityCard: false,
        emphasisThemes: ["open-source", "web-development"],
      },
      voiceNotes: "Developer shows strong TypeScript focus",
    });

    const result = parseAnalysisResponse(validJson, importData);

    expect(result.headline).toBe(
      "Hi, I'm Octo Cat -- a fullstack developer",
    );
    expect(result.bio).toBe(
      "Passionate TypeScript developer building web tools",
    );
    expect(result.goals).toBe("Build impactful open source projects");
    expect(result.archetype).toBe("fullstack");
    expect(result.experienceOutsideGitHub).toBe("5 years at a startup");
    expect(result.featuredProjectIds).toEqual(["1", "2"]);
    expect(result.featuredProjectReasons["1"]).toContain("Most starred");
    expect(result.visualSuggestions.showTimeline).toBe(true);
    expect(result.visualSuggestions.showActivityCard).toBe(false);
    expect(result.visualSuggestions.emphasisThemes).toContain("open-source");
    expect(result.voiceNotes).toBe(
      "Developer shows strong TypeScript focus",
    );
  });

  it("returns fallback for malformed JSON", async () => {
    const { parseAnalysisResponse } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = parseAnalysisResponse("not valid json {{{", importData);

    // Should still return a valid AnalysisResult with fallback values
    expect(result.headline).toBeDefined();
    expect(typeof result.headline).toBe("string");
    expect(result.bio).toBeDefined();
    expect(result.archetype).toBeDefined();
    expect(result.featuredProjectIds).toBeDefined();
    expect(Array.isArray(result.featuredProjectIds)).toBe(true);
    expect(result.visualSuggestions).toBeDefined();
    expect(typeof result.visualSuggestions.showTimeline).toBe("boolean");
  });

  it("fills in missing fields with fallback defaults", async () => {
    const { parseAnalysisResponse } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    // Partial JSON -- missing many fields
    const partialJson = JSON.stringify({
      headline: "Custom headline",
      bio: "Custom bio",
    });

    const result = parseAnalysisResponse(partialJson, importData);

    // Provided fields should be kept
    expect(result.headline).toBe("Custom headline");
    expect(result.bio).toBe("Custom bio");

    // Missing fields should have fallback values
    expect(result.archetype).toBeDefined();
    expect(typeof result.archetype).toBe("string");
    expect(result.goals).toBeDefined();
    expect(result.featuredProjectIds).toBeDefined();
    expect(result.visualSuggestions).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// buildFallbackAnalysis
// ---------------------------------------------------------------------------

describe("buildFallbackAnalysis", () => {
  it("produces valid result from import data", async () => {
    const { buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = buildFallbackAnalysis(importData);

    // Headline should contain the user's name
    expect(result.headline).toContain("Octo Cat");

    // Bio should be populated
    expect(typeof result.bio).toBe("string");
    expect(result.bio.length).toBeGreaterThan(0);

    // Goals should be populated
    expect(typeof result.goals).toBe("string");
    expect(result.goals.length).toBeGreaterThan(0);

    // Archetype should be inferred from top language
    expect(typeof result.archetype).toBe("string");
    expect(result.archetype.length).toBeGreaterThan(0);

    // Featured projects should be selected (up to 6, by stars)
    expect(Array.isArray(result.featuredProjectIds)).toBe(true);
    expect(result.featuredProjectIds.length).toBeGreaterThan(0);
    expect(result.featuredProjectIds.length).toBeLessThanOrEqual(6);
    // Top repo by stars is "1" (awesome-project, 120 stars)
    expect(result.featuredProjectIds[0]).toBe("1");

    // Featured project reasons should exist for each featured project
    for (const id of result.featuredProjectIds) {
      expect(result.featuredProjectReasons[id]).toBeDefined();
    }

    // Visual suggestions should default to all true
    expect(result.visualSuggestions.showTimeline).toBe(true);
    expect(result.visualSuggestions.showLanguageBreakdown).toBe(true);
    expect(result.visualSuggestions.showActivityCard).toBe(true);
    expect(Array.isArray(result.visualSuggestions.emphasisThemes)).toBe(true);

    // Voice notes should be a string
    expect(typeof result.voiceNotes).toBe("string");
  });

  it("uses login as name when profile name is null", async () => {
    const { buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData({
      profile: makeProfile({ name: null }),
    });

    const result = buildFallbackAnalysis(importData);
    expect(result.headline).toContain("octocat");
  });

  it("handles empty repositories gracefully", async () => {
    const { buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData({ repositories: [] });

    const result = buildFallbackAnalysis(importData);

    expect(result.archetype).toBe("fullstack");
    expect(result.featuredProjectIds).toHaveLength(0);
    expect(result.visualSuggestions).toBeDefined();
  });

  it("infers archetype from top language", async () => {
    const { buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );

    // Python-heavy repos should infer "backend"
    const importData = makeImportData({
      repositories: [
        makeRepo({
          githubRepoId: "1",
          name: "r1",
          primaryLanguage: "Python",
          stars: 10,
        }),
        makeRepo({
          githubRepoId: "2",
          name: "r2",
          primaryLanguage: "Python",
          stars: 5,
        }),
        makeRepo({
          githubRepoId: "3",
          name: "r3",
          primaryLanguage: "Go",
          stars: 3,
        }),
      ],
    });

    const result = buildFallbackAnalysis(importData);
    expect(result.archetype).toBe("backend");
  });

  it("sets experienceOutsideGitHub to null", async () => {
    const { buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = buildFallbackAnalysis(importData);
    expect(result.experienceOutsideGitHub).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// analyzeProfile
// ---------------------------------------------------------------------------

describe("analyzeProfile", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns fallback when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;

    const { analyzeProfile, buildFallbackAnalysis } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = await analyzeProfile(importData);
    const fallback = buildFallbackAnalysis(importData);

    // Should match the fallback (same structure)
    expect(result.headline).toBe(fallback.headline);
    expect(result.archetype).toBe(fallback.archetype);
    expect(result.featuredProjectIds).toEqual(fallback.featuredProjectIds);
  });

  it("returns fallback when OpenAI call fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";

    // Mock OpenAI to throw
    vi.doMock("openai", () => {
      return {
        default: class MockOpenAI {
          chat = {
            completions: {
              create: vi.fn().mockRejectedValue(new Error("API error")),
            },
          };
        },
      };
    });

    const { analyzeProfile } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = await analyzeProfile(importData);

    // Should still get a valid result (fallback)
    expect(result.headline).toBeDefined();
    expect(result.archetype).toBeDefined();
    expect(result.featuredProjectIds).toBeDefined();
  });

  it("calls OpenAI and parses response when API key is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: "AI-generated headline",
              bio: "AI-generated bio",
              goals: "AI-generated goals",
              archetype: "fullstack",
              experienceOutsideGitHub: null,
              featuredProjectIds: ["1"],
              featuredProjectReasons: { "1": "Best project" },
              visualSuggestions: {
                showTimeline: true,
                showLanguageBreakdown: false,
                showActivityCard: true,
                emphasisThemes: ["ai"],
              },
              voiceNotes: "AI notes",
            }),
          },
        },
      ],
    };

    vi.doMock("openai", () => {
      return {
        default: class MockOpenAI {
          chat = {
            completions: {
              create: vi.fn().mockResolvedValue(mockResponse),
            },
          };
        },
      };
    });

    const { analyzeProfile } = await import(
      "@/lib/analysis/analyze-profile"
    );
    const importData = makeImportData();

    const result = await analyzeProfile(importData);

    expect(result.headline).toBe("AI-generated headline");
    expect(result.bio).toBe("AI-generated bio");
    expect(result.archetype).toBe("fullstack");
  });
});
