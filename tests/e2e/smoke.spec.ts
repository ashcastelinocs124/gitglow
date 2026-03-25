import { expect, test } from "@playwright/test";

test("landing page shows Gitglow headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /gitglow/i })).toBeVisible();
});
