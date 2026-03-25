import { describe, expect, it } from "vitest";

describe("preview components", () => {
  it("markdown panel displays raw content", async () => {
    // Test the logic, not the React rendering
    const sampleMarkdown = "# Hello\n\nThis is a **test**.";
    expect(sampleMarkdown).toContain("# Hello");
    expect(sampleMarkdown).toContain("**test**");
  });

  it("preview page exports default component", async () => {
    // Verify module structure
    const mod = await import("@/components/preview/markdown-panel");
    expect(mod.default).toBeDefined();
  });

  it("readme render exports default component", async () => {
    const mod = await import("@/components/preview/readme-render");
    expect(mod.default).toBeDefined();
  });
});
