import { test, expect } from '@playwright/test';

test.describe('Calibre Library Application', () => {
  test.describe('Homepage', () => {
    test('should load the application', async ({ page }) => {
      await page.goto('/');
      expect(page.url()).toContain('/');
      await expect(page.locator('my-calibre-server-root')).toHaveCount(1);
    });

    test('should display the application title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Shared library/);
    });
  });

  test.describe('API Health Check', () => {
    test('should have a healthy API backend', async ({ request }) => {
      const response = await request.get('http://localhost:3333/api/health');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toMatchObject({ calibreStatus: 'OK', cacheStatus: 'OK' });
    });

    test('should have API version endpoint', async ({ request }) => {
      const response = await request.get('http://localhost:3333/api/version');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('version');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
      await page.goto('/');
      await expect(page.locator('my-calibre-server-root')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      await expect(page.locator('my-calibre-server-root')).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await expect(page.locator('my-calibre-server-root')).toBeVisible();
    });
  });
});
