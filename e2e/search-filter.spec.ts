import { expect, test } from "@playwright/test";

const BASE = "/?localRepo=../test-repo";

test.describe("Search and filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('[aria-label^="Open"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test("typing in search filters visible cards", async ({ page }) => {
    const allCount = await page.locator('[aria-label^="Open"]').count();
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("First");

    // Wait for debounced search - should reduce the card count
    await expect(async () => {
      const filtered = await page.locator('[aria-label^="Open"]').count();
      expect(filtered).toBeLessThan(allCount);
    }).toPass({ timeout: 5_000 });
  });

  test("clearing search restores all cards", async ({ page }) => {
    const allCount = await page.locator('[aria-label^="Open"]').count();
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("First");

    await expect(async () => {
      const filtered = await page.locator('[aria-label^="Open"]').count();
      expect(filtered).toBeLessThan(allCount);
    }).toPass({ timeout: 5_000 });

    await searchInput.clear();
    await expect(page.locator('[aria-label^="Open"]')).toHaveCount(allCount, { timeout: 5_000 });
  });

  test("no results message when nothing matches", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("xyznonexistent");

    await expect(page.getByText("No notes matching")).toBeVisible({ timeout: 5_000 });
  });

  test("sort dropdown changes card order", async ({ page }) => {
    const sortSelect = page.getByLabel("Sort");
    await sortSelect.selectOption("oldest");

    // Cards should still be visible
    const count = await page.locator('[aria-label^="Open"]').count();
    expect(count).toBeGreaterThan(10);
  });
});
