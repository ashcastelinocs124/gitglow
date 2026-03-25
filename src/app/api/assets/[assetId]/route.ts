/**
 * GET /api/assets/:assetId
 *
 * Serves a generated visual asset (SVG) by its encoded storage key.
 *
 * The `assetId` path parameter is a base64url-encoded storage key.
 * This avoids the need for a database lookup during serving -- the key
 * directly maps to the local file path.
 *
 * Uses `loadAssetWithFallback` for resilient serving: if the current
 * version is missing, the last-known-good copy is served transparently.
 *
 * Cache headers are tuned for GitHub profile README embedding:
 * - `max-age=3600` (1 hour) -- reasonable staleness for profile cards
 * - `stale-while-revalidate=86400` (24 hours) -- serve stale while
 *   revalidating in the background
 */

import { NextResponse } from "next/server";
import { loadAssetWithFallback } from "@/lib/assets/storage";

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
): Promise<Response> {
  const { assetId } = await params;

  // -------------------------------------------------------------------------
  // Decode the storage key from base64url
  // -------------------------------------------------------------------------
  if (!assetId) {
    return NextResponse.json(
      { error: "Missing assetId parameter" },
      { status: 400 },
    );
  }

  let storageKey: string;
  try {
    storageKey = Buffer.from(assetId, "base64url").toString("utf-8");
  } catch {
    return NextResponse.json(
      { error: "Invalid assetId encoding" },
      { status: 400 },
    );
  }

  if (!storageKey || storageKey.length === 0) {
    return NextResponse.json(
      { error: "Invalid assetId: decoded to empty key" },
      { status: 400 },
    );
  }

  // -------------------------------------------------------------------------
  // Load the asset (with last-good fallback)
  // -------------------------------------------------------------------------
  const content = await loadAssetWithFallback(storageKey);

  if (content === null) {
    return NextResponse.json(
      { error: "Asset not found" },
      { status: 404 },
    );
  }

  // -------------------------------------------------------------------------
  // Serve the SVG with appropriate headers
  // -------------------------------------------------------------------------
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
