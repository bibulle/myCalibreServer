import { test, expect } from '@playwright/test';
import { testUser, adminUser } from './helpers';

/**
 * Browser-driven authentication flows (login/signup/logout forms), as
 * opposed to authentication.spec.ts which only exercises the API directly.
 */
test.describe('UI - Authentication', () => {
  test('should log in through the form and land on the home page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill(testUser.username);
    await page.locator('#login-password').fill(testUser.password);
    await page.locator('.submit-btn').click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('.nav-tabs')).toBeVisible();
  });

  test('should show an error and stay on the login page for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill(testUser.username);
    await page.locator('#login-password').fill('not-the-right-password');
    await page.locator('.submit-btn').click();

    await expect(page.getByText(/wrong/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to signup via the in-app link and create a new account', async ({ page }) => {
    await page.goto('/login');
    await page.locator('.switch-auth .link').click();
    await expect(page).toHaveURL(/\/signup/);

    const uniqueUsername = `e2enew${Date.now()}`;
    await page.locator('#signup-username').fill(uniqueUsername);
    await page.locator('#signup-password').fill('password123');
    await page.locator('#signup-firstname').fill('New');
    await page.locator('#signup-lastname').fill('User');
    await page.locator('#signup-email').fill(`${uniqueUsername}@example.com`);
    await page.locator('.submit-btn').click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('.nav-tabs')).toBeVisible();
  });

  test('should log out from the profile page and require login again', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill(adminUser.username);
    await page.locator('#login-password').fill(adminUser.password);
    await page.locator('.submit-btn').click();
    await expect(page).toHaveURL(/\/home/);

    await page.locator('my-calibre-server-profile-button .avatar').click();
    await expect(page).toHaveURL(/\/profile/);

    await page.locator('.identity-actions .pill-outline').click();
    await page.waitForTimeout(300);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
