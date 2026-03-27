import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Test assets directory -- we use a temp subdirectory to isolate test data.
// The storage module uses `process.cwd()/.gitglow-assets/` so we scope our
// test keys under a `_test/` prefix and clean up afterwards.
// ---------------------------------------------------------------------------

const TEST_PREFIX = "_test-assets-route";

beforeAll(async () => {
  const root = join(process.cwd(), ".gitglow-assets", TEST_PREFIX);
  await mkdir(root, { recursive: true });
});

afterAll(async () => {
  const root = join(process.cwd(), ".gitglow-assets", TEST_PREFIX);
  await rm(root, { recursive: true, force: true });
  // Also clean up last-good test data
  const lastGoodRoot = join(process.cwd(), ".gitglow-assets", ".last-good", TEST_PREFIX);
  await rm(lastGoodRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Storage layer tests
// ---------------------------------------------------------------------------

describe("asset storage", () => {
  it("saves and loads asset content as a round trip", async () => {
    const { saveAssetLocally, loadAssetLocally } = await import(
      "@/lib/assets/storage"
    );

    const testKey = `${TEST_PREFIX}/asset-001.svg`;
    const testContent = "<svg><text>Test</text></svg>";
    await saveAssetLocally(testKey, testContent);

    const loaded = await loadAssetLocally(testKey);
    expect(loaded).toBe(testContent);
  });

  it("returns null for missing assets", async () => {
    const { loadAssetLocally } = await import("@/lib/assets/storage");
    const loaded = await loadAssetLocally("nonexistent/key-that-does-not-exist.svg");
    expect(loaded).toBeNull();
  });

  it("saveLastGoodAsset creates a fallback copy", async () => {
    const { saveAssetLocally, saveLastGoodAsset, loadAssetLocally } =
      await import("@/lib/assets/storage");

    const key = `${TEST_PREFIX}/good-copy-test.svg`;
    const content = "<svg><text>Fallback Copy</text></svg>";

    await saveAssetLocally(key, content);
    await saveLastGoodAsset(key);

    // The last-good copy should exist at .last-good/<key>
    const lastGoodKey = `.last-good/${key}`;
    const loaded = await loadAssetLocally(lastGoodKey);
    expect(loaded).toBe(content);
  });

  it("loadAssetWithFallback returns current version when available", async () => {
    const { saveAssetLocally, loadAssetWithFallback } = await import(
      "@/lib/assets/storage"
    );

    const key = `${TEST_PREFIX}/current-available.svg`;
    const content = "<svg><text>Current</text></svg>";
    await saveAssetLocally(key, content);

    const result = await loadAssetWithFallback(key);
    expect(result).toBe(content);
  });

  it("loadAssetWithFallback falls back to last-good when current is missing", async () => {
    const { saveAssetLocally, saveLastGoodAsset, loadAssetWithFallback } =
      await import("@/lib/assets/storage");

    const key = `${TEST_PREFIX}/fallback-test.svg`;
    const lastGoodContent = "<svg><text>Last Good</text></svg>";

    // Save and mark as last-good
    await saveAssetLocally(key, lastGoodContent);
    await saveLastGoodAsset(key);

    // Delete the current version by writing to a different key (simulating missing)
    // We test fallback by loading a key where only the .last-good copy exists
    const missingKey = `${TEST_PREFIX}/only-has-fallback.svg`;
    // Save last-good directly at the fallback path
    await saveAssetLocally(`.last-good/${missingKey}`, lastGoodContent);

    const result = await loadAssetWithFallback(missingKey);
    expect(result).toBe(lastGoodContent);
  });

  it("loadAssetWithFallback returns null when neither current nor fallback exists", async () => {
    const { loadAssetWithFallback } = await import("@/lib/assets/storage");

    const result = await loadAssetWithFallback(
      `${TEST_PREFIX}/completely-missing.svg`,
    );
    expect(result).toBeNull();
  });
});

// Old [assetId] route tests removed — asset serving now uses [login]/[kind] route
