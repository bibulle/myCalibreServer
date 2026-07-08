import { test, expect } from '@playwright/test';
import { loginViaUi, testUser } from './helpers';

/**
 * Browser-driven series/authors/tags pages (PR5): series volumes, the
 * author accordion, and the tag cloud's select/clear-filter interaction.
 */
test.describe('UI - Series, authors and tags', () => {
  test('should show series with clickable volumes that open the book page', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/series"]').click();
    await expect(page).toHaveURL(/\/series/);

    await expect(page.locator('.series-section').first()).toBeVisible();
    await page.locator('.volume').first().click();

    await expect(page).toHaveURL(/\/book\/\d+/);
  });

  test('should expand an author accordion to reveal their books', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/authors"]').click();
    await expect(page).toHaveURL(/\/authors/);

    const firstAuthor = page.locator('.author-section').first();
    await expect(firstAuthor).toHaveClass(/collapsed/);
    await expect(firstAuthor.locator('.books-grid')).toHaveCount(0);

    await firstAuthor.locator('.author-header').click();
    await expect(firstAuthor).not.toHaveClass(/collapsed/);
    await expect(firstAuthor.locator('.books-grid .mini-book').first()).toBeVisible();

    await firstAuthor.locator('.mini-book').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);
  });

  test('should select a tag, show its filtered books, then clear the filter', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/tags"]').click();
    await expect(page).toHaveURL(/\/tags/);

    await expect(page.locator('.clear-filter')).toHaveCount(0);

    const firstTag = page.locator('.tag-pill').first();
    await firstTag.click();

    await expect(page.locator('.filtered-books-grid .filtered-book').first()).toBeVisible();
    await expect(page.locator('.clear-filter')).toBeVisible();

    await page.locator('.clear-filter').click();
    await expect(page.locator('.filtered-books-grid')).toHaveCount(0);
  });
});
