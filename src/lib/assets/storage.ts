/**
 * Local file storage adapter for generated assets.
 *
 * Stores assets under `.gitglow-assets/` in the project root.
 * This is a local development stub -- swap for S3/R2 in production.
 *
 * Supports a "last-good" fallback mechanism: after a successful generation,
 * call `saveLastGoodAsset(key)` to snapshot the current version. If the
 * current version later goes missing or is corrupted, `loadAssetWithFallback`
 * transparently serves the last-known-good copy.
 */

import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Root directory for locally stored assets, relative to cwd. */
const STORAGE_ROOT = join(process.cwd(), ".gitglow-assets");

/** Subdirectory within STORAGE_ROOT for last-known-good copies. */
const LAST_GOOD_PREFIX = ".last-good";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve a storage key to an absolute file path. */
function resolvePath(storageKey: string): string {
  return join(STORAGE_ROOT, storageKey);
}

/** Resolve the last-good fallback path for a given storage key. */
function resolveLastGoodPath(storageKey: string): string {
  return join(STORAGE_ROOT, LAST_GOOD_PREFIX, storageKey);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Write asset content to local storage.
 *
 * Creates intermediate directories as needed.
 *
 * @param storageKey - Relative path, e.g. "assets/octocat/activity-card-a1b2.svg"
 * @param content    - The file content (string for SVG, Buffer for binary)
 */
export async function saveAssetLocally(
  storageKey: string,
  content: string | Buffer,
): Promise<string> {
  const fullPath = resolvePath(storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, "utf-8");
  return fullPath;
}

/**
 * Read an asset from local storage.
 *
 * @returns The file content as a UTF-8 string, or `null` if the file does
 *          not exist.
 */
export async function loadAssetLocally(
  storageKey: string,
): Promise<string | null> {
  const fullPath = resolvePath(storageKey);
  try {
    return await readFile(fullPath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Check whether an asset exists in local storage.
 */
export async function assetExistsLocally(storageKey: string): Promise<boolean> {
  const fullPath = resolvePath(storageKey);
  try {
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Last-good fallback
// ---------------------------------------------------------------------------

/**
 * Snapshot the current version of an asset as the "last-known-good" copy.
 *
 * The copy is stored under `.last-good/` within the storage root, mirroring
 * the original key's directory structure. Call this after a successful
 * generation + validation cycle so there is always a servable fallback.
 */
export async function saveLastGoodAsset(storageKey: string): Promise<void> {
  const sourcePath = resolvePath(storageKey);
  const destPath = resolveLastGoodPath(storageKey);
  await mkdir(dirname(destPath), { recursive: true });
  await copyFile(sourcePath, destPath);
}

/**
 * Load an asset with automatic fallback to the last-known-good copy.
 *
 * Resolution order:
 * 1. Try the current version at `storageKey`.
 * 2. If missing / unreadable, try the `.last-good/` copy.
 * 3. If both are missing, return `null`.
 */
export async function loadAssetWithFallback(
  storageKey: string,
): Promise<string | null> {
  // Try current version first
  const current = await loadAssetLocally(storageKey);
  if (current !== null) {
    return current;
  }

  // Fall back to last-good copy
  const lastGoodKey = `${LAST_GOOD_PREFIX}/${storageKey}`;
  return loadAssetLocally(lastGoodKey);
}
