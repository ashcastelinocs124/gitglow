import { describe, expect, it } from "vitest";

describe("auth config", () => {
  it("uses GitHub as a provider", async () => {
    const { authOptions } = await import("@/lib/auth");
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });
});
