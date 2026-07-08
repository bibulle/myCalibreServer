import { test, expect } from '@playwright/test';
import { loginViaUi, testUser, adminUser } from './helpers';

/**
 * Browser-driven profile page (PR7): identity banner, account fields,
 * Kindle addresses, linked accounts and the inline password card.
 *
 * Destructive/order-sensitive interactions (saving profile edits, changing
 * the password, deleting the account) are exercised on the dedicated
 * `deletableuser` fixture in ui-admin.spec.ts, in a single test, so their
 * relative order is guaranteed regardless of Playwright's fullyParallel
 * scheduling. This file only covers read-only/non-mutating checks that are
 * safe to run concurrently with the rest of the suite.
 */
test.describe('UI - Profile', () => {
  test('should show the identity banner for the logged in user', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.goto('/profile');

    await expect(page.locator('.identity-info h1')).toContainText(testUser.username, { ignoreCase: true });
    await expect(page.locator('.identity-banner .avatar')).toBeVisible();
  });

  test('should show the administration button only for an admin user', async ({ page }) => {
    await loginViaUi(page, adminUser.username, adminUser.password);
    await page.goto('/profile');
    await expect(page.locator('.identity-actions .pill-accent')).toBeVisible();

    await page.locator('.identity-actions .pill-accent').click();
    await expect(page).toHaveURL(/\/users/);
  });

  test('should not show the administration button for a regular user', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.goto('/profile');
    await expect(page.locator('.identity-actions .pill-accent')).toHaveCount(0);
  });

  test('should show the linked-accounts connect buttons', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.goto('/profile');

    await expect(page.locator('.pill-google')).toBeVisible();
    await expect(page.locator('.pill-facebook')).toBeVisible();
  });

  test('should reflect password validation states without submitting', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.goto('/profile');

    const submit = page.locator('button[type=submit]', { hasText: /password|mot de passe/i });
    await expect(submit).toBeDisabled();

    // The component's password-matching logic is wired to (keyup)/(change),
    // not just ngModel's own "input" listener - .fill() sets the value
    // without dispatching either, so it never reaches PasswordState. Type
    // the characters for real so those handlers actually run.
    await page.locator('#changepw-password1').pressSequentially('abcdef');
    await page.locator('#changepw-password2').pressSequentially('different');
    await expect(page.locator('.hint-error')).toBeVisible();
    await expect(submit).toBeDisabled();

    await page.locator('#changepw-password2').fill('');
    await page.locator('#changepw-password2').pressSequentially('abcdef');
    await expect(page.locator('.hint-error')).toHaveCount(0);
    await expect(submit).toBeEnabled();
  });
});
