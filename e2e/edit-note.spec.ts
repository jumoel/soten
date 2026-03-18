import { expect, test } from "@playwright/test";

const BASE = "/?localRepo=../test-repo";

const openPanel = '[class*="max-h-[60vh]"]';

test.describe("Edit note", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('[aria-label^="Open"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test("edit mode shows textarea with content", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.getByLabel("Edit mode").click();

    const textarea = page.locator("#open-note-textarea");
    await expect(textarea).toBeVisible({ timeout: 3_000 });
    await expect(textarea).toContainText("#");
  });

  test("new note via FAB opens in edit mode", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE);
    await expect(page.locator('[aria-label^="Open"]').first()).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("New note").click();

    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });
  });

  test("new note via top bar button opens in edit mode", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();

    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });
  });

  test("save button publishes draft", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    // The save button should be visible in edit mode for drafts
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("discard button shows on drafts", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    await expect(page.getByRole("button", { name: "Discard" })).toBeVisible();
  });

  test("new note shows creation timestamp immediately", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    // The timestamp should be visible in the floating action bar
    // It should show today's date (formatted like "Mar 18, 2026")
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "short" });
    const day = now.getDate();
    await expect(page.locator(openPanel).getByRole("time")).toContainText(`${month} ${day}`);
  });

  test("clicking save triggers publish", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    // Type some content
    await page.locator("#open-note-textarea").fill("# Test Note\n\nHello world.");

    // Click Save
    await page.getByRole("button", { name: "Save" }).click();

    // The "Saving..." indicator should appear (publish in progress)
    await expect(page.getByText("Saving")).toBeVisible({ timeout: 3_000 });
  });
});
