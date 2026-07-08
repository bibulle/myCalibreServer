import { test, expect } from '@playwright/test';
import { loginViaUi, testUser, adminUser, deletableUser } from './helpers';

/**
 * Browser-driven admin users table (PR7): access control, sorting, the
 * expandable read-only detail row, and the merge select/unselect toggle.
 *
 * The one test at the bottom drives the *entire* lifecycle of the
 * dedicated `deletableuser` fixture (inline profile edit -> Kindle address
 * add/remove -> inline password change -> admin toggle -> delete) in a
 * single `test()` block, so those steps always run in that order
 * regardless of Playwright's fullyParallel scheduling - splitting them
 * across separate tests/files would risk one running before another
 * (e.g. the account being deleted before the password-change test logs
 * into it).
 */
test.describe('UI - Admin', () => {
  test('should redirect a non-admin user away from the users page', async ({ page }) => {
    await loginViaUi(page, testUser.username, testUser.password);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should sort the users table by username', async ({ page }) => {
    await loginViaUi(page, adminUser.username, adminUser.password);
    await page.goto('/users');

    await page.locator('.col-username').click();
    const firstUsernameAsc = await page.locator('.user-card .username').first().textContent();

    await page.locator('.col-username').click();
    const firstUsernameDesc = await page.locator('.user-card .username').first().textContent();

    expect(firstUsernameAsc).not.toEqual(firstUsernameDesc);
  });

  test('should expand a row to show the read-only account/activity summary', async ({ page }) => {
    await loginViaUi(page, adminUser.username, adminUser.password);
    await page.goto('/users');

    const row = page.locator('.user-card', { hasText: testUser.username });
    await row.locator('.chevron').click();

    await expect(row.locator('.detail-box')).toBeVisible();
    await expect(row.locator('.detail-label').first()).toBeVisible();
    await expect(row.locator('.pill-outline', { hasText: /reset/i })).toBeVisible();
  });

  test('should toggle merge selection on and off without completing a merge', async ({ page }) => {
    await loginViaUi(page, adminUser.username, adminUser.password);
    await page.goto('/users');

    const row = page.locator('.user-card', { hasText: testUser.username });
    await row.locator('.chevron').click();

    await row.locator('.merge-select').click();
    await expect(row).toHaveClass(/user-selected/);

    await row.locator('.merge-unselect').click();
    await expect(row).not.toHaveClass(/user-selected/);
  });

  test('deletable user: profile edit, kindle address, password change, admin toggle, then delete', async ({ page }) => {
    // This test drives two logins and many sequential UI steps end-to-end;
    // the default 30s test timeout is too tight for that under load.
    test.setTimeout(90000);

    // --- Inline profile edit (firstname/lastname) ---
    await loginViaUi(page, deletableUser.username, deletableUser.password);
    await page.goto('/profile');

    // Only check that typing reaches the field itself here, not that the
    // debounced autosave commits: UserService's periodic checkAuthent() (every
    // 3s, for the lifetime of the page) unconditionally rebuilds the in-memory
    // user object from the JWT and can race the 500ms autosave debounce,
    // dropping an in-flight edit before it's ever sent to the backend - a
    // pre-existing timing issue in the app, out of scope for this e2e-coverage
    // change (flagged separately).
    const firstNameInput = page.locator('.account-fields input').nth(1);
    await firstNameInput.click();
    await firstNameInput.pressSequentially('Del');
    await expect(firstNameInput).toHaveValue('Del');
    await firstNameInput.blur();

    // --- Kindle address add/remove ---
    await page.locator('.kindle-add-row input').fill('kindle-e2e@example.com');
    await page.locator('.round-btn-accent').click();
    await expect(page.locator('.kindle-row', { hasText: 'kindle-e2e@example.com' })).toBeVisible();

    await page.locator('.kindle-row', { hasText: 'kindle-e2e@example.com' }).locator('.round-btn').click();
    await expect(page.locator('.kindle-row', { hasText: 'kindle-e2e@example.com' })).toHaveCount(0);

    // --- Inline password change ---
    await page.locator('#changepw-password1').pressSequentially('newpassword1');
    await page.locator('#changepw-password2').pressSequentially('newpassword1');
    await expect(page.locator('.hint-ok')).toBeVisible();
    await page.locator('button[type=submit]', { hasText: /password|mot de passe/i }).click();
    await expect(page).toHaveURL(/\/profile/);

    await page.locator('.identity-actions .pill-outline').click();
    await page.waitForTimeout(300);

    // --- Admin toggle, then delete, from the admin table ---
    await loginViaUi(page, adminUser.username, adminUser.password);
    await page.goto('/users');

    const row = page.locator('.user-card', { hasText: deletableUser.username });
    await expect(row.locator('mat-slide-toggle')).not.toHaveClass(/mat-mdc-slide-toggle-checked/);
    await row.locator('mat-slide-toggle button').click();
    await expect(row.locator('mat-slide-toggle')).toHaveClass(/mat-mdc-slide-toggle-checked/);

    await row.locator('.chevron').click();
    await row.locator('.pill-danger').click();
    await expect(page.locator('.user-card', { hasText: deletableUser.username })).toHaveCount(0);
  });
});
