import { test, expect } from '@playwright/test';
import { loginViaUi, testUser } from './helpers';

/**
 * Browser-driven book detail page (PR4): opening a book, rating it,
 * following series/author/tag links, and the download/kindle affordances
 * (only present when the opened book actually has EPUB/MOBI data).
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
