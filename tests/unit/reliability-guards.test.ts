import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// validateBeforePublish
// ---------------------------------------------------------------------------

describe("validateBeforePublish", () => {
  it("validates markdown before publish", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "# Hello\n\nContent here",
      hasPreviewConfirmation: true,
    });
    expect(result.safe).toBe(true);
  });

  it("rejects publish without preview confirmation", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "# Hello",
      hasPreviewConfirmation: false,
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("preview");
  });

  it("rejects empty markdown", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "",
      hasPreviewConfirmation: true,
    });
    expect(result.safe).toBe(false);
  });

  it("rejects whitespace-only markdown", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "   \n\t  \n  ",
      hasPreviewConfirmation: true,
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("rejects markdown without a heading", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "Just some text without a heading",
      hasPreviewConfirmation: true,
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("heading");
  });

  it("accepts markdown with any heading level", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");

    const h2 = validateBeforePublish({
      markdown: "## Sub heading\n\nContent",
      hasPreviewConfirmation: true,
    });
    expect(h2.safe).toBe(true);

    const h3 = validateBeforePublish({
      markdown: "### Deep heading\n\nContent",
      hasPreviewConfirmation: true,
    });
    expect(h3.safe).toBe(true);
  });

  it("collects warnings for soft issues without blocking", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    // Valid markdown with asset URLs (one malformed)
    const result = validateBeforePublish({
      markdown: "# Hello\n\nContent",
      hasPreviewConfirmation: true,
      assetUrls: ["https://example.com/img.svg", "not-a-url"],
    });
    expect(result.safe).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns no warnings for valid asset URLs", async () => {
    const { validateBeforePublish } = await import("@/lib/reliability/guards");
    const result = validateBeforePublish({
      markdown: "# Hello\n\nContent",
      hasPreviewConfirmation: true,
      assetUrls: [
        "https://example.com/img.svg",
        "https://cdn.example.com/card.png",
      ],
    });
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// describeRefreshType
// ---------------------------------------------------------------------------

describe("describeRefreshType", () => {
  it("classifies refresh type for user messaging", async () => {
    const { describeRefreshType } = await import("@/lib/reliability/guards");

    const safeRefresh = describeRefreshType({ rewriteNarrative: false });
    expect(safeRefresh.level).toBe("safe");
    expect(safeRefresh.userMessage).toContain("stats");

    const storyRewrite = describeRefreshType({ rewriteNarrative: true });
    expect(storyRewrite.level).toBe("destructive");
    expect(storyRewrite.userMessage).toContain("narrative");
  });

  it("safe refresh does not require confirmation", async () => {
    const { describeRefreshType } = await import("@/lib/reliability/guards");
    const result = describeRefreshType({ rewriteNarrative: false });
    expect(result.requiresConfirmation).toBe(false);
  });

  it("destructive refresh requires confirmation", async () => {
    const { describeRefreshType } = await import("@/lib/reliability/guards");
    const result = describeRefreshType({ rewriteNarrative: true });
    expect(result.requiresConfirmation).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateAssetUrls
// ---------------------------------------------------------------------------

describe("validateAssetUrls", () => {
  it("accepts well-formed https URLs", async () => {
    const { validateAssetUrls } = await import("@/lib/reliability/guards");
    const result = validateAssetUrls([
      "https://example.com/img.svg",
      "https://cdn.example.com/assets/card.png",
    ]);
    expect(result.valid).toBe(true);
    expect(result.invalidUrls).toHaveLength(0);
  });

  it("accepts well-formed http URLs", async () => {
    const { validateAssetUrls } = await import("@/lib/reliability/guards");
    const result = validateAssetUrls(["http://localhost:3000/api/assets/abc"]);
    expect(result.valid).toBe(true);
    expect(result.invalidUrls).toHaveLength(0);
  });

  it("rejects malformed URLs", async () => {
    const { validateAssetUrls } = await import("@/lib/reliability/guards");
    const result = validateAssetUrls(["not-a-url", "://bad", ""]);
    expect(result.valid).toBe(false);
    expect(result.invalidUrls).toHaveLength(3);
  });

  it("returns valid for empty URL array", async () => {
    const { validateAssetUrls } = await import("@/lib/reliability/guards");
    const result = validateAssetUrls([]);
    expect(result.valid).toBe(true);
    expect(result.invalidUrls).toHaveLength(0);
  });

  it("reports mixed valid and invalid URLs", async () => {
    const { validateAssetUrls } = await import("@/lib/reliability/guards");
    const result = validateAssetUrls([
      "https://good.com/img.png",
      "bad-url",
      "https://also-good.com/a.svg",
    ]);
    expect(result.valid).toBe(false);
    expect(result.invalidUrls).toEqual(["bad-url"]);
  });
});

// ---------------------------------------------------------------------------
// buildSyncFailureMessage
// ---------------------------------------------------------------------------

describe("buildSyncFailureMessage", () => {
  it("returns rate limit message for 403/rate limit errors", async () => {
    const { buildSyncFailureMessage } = await import(
      "@/lib/reliability/guards"
    );
    const msg = buildSyncFailureMessage(
      new Error("API rate limit exceeded for user"),
    );
    expect(msg).toContain("rate limit");
  });

  it("returns auth expired message for 401 errors", async () => {
    const { buildSyncFailureMessage } = await import(
      "@/lib/reliability/guards"
    );
    const msg = buildSyncFailureMessage(new Error("Bad credentials (401)"));
    expect(msg).toContain("reconnect");
  });

  it("returns network message for fetch/connection errors", async () => {
    const { buildSyncFailureMessage } = await import(
      "@/lib/reliability/guards"
    );
    const msg = buildSyncFailureMessage(new Error("fetch failed"));
    expect(msg).toContain("Connection failed");
  });

  it("returns generic message for unknown errors", async () => {
    const { buildSyncFailureMessage } = await import(
      "@/lib/reliability/guards"
    );
    const msg = buildSyncFailureMessage(new Error("Something bizarre"));
    expect(msg).toContain("unchanged");
  });

  it("handles non-Error objects gracefully", async () => {
    const { buildSyncFailureMessage } = await import(
      "@/lib/reliability/guards"
    );
    const msg = buildSyncFailureMessage("string error" as unknown as Error);
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// assertLastPublishedIntact
// ---------------------------------------------------------------------------

describe("assertLastPublishedIntact", () => {
  it("returns intact when a valid published generation exists", async () => {
    const { assertLastPublishedIntact } = await import(
      "@/lib/reliability/guards"
    );
    const result = assertLastPublishedIntact([
      {
        id: "1",
        status: "published" as const,
        markdown: "# My README\n\nContent here",
      },
      { id: "2", status: "draft" as const, markdown: "# Draft" },
    ]);

    expect(result.intact).toBe(true);
    expect(result.generationId).toBe("1");
  });

  it("returns not intact when no published generation exists", async () => {
    const { assertLastPublishedIntact } = await import(
      "@/lib/reliability/guards"
    );
    const result = assertLastPublishedIntact([
      { id: "1", status: "draft" as const, markdown: "# Draft" },
      { id: "2", status: "failed" as const, markdown: "" },
    ]);

    expect(result.intact).toBe(false);
    expect(result.generationId).toBeNull();
  });

  it("returns not intact when published generation has empty markdown", async () => {
    const { assertLastPublishedIntact } = await import(
      "@/lib/reliability/guards"
    );
    const result = assertLastPublishedIntact([
      { id: "1", status: "published" as const, markdown: "" },
    ]);

    expect(result.intact).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("returns not intact for empty generations array", async () => {
    const { assertLastPublishedIntact } = await import(
      "@/lib/reliability/guards"
    );
    const result = assertLastPublishedIntact([]);

    expect(result.intact).toBe(false);
  });
});
