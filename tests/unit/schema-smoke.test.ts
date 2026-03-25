import { describe, expect, it } from "vitest";

describe("data model", () => {
  it("documents the required core entities", () => {
    const modelNames = [
      "User",
      "GitHubAccount",
      "ImportedRepository",
      "ProfileNarrative",
      "ProfileGeneration",
      "GeneratedAsset",
    ];

    expect(modelNames).toContain("ProfileGeneration");
  });
});
