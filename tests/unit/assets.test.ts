import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Activity card
// ---------------------------------------------------------------------------

describe("asset generation", () => {
  describe("activity-card", () => {
    it("returns a stable asset payload with storage metadata", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "activity-card",
        data: {
          login: "octocat",
          totalRepos: 10,
          totalStars: 50,
          recentlyActiveRepos: ["repo-a"],
        },
      });

      expect(asset.mimeType).toBe("image/svg+xml");
      expect(asset.storageKey.length).toBeGreaterThan(0);
      expect(asset.content.length).toBeGreaterThan(0);
      expect(asset.kind).toBe("activity-card");
      expect(asset.generatedAt).toBeTruthy();
    });

    it("produces valid SVG content", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "activity-card",
        data: {
          login: "octocat",
          totalRepos: 10,
          totalStars: 50,
          recentlyActiveRepos: ["repo-a"],
        },
      });

      expect(asset.content).toMatch(/^<svg/);
      expect(asset.content).toMatch(/<\/svg>$/);
    });

    it("generates deterministic contentHash for the same input", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const input = {
        kind: "activity-card" as const,
        data: {
          login: "octocat",
          totalRepos: 10,
          totalStars: 50,
          recentlyActiveRepos: ["repo-a"],
        },
      };

      const a = await generateAsset(input);
      const b = await generateAsset(input);

      expect(a.contentHash).toBe(b.contentHash);
      expect(a.contentHash.length).toBe(64); // SHA-256 hex
    });

    it("includes storageKey with correct format", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "activity-card",
        data: { login: "octocat", totalRepos: 5, totalStars: 20, recentlyActiveRepos: [] },
      });

      expect(asset.storageKey).toMatch(/^assets\/octocat\/activity-card-[a-f0-9]{8}\.svg$/);
    });

    it("handles minimal data gracefully", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "activity-card",
        data: { login: "ghost" },
      });

      expect(asset.mimeType).toBe("image/svg+xml");
      expect(asset.content).toMatch(/^<svg/);
      expect(asset.storageKey).toContain("ghost");
    });
  });

  // ---------------------------------------------------------------------------
  // Language card
  // ---------------------------------------------------------------------------

  describe("language-card", () => {
    it("renders a valid SVG with language bars", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "language-card",
        data: {
          login: "octocat",
          languages: [
            { name: "TypeScript", repoCount: 12 },
            { name: "Python", repoCount: 8 },
            { name: "Go", repoCount: 3 },
          ],
        },
      });

      expect(asset.mimeType).toBe("image/svg+xml");
      expect(asset.content).toMatch(/^<svg/);
      expect(asset.content).toMatch(/<\/svg>$/);
      expect(asset.kind).toBe("language-card");
    });

    it("includes storageKey with correct format", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "language-card",
        data: {
          login: "octocat",
          languages: [{ name: "Rust", repoCount: 5 }],
        },
      });

      expect(asset.storageKey).toMatch(/^assets\/octocat\/language-card-[a-f0-9]{8}\.svg$/);
    });

    it("handles empty languages gracefully", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "language-card",
        data: { login: "ghost", languages: [] },
      });

      expect(asset.content).toMatch(/^<svg/);
    });

    it("limits to 5 languages max", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "language-card",
        data: {
          login: "polyglot",
          languages: [
            { name: "TypeScript", repoCount: 20 },
            { name: "Python", repoCount: 15 },
            { name: "Go", repoCount: 10 },
            { name: "Rust", repoCount: 8 },
            { name: "Java", repoCount: 5 },
            { name: "Ruby", repoCount: 3 },
            { name: "C", repoCount: 1 },
          ],
        },
      });

      // Should only show top 5 in the card
      expect(asset.content).toContain("TypeScript");
      expect(asset.content).toContain("Java");
      expect(asset.content).not.toContain("Ruby");
      expect(asset.content).not.toContain(">C<"); // avoid matching "C" inside other words
    });
  });

  // ---------------------------------------------------------------------------
  // Journey card
  // ---------------------------------------------------------------------------

  describe("journey-card", () => {
    it("renders a valid SVG with journey summary", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "journey-card",
        data: {
          login: "octocat",
          developerArchetype: "fullstack",
          headline: "Hi, I'm Octocat -- a fullstack engineer",
          yearsActive: 7,
        },
      });

      expect(asset.mimeType).toBe("image/svg+xml");
      expect(asset.content).toMatch(/^<svg/);
      expect(asset.content).toMatch(/<\/svg>$/);
      expect(asset.kind).toBe("journey-card");
    });

    it("includes storageKey with correct format", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "journey-card",
        data: {
          login: "octocat",
          developerArchetype: "backend",
          headline: "Backend specialist",
        },
      });

      expect(asset.storageKey).toMatch(/^assets\/octocat\/journey-card-[a-f0-9]{8}\.svg$/);
    });

    it("handles missing optional fields gracefully", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const asset = await generateAsset({
        kind: "journey-card",
        data: { login: "ghost" },
      });

      expect(asset.content).toMatch(/^<svg/);
      expect(asset.storageKey).toContain("ghost");
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-cutting concerns
  // ---------------------------------------------------------------------------

  describe("cross-cutting", () => {
    it("different card kinds produce different content", async () => {
      const { generateAsset } = await import("@/lib/assets/generate-asset");

      const activity = await generateAsset({
        kind: "activity-card",
        data: { login: "octocat", totalRepos: 10, totalStars: 50, recentlyActiveRepos: [] },
      });

      const language = await generateAsset({
        kind: "language-card",
        data: { login: "octocat", languages: [{ name: "TypeScript", repoCount: 5 }] },
      });

      const journey = await generateAsset({
        kind: "journey-card",
        data: { login: "octocat", developerArchetype: "fullstack", headline: "Hello" },
      });

      expect(activity.content).not.toBe(language.content);
      expect(language.content).not.toBe(journey.content);
      expect(activity.content).not.toBe(journey.content);
    });
  });
});
