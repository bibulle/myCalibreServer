import { test, expect } from '@playwright/test';
import { loginViaUi, testUser } from './helpers';

/**
 * Browser-driven navigation: the header's nav tabs, search box, sort/lang
 * toolbar and theme toggle - the app shell delivered in PR2/PR3.
 */
test.describe('UI - Navigation', () => {
  test('should switch between the header nav tabs', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);

    await page.locator('.nav-tabs a[href="/books"]').click();
    await expect(page).toHaveURL(/\/books/);
    await expect(page.locator('.nav-tabs a[href="/books"]')).toHaveClass(/active/);

    await page.locator('.nav-tabs a[href="/series"]').click();
    await expect(page).toHaveURL(/\/series/);
    await expect(page.locator('.nav-tabs a[href="/series"]')).toHaveClass(/active/);

    await page.locator('.nav-tabs a[href="/authors"]').click();
    await expect(page).toHaveURL(/\/authors/);

    await page.locator('.nav-tabs a[href="/tags"]').click();
    await expect(page).toHaveURL(/\/tags/);

    await page.locator('.nav-tabs a[href="/home"]').click();
    await expect(page).toHaveURL(/\/home/);
  });

  test('should filter the books list via the header search box', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await expect(page).toHaveURL(/\/books/);

    await page.locator('.search input').fill('zzz_nonexistent_book_xyz_12345');
    await page.waitForTimeout(600);

    await expect(page.locator('.empty-title')).toBeVisible();
  });

  test('should match every search word independently of the order (issue #241)', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await expect(page).toHaveURL(/\/books/);

    // "Test Book 2" (author "John Doe") must be found whatever the word
    // order or case, including with words spread across title and author.
    for (const search of ['2 book', 'book DOE', 'doe 2']) {
      await page.locator('.search input').fill(search);
      await page.waitForTimeout(600);

      await expect(page.locator('.rl-card .title', { hasText: 'Test Book 2' }).first()).toBeVisible();
      await expect(page.locator('.rl-card .title', { hasText: 'Test Book 1' })).toHaveCount(0);
    }

    // ... but a word matching no book still yields no result
    await page.locator('.search input').fill('book zzz_nonexistent');
    await page.waitForTimeout(600);
    await expect(page.locator('.empty-title')).toBeVisible();
  });

  test('should toggle the dark theme', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);

    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveClass(/dark-theme/);

    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
  });

  test('should change sort order from the sort menu on the books page', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.locator('.nav-tabs a[href="/books"]').click();
    await expect(page).toHaveURL(/\/books/);

    await page.locator('.sort-toggle').click();
    await page.locator('.sort-menu button', { hasText: /author/i }).click();

    await expect(page.locator('.sort-toggle')).toContainText(/author/i);
  });
});
