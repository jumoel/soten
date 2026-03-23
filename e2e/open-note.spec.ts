import { expect, test } from "@playwright/test";

const BASE = "/?localRepo=../test-repo";

// The open note panel is the container with max-h-[60vh]
const openPanel = '[class*="max-h-[60vh]"]';

test.describe("Open note panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('[aria-label^="Open"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test("clicking a card opens the note panel", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();

    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });
  });

  test("note panel shows rendered markdown by default", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();

    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`${openPanel} .prose`)).toBeVisible();
    await expect(page.locator("#open-note-textarea")).toBeHidden();
  });

  test("toggle button switches to edit mode", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.getByLabel("Edit mode").click();

    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 3_000 });
  });

  test("close button navigates to home", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Close" }).click();

    await expect(page.locator(openPanel)).toBeHidden({ timeout: 3_000 });
  });

  test("open card in grid has accent border", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await expect(page.locator(".border-accent").first()).toBeVisible();
  });

  test("escape key closes the panel", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");

    await expect(page.locator(openPanel)).toBeHidden({ timeout: 3_000 });
  });

  test("browser back button closes an open note", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.goBack();

    await expect(page.locator(openPanel)).toBeHidden({ timeout: 3_000 });
  });

  test("delete button shows confirmation dialog", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Delete this note?")).toBeVisible({ timeout: 3_000 });
  });

  test("delete confirmation can be cancelled", async ({ page }) => {
    await page.locator('[aria-label^="Open"]').first().click();
    await expect(page.locator(openPanel)).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Delete this note?")).toBeVisible({ timeout: 3_000 });

    // Cancel the dialog
    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close, note panel should still be open
    await expect(page.getByText("Delete this note?")).toBeHidden({ timeout: 3_000 });
    await expect(page.locator(openPanel)).toBeVisible();
  });

  test("discard button shows on new draft", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Discard" }).click();

    await expect(page.getByText("Discard this draft?")).toBeVisible({ timeout: 3_000 });
  });

  test("discard confirmation can be cancelled", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Discard this draft?")).toBeVisible({ timeout: 3_000 });

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText("Discard this draft?")).toBeHidden({ timeout: 3_000 });
    await expect(page.locator("#open-note-textarea")).toBeVisible();
  });

  test("saving empty note shows confirmation", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    // Leave content empty and click Save
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Save an empty note?")).toBeVisible({ timeout: 3_000 });
  });

  test("empty note confirmation can be dismissed", async ({ page }) => {
    await page.getByRole("button", { name: "New note" }).click();
    await expect(page.locator("#open-note-textarea")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Save an empty note?")).toBeVisible({ timeout: 3_000 });

    await page.getByRole("button", { name: "Keep editing" }).click();

    await expect(page.getByText("Save an empty note?")).toBeHidden({ timeout: 3_000 });
    await expect(page.locator("#open-note-textarea")).toBeVisible();
  });
});
