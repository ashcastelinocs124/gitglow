import { describe, expect, it } from "vitest";

import type { GenerationEntry } from "@/lib/history/versioning";

// ---------------------------------------------------------------------------
// Helpers -- build test fixtures
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<GenerationEntry> & { id: string },
): GenerationEntry {
  return {
    status: "draft",
    generatedAt: "2026-03-20T00:00:00Z",
    headline: null,
    markdown: "",
    publishedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// selectRollbackTarget
// ---------------------------------------------------------------------------

describe("selectRollbackTarget", () => {
  it("marks the latest successful generation as rollback-safe", async () => {
    const { selectRollbackTarget } = await import("@/lib/history/versioning");
    const target = selectRollbackTarget([
      { id: "1", status: "failed", generatedAt: "2026-03-20T00:00:00Z" },
      { id: "2", status: "published", generatedAt: "2026-03-21T00:00:00Z" },
    ]);

    expect(target?.id).toBe("2");
  });

  it("returns null when no published entries exist", async () => {
    const { selectRollbackTarget } = await import("@/lib/history/versioning");
    const target = selectRollbackTarget([
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "failed" }),
    ]);

    expect(target).toBeNull();
  });

  it("returns the most recent published entry when multiple exist", async () => {
    const { selectRollbackTarget } = await import("@/lib/history/versioning");
    const target = selectRollbackTarget([
      makeEntry({
        id: "1",
        status: "published",
        generatedAt: "2026-03-18T00:00:00Z",
      }),
      makeEntry({
        id: "2",
        status: "published",
        generatedAt: "2026-03-22T00:00:00Z",
      }),
      makeEntry({
        id: "3",
        status: "published",
        generatedAt: "2026-03-20T00:00:00Z",
      }),
    ]);

    expect(target?.id).toBe("2");
  });

  it("returns null for an empty array", async () => {
    const { selectRollbackTarget } = await import("@/lib/history/versioning");
    const target = selectRollbackTarget([]);

    expect(target).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// canRollback
// ---------------------------------------------------------------------------

describe("canRollback", () => {
  it("returns true when at least one published generation exists", async () => {
    const { canRollback } = await import("@/lib/history/versioning");

    const result = canRollback([
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "published" }),
    ]);

    expect(result).toBe(true);
  });

  it("returns false when no published generations exist", async () => {
    const { canRollback } = await import("@/lib/history/versioning");

    const result = canRollback([
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "failed" }),
    ]);

    expect(result).toBe(false);
  });

  it("returns false for an empty array", async () => {
    const { canRollback } = await import("@/lib/history/versioning");

    const result = canRollback([]);

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sortGenerationsByDate
// ---------------------------------------------------------------------------

describe("sortGenerationsByDate", () => {
  it("sorts generations by generatedAt descending (newest first)", async () => {
    const { sortGenerationsByDate } = await import(
      "@/lib/history/versioning"
    );

    const sorted = sortGenerationsByDate([
      makeEntry({ id: "1", generatedAt: "2026-03-18T00:00:00Z" }),
      makeEntry({ id: "2", generatedAt: "2026-03-22T00:00:00Z" }),
      makeEntry({ id: "3", generatedAt: "2026-03-20T00:00:00Z" }),
    ]);

    expect(sorted.map((g) => g.id)).toEqual(["2", "3", "1"]);
  });

  it("returns empty array for empty input", async () => {
    const { sortGenerationsByDate } = await import(
      "@/lib/history/versioning"
    );

    const sorted = sortGenerationsByDate([]);

    expect(sorted).toEqual([]);
  });

  it("does not mutate the original array", async () => {
    const { sortGenerationsByDate } = await import(
      "@/lib/history/versioning"
    );

    const original = [
      makeEntry({ id: "1", generatedAt: "2026-03-22T00:00:00Z" }),
      makeEntry({ id: "2", generatedAt: "2026-03-18T00:00:00Z" }),
    ];
    const originalCopy = [...original];

    sortGenerationsByDate(original);

    expect(original.map((g) => g.id)).toEqual(originalCopy.map((g) => g.id));
  });
});

// ---------------------------------------------------------------------------
// getGenerationSummary
// ---------------------------------------------------------------------------

describe("getGenerationSummary", () => {
  it("returns correct counts for mixed statuses", async () => {
    const { getGenerationSummary } = await import(
      "@/lib/history/versioning"
    );

    const summary = getGenerationSummary([
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "published" }),
      makeEntry({ id: "3", status: "failed" }),
      makeEntry({ id: "4", status: "published" }),
      makeEntry({ id: "5", status: "draft" }),
    ]);

    expect(summary).toEqual({
      total: 5,
      published: 2,
      draft: 2,
      failed: 1,
    });
  });

  it("returns all zeros for empty array", async () => {
    const { getGenerationSummary } = await import(
      "@/lib/history/versioning"
    );

    const summary = getGenerationSummary([]);

    expect(summary).toEqual({
      total: 0,
      published: 0,
      draft: 0,
      failed: 0,
    });
  });

  it("handles single-status arrays correctly", async () => {
    const { getGenerationSummary } = await import(
      "@/lib/history/versioning"
    );

    const summary = getGenerationSummary([
      makeEntry({ id: "1", status: "published" }),
      makeEntry({ id: "2", status: "published" }),
    ]);

    expect(summary).toEqual({
      total: 2,
      published: 2,
      draft: 0,
      failed: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// buildRollbackAction
// ---------------------------------------------------------------------------

describe("buildRollbackAction", () => {
  it("returns success result when target exists and is published", async () => {
    const { buildRollbackAction } = await import("@/lib/history/versioning");

    const generations = [
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "published", headline: "My Profile" }),
    ];

    const result = buildRollbackAction("2", generations);

    expect(result.success).toBe(true);
    expect(result.restoredGenerationId).toBe("2");
    expect(result.errorMessage).toBeNull();
  });

  it("returns failure when target id does not exist", async () => {
    const { buildRollbackAction } = await import("@/lib/history/versioning");

    const generations = [
      makeEntry({ id: "1", status: "published" }),
    ];

    const result = buildRollbackAction("999", generations);

    expect(result.success).toBe(false);
    expect(result.restoredGenerationId).toBeNull();
    expect(result.errorMessage).toBe("Generation not found");
  });

  it("returns failure when target exists but is not published", async () => {
    const { buildRollbackAction } = await import("@/lib/history/versioning");

    const generations = [
      makeEntry({ id: "1", status: "draft" }),
      makeEntry({ id: "2", status: "failed" }),
    ];

    const result = buildRollbackAction("1", generations);

    expect(result.success).toBe(false);
    expect(result.restoredGenerationId).toBeNull();
    expect(result.errorMessage).toBe(
      "Cannot rollback to a generation that is not published",
    );
  });

  it("returns failure when generations list is empty", async () => {
    const { buildRollbackAction } = await import("@/lib/history/versioning");

    const result = buildRollbackAction("1", []);

    expect(result.success).toBe(false);
    expect(result.restoredGenerationId).toBeNull();
    expect(result.errorMessage).toBe("Generation not found");
  });
});
