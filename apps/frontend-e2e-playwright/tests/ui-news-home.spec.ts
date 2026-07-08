import { test, expect } from '@playwright/test';
import { loginViaUi, testUser } from './helpers';

/**
 * Browser-driven news/home page (PR8): grouped "added" sections and
 * clicking through to a book's detail page.
 */
test.describe('UI - News/home', () => {
  test('should show grouped news sections and open a book from a row', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);

    await expect(page.locator('.news-group').first()).toBeVisible();
    await expect(page.locator('.group-header h2').first()).toBeVisible();
    await expect(page.locator('.news-row').first()).toBeVisible();

    await page.locator('.news-row').first().click();
    await expect(page).toHaveURL(/\/book\/\d+/);
  });
});
