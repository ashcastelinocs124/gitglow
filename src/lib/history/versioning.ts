// ---------------------------------------------------------------------------
// Generation history and rollback logic
//
// All functions are pure — no DB calls, no side effects. This makes them
// trivially testable and composable. The caller (e.g. a Server Action or
// API route) is responsible for fetching generations from the database and
// persisting any state changes after a rollback decision.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerationEntry {
  id: string;
  status: "draft" | "published" | "failed";
  headline?: string | null;
  markdown?: string;
  generatedAt: string;
  publishedAt?: string | null;
}

export interface RollbackResult {
  success: boolean;
  restoredGenerationId: string | null;
  errorMessage: string | null;
}

export interface GenerationSummary {
  total: number;
  published: number;
  draft: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// selectRollbackTarget
//
// Finds the most recent generation with status "published". This is the
// safest entry to rollback to because it was previously validated and pushed.
// Returns null if no published generation exists.
// ---------------------------------------------------------------------------

export function selectRollbackTarget(
  generations: Pick<GenerationEntry, "id" | "status" | "generatedAt">[],
): Pick<GenerationEntry, "id" | "status" | "generatedAt"> | null {
  const published = generations.filter((g) => g.status === "published");

  if (published.length === 0) {
    return null;
  }

  // Sort descending by generatedAt and return the newest
  return published.sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  )[0];
}

// ---------------------------------------------------------------------------
// canRollback
//
// Returns true if there is at least one published generation that could
// serve as a rollback target.
// ---------------------------------------------------------------------------

export function canRollback(
  generations: Pick<GenerationEntry, "status">[],
): boolean {
  return generations.some((g) => g.status === "published");
}

// ---------------------------------------------------------------------------
// sortGenerationsByDate
//
// Returns a new array sorted by generatedAt descending (newest first).
// Does NOT mutate the original array.
// ---------------------------------------------------------------------------

export function sortGenerationsByDate<
  T extends Pick<GenerationEntry, "generatedAt">,
>(generations: T[]): T[] {
  return [...generations].sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// getGenerationSummary
//
// Returns aggregate counts broken down by status.
// ---------------------------------------------------------------------------

export function getGenerationSummary(
  generations: Pick<GenerationEntry, "status">[],
): GenerationSummary {
  const summary: GenerationSummary = {
    total: generations.length,
    published: 0,
    draft: 0,
    failed: 0,
  };

  for (const g of generations) {
    if (g.status === "published") summary.published++;
    else if (g.status === "draft") summary.draft++;
    else if (g.status === "failed") summary.failed++;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// buildRollbackAction
//
// Validates that a target generation exists and is published, then returns
// a RollbackResult the caller can use to proceed (or display an error).
// ---------------------------------------------------------------------------

export function buildRollbackAction(
  targetId: string,
  generations: Pick<GenerationEntry, "id" | "status">[],
): RollbackResult {
  const target = generations.find((g) => g.id === targetId);

  if (!target) {
    return {
      success: false,
      restoredGenerationId: null,
      errorMessage: "Generation not found",
    };
  }

  if (target.status !== "published") {
    return {
      success: false,
      restoredGenerationId: null,
      errorMessage: "Cannot rollback to a generation that is not published",
    };
  }

  return {
    success: true,
    restoredGenerationId: target.id,
    errorMessage: null,
  };
}
