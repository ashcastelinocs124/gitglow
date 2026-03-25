import { describe, expect, it } from "vitest";

describe("publish readme", () => {
  // --- buildPublishRequest ---

  it("prepares an update for the username README repository", async () => {
    const { buildPublishRequest } = await import("@/lib/jobs/publish-readme");
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });

    expect(request.owner).toBe("octocat");
    expect(request.repo).toBe("octocat");
  });

  it("sets correct defaults for branch, filePath, and commitMessage", async () => {
    const { buildPublishRequest } = await import("@/lib/jobs/publish-readme");
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });

    expect(request.branch).toBe("main");
    expect(request.filePath).toBe("README.md");
    expect(request.commitMessage).toBe(
      "Update profile README via Gitglow",
    );
    expect(request.markdown).toBe("# Hello");
  });

  it("allows overriding the branch via options", async () => {
    const { buildPublishRequest } = await import("@/lib/jobs/publish-readme");
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
      branch: "develop",
    });

    expect(request.branch).toBe("develop");
  });

  // --- validatePublishRequest ---

  it("validates a well-formed publish request", async () => {
    const { buildPublishRequest, validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty markdown", async () => {
    const { buildPublishRequest, validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "",
    });
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("markdown must not be empty");
  });

  it("rejects whitespace-only markdown", async () => {
    const { buildPublishRequest, validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "   \n\t  ",
    });
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("markdown must not be empty");
  });

  it("rejects empty username", async () => {
    const { buildPublishRequest, validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = buildPublishRequest({
      username: "",
      markdown: "# Hello",
    });
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("owner must not be empty");
  });

  it("rejects when repo does not match owner", async () => {
    const { validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    // Manually construct a request where repo !== owner
    const request = {
      owner: "octocat",
      repo: "some-other-repo",
      branch: "main",
      filePath: "README.md",
      markdown: "# Hello",
      commitMessage: "Update profile README via Gitglow",
    };
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "repo must match owner for profile README",
    );
  });

  // --- commit message format ---

  it("uses the standard commit message format", async () => {
    const { buildPublishRequest } = await import("@/lib/jobs/publish-readme");
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });

    expect(request.commitMessage).toMatch(/Gitglow/);
    expect(request.commitMessage).toMatch(/README/);
  });

  // --- PublishResult structure ---

  it("returns a success result structure from executePublish on failure", async () => {
    const { executePublish, buildPublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });

    // Without a real token, this should return a failure result (not throw)
    const result = await executePublish(request, "invalid-token");

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("committedSha");
    expect(result).toHaveProperty("errorMessage");
    expect(result.success).toBe(false);
    expect(result.committedSha).toBeNull();
    expect(typeof result.errorMessage).toBe("string");
  });

  // --- manual vs connected mode ---

  it("differentiates manual and connected publish modes", async () => {
    const { buildPublishRequest, validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );

    // Manual mode: just build and validate (user publishes themselves)
    const request = buildPublishRequest({
      username: "octocat",
      markdown: "# Hello",
    });
    const validation = validatePublishRequest(request);
    expect(validation.valid).toBe(true);

    // The request object is what the user would use for manual publishing
    expect(request.owner).toBe("octocat");
    expect(request.repo).toBe("octocat");
    expect(request.filePath).toBe("README.md");

    // Connected mode would pass the request to executePublish with a token
    // (tested above in the executePublish test)
  });

  // --- multiple validation errors ---

  it("collects multiple validation errors at once", async () => {
    const { validatePublishRequest } = await import(
      "@/lib/jobs/publish-readme"
    );
    const request = {
      owner: "",
      repo: "different",
      branch: "main",
      filePath: "README.md",
      markdown: "",
      commitMessage: "Update profile README via Gitglow",
    };
    const result = validatePublishRequest(request);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
    expect(result.errors).toContain("owner must not be empty");
    expect(result.errors).toContain("markdown must not be empty");
  });
});
