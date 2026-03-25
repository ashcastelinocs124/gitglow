/**
 * Local file storage adapter for generated assets.
 *
 * Stores assets under `.gitglow-assets/` in the project root.
 * This is a local development stub -- swap for S3/R2 in production.
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Root directory for locally stored assets, relative to cwd. */
const STORAGE_ROOT = join(process.cwd(), ".gitglow-assets");

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
  const fullPath = join(STORAGE_ROOT, storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, "utf-8");
  return fullPath;
}

/**
 * Read an asset from local storage.
 *
 * @returns The file content as a UTF-8 string.
 * @throws If the file does not exist.
 */
export async function loadAssetLocally(storageKey: string): Promise<string> {
  const fullPath = join(STORAGE_ROOT, storageKey);
  return readFile(fullPath, "utf-8");
}

/**
 * Check whether an asset exists in local storage.
 */
export async function assetExistsLocally(storageKey: string): Promise<boolean> {
  const fullPath = join(STORAGE_ROOT, storageKey);
  try {
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}
