/**
 * Asset generation entry point.
 *
 * Dispatches to the correct SVG template based on `kind`, computes
 * a content hash, and returns a structured result with storage metadata.
 *
 * No external dependencies -- uses Node's built-in `crypto` module
 * and generates SVG strings directly (no satori/resvg).
 */

import { createHash } from "node:crypto";

import { renderActivityCard } from "@/lib/assets/templates/activity-card";
import { renderLanguageCard } from "@/lib/assets/templates/language-card";
import { renderJourneyCard } from "@/lib/assets/templates/journey-card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssetKind = "activity-card" | "language-card" | "journey-card";

export interface GenerateAssetInput {
  kind: AssetKind;
  data: Record<string, unknown>;
}

export interface GeneratedAssetResult {
  kind: AssetKind;
  /** Always "image/svg+xml" for SVG assets. */
  mimeType: string;
  /** Storage path, e.g. "assets/octocat/activity-card-a1b2c3d4.svg" */
  storageKey: string;
  /** SHA-256 hex digest of the SVG content. */
  contentHash: string;
  /** The SVG string. */
  content: string;
  /** ISO-8601 timestamp of generation. */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

const RENDERERS: Record<AssetKind, (data: Record<string, unknown>) => string> =
  {
    "activity-card": renderActivityCard,
    "language-card": renderLanguageCard,
    "journey-card": renderJourneyCard,
  };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate an SVG visual asset for the given kind and data.
 *
 * This is a **pure** function with no side effects -- it does not write
 * to disk or make network requests. Persistence is handled separately
 * via the storage module.
 */
export async function generateAsset(
  input: GenerateAssetInput,
): Promise<GeneratedAssetResult> {
  const { kind, data } = input;

  const render = RENDERERS[kind];
  if (!render) {
    throw new Error(`Unknown asset kind: ${kind}`);
  }

  const content = render(data);
  const contentHash = createHash("sha256").update(content).digest("hex");
  const login = String(data.login ?? "unknown");
  const shortHash = contentHash.slice(0, 8);
  const storageKey = `assets/${login}/${kind}-${shortHash}.svg`;

  return {
    kind,
    mimeType: "image/svg+xml",
    storageKey,
    contentHash,
    content,
    generatedAt: new Date().toISOString(),
  };
}
