/**
 * Reliability guard functions for Gitglow publishing and recovery.
 *
 * All functions are pure -- no I/O, no side effects, no database calls.
 * They validate inputs, classify operations, and produce user-friendly
 * messaging. This makes them trivially testable and composable.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishValidation {
  markdown: string;
  hasPreviewConfirmation: boolean;
  /** Optional: validate that asset URLs are well-formed. */
  assetUrls?: string[];
}

export interface ValidationResult {
  safe: boolean;
  reason: string | null;
  warnings: string[];
}

export interface RefreshTypeDescription {
  level: "safe" | "destructive";
  userMessage: string;
  requiresConfirmation: boolean;
}

export interface AssetUrlValidation {
  valid: boolean;
  invalidUrls: string[];
}

export interface IntegrityResult {
  intact: boolean;
  generationId: string | null;
  reason: string | null;
}

// ---------------------------------------------------------------------------
// validateBeforePublish
//
// Pre-publish validation that checks:
// 1. Markdown is non-empty (trimmed)
// 2. Preview has been confirmed by the user
// 3. Markdown contains at least one heading (# ... or ## ... etc.)
// 4. Optional: asset URLs are well-formed (soft warning, not blocking)
// ---------------------------------------------------------------------------

export function validateBeforePublish(input: PublishValidation): ValidationResult {
  const warnings: string[] = [];

  // Check 1: Markdown must be non-empty
  if (!input.markdown || input.markdown.trim().length === 0) {
    return {
      safe: false,
      reason: "Markdown content is empty",
      warnings,
    };
  }

  // Check 2: Preview must be confirmed
  if (!input.hasPreviewConfirmation) {
    return {
      safe: false,
      reason: "You must preview your README before publishing",
      warnings,
    };
  }

  // Check 3: Markdown must contain at least one heading
  const hasHeading = /^#{1,6}\s+\S/m.test(input.markdown);
  if (!hasHeading) {
    return {
      safe: false,
      reason: "Markdown must contain at least one heading (e.g. # Title)",
      warnings,
    };
  }

  // Check 4 (soft): Validate asset URLs if provided
  if (input.assetUrls && input.assetUrls.length > 0) {
    const urlCheck = validateAssetUrls(input.assetUrls);
    if (!urlCheck.valid) {
      for (const bad of urlCheck.invalidUrls) {
        warnings.push(`Malformed asset URL: ${bad}`);
      }
    }
  }

  return {
    safe: true,
    reason: null,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// describeRefreshType
//
// Produces user-facing messaging that clearly distinguishes between:
// - Safe refresh: only metrics and visuals update (no confirmation needed)
// - Story rewrite: narrative content changes (requires user confirmation)
// ---------------------------------------------------------------------------

export function describeRefreshType(options: {
  rewriteNarrative: boolean;
}): RefreshTypeDescription {
  if (options.rewriteNarrative) {
    return {
      level: "destructive",
      userMessage:
        "This refresh will rewrite your narrative content, including your headline, about section, and goals. Your previous version will be preserved in history.",
      requiresConfirmation: true,
    };
  }

  return {
    level: "safe",
    userMessage:
      "This refresh will update your stats and visual assets only. Your narrative content will not change.",
    requiresConfirmation: false,
  };
}

// ---------------------------------------------------------------------------
// validateAssetUrls
//
// Checks that each URL is well-formed (parseable by URL constructor with
// http or https protocol). Does NOT check reachability.
// ---------------------------------------------------------------------------

export function validateAssetUrls(urls: string[]): AssetUrlValidation {
  const invalidUrls: string[] = [];

  for (const url of urls) {
    if (!isWellFormedUrl(url)) {
      invalidUrls.push(url);
    }
  }

  return {
    valid: invalidUrls.length === 0,
    invalidUrls,
  };
}

function isWellFormedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// buildSyncFailureMessage
//
// Generates user-friendly error messages for sync failures.
// Classifies errors by pattern matching the error message to produce
// actionable guidance instead of raw stack traces.
// ---------------------------------------------------------------------------

export function buildSyncFailureMessage(error: Error): string {
  const message =
    error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Rate limit (GitHub 403 with rate limit message)
  if (lower.includes("rate limit")) {
    return "GitHub rate limit reached. Please try again later.";
  }

  // Authentication expired (401, bad credentials)
  if (
    lower.includes("401") ||
    lower.includes("bad credentials") ||
    lower.includes("unauthorized")
  ) {
    return "GitHub access has expired. Please reconnect your GitHub account.";
  }

  // Network / fetch failure
  if (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("network") ||
    lower.includes("timeout")
  ) {
    return "Connection failed. Your last published README is still live on GitHub.";
  }

  // Unknown / generic
  return "Something went wrong. Your profile is unchanged -- please try again.";
}

// ---------------------------------------------------------------------------
// assertLastPublishedIntact
//
// Verifies that the last published generation exists and has valid markdown.
// Used after failed syncs to reassure users their profile is safe.
// ---------------------------------------------------------------------------

export function assertLastPublishedIntact(
  generations: { id: string; status: "draft" | "published" | "failed"; markdown: string }[],
): IntegrityResult {
  // Find published generations
  const published = generations.filter((g) => g.status === "published");

  if (published.length === 0) {
    return {
      intact: false,
      generationId: null,
      reason: "No published generation found",
    };
  }

  // Check the first published generation (most recent expected)
  const latest = published[0];

  if (!latest.markdown || latest.markdown.trim().length === 0) {
    return {
      intact: false,
      generationId: latest.id,
      reason: "Last published generation has empty markdown",
    };
  }

  return {
    intact: true,
    generationId: latest.id,
    reason: null,
  };
}
