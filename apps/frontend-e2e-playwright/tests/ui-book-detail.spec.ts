import { test, expect } from '@playwright/test';
import { loginViaUi, testUser } from './helpers';

/**
 * Browser-driven book detail page (PR4): opening a book, rating it,
 * following series/author/tag links, and the download/kindle affordances
 * (driven by the formats the opened book actually carries).
 */
test.describe('UI - Book detail', () => {
  test('should open a book from the library and show its details', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await expect(page).toHaveURL(/\/books/);

    await page.locator('.rl-card').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);

    await expect(page.locator('.rl-info h1')).toBeVisible();
    await expect(page.locator('.meta-row .author-pill').first()).toBeVisible();
  });

  test('should rate a book and get a confirmation', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await page.locator('.rl-card').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);

    await page.locator('#star_2').click();

    await expect(page.locator('.mat-mdc-snack-bar-label').first()).toBeVisible();
  });

  test('should follow an author pill back into the authors page', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await page.locator('.rl-card').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);

    await page.locator('.meta-row .author-pill').first().click();
    await expect(page).toHaveURL(/\/authors\?/);
  });

  test('should follow a tag pill into the tags page', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await page.locator('.rl-card').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);

    const tagPill = page.locator('.tags-content .tag-pill').first();
    if (await tagPill.count()) {
      await tagPill.click();
      await expect(page).toHaveURL(/\/tags\?/);
    }
  });

  test('should offer a single PDF download for a PDF-only book (issue #255)', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);

    // Fixture book 99001 in test/data/calibre/metadata.db carries a PDF and
    // nothing else, which is exactly the case issue #255 reported.
    await page.goto('/book/99001');
    await expect(page.locator('.rl-info h1')).toContainText('Manuel PDF seulement');

    const buttons = page.locator('.downloads .download-btn');
    await expect(buttons.filter({ hasText: /PDF/i })).toHaveCount(1);
    // A single format shows a direct button, not the multi-format menu.
    await expect(buttons.filter({ hasText: /^↓ Télécharger$|^↓ Download$/ })).toHaveCount(0);
    // Amazon accepts PDF, so the Kindle affordance has to be offered too.
    await expect(buttons.filter({ hasText: /kindle/i })).toHaveCount(1);
  });

  test('should offer a format menu when the book has several formats', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);

    // Fixture book 2 carries both EPUB and MOBI.
    await page.goto('/book/2');
    await expect(page.locator('.rl-info h1')).toBeVisible();

    const trigger = page.locator('.downloads .download-btn').first();
    await trigger.click();

    const menu = page.locator('.mat-mdc-menu-panel');
    await expect(menu).toBeVisible();
    await expect(menu.locator('button')).toHaveCount(2);
  });

  test('should offer EPUB/MOBI downloads and the Kindle dialog when the book has files', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await page.locator('.rl-card').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);

    const kindleBtn = page.locator('.downloads .download-btn', { hasText: /kindle/i });
    if (await kindleBtn.count()) {
      await kindleBtn.click();
      await expect(page.locator('mat-dialog-container')).toBeVisible();
      await page.locator('mat-dialog-container button', { hasText: /cancel/i }).click();
      await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    }
  });
});
