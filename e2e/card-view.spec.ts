import { expect, test } from "@playwright/test";

const BASE = "/?localRepo=../test-repo";

test.describe("Card column view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('[aria-label^="Open"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test("cards render in a grid", async ({ page }) => {
    const cards = page.locator('[aria-label^="Open"]');
    // Test repo has 52 notes (2 original + 50 dummy)
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
  });

  test("card shows preview text", async ({ page }) => {
    // At least one card should have rendered markdown content
    await expect(page.locator('[aria-label^="Open"] .prose').first()).toBeVisible();
  });

  test("search field is visible", async ({ page }) => {
    await expect(page.getByPlaceholder("Search")).toBeVisible();
  });

  test("sort dropdown is visible", async ({ page }) => {
    await expect(page.getByLabel("Sort")).toBeVisible();
  });
});
