import { test, expect } from '@playwright/test';

/**
 * Subset of `apps/frontend-e2e/src/integration/simple-api.spec.ts` that does not
 * require a user account (no MongoDB dependency): health/version checks, and
 * confirming protected routes reject unauthenticated requests (rejected by the
 * JWT guard before any database lookup happens).
 */
test.describe('Calibre Server E2E - API Tests (read-only)', () => {
  const apiUrl = 'http://localhost:3333/api';

  test.describe('Health & Version', () => {
    test('should return API health status', async ({ request }) => {
      const response = await request.get(`${apiUrl}/health`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toMatchObject({ calibreStatus: 'OK' });
    });

    test('should return API version', async ({ request }) => {
      const response = await request.get(`${apiUrl}/version`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('status');
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should reject book requests without authentication', async ({ request }) => {
      const response = await request.get(`${apiUrl}/book`);
      expect(response.status()).toBe(401);
    });

    test('should reject series requests without authentication', async ({ request }) => {
      const response = await request.get(`${apiUrl}/series`);
      expect(response.status()).toBe(401);
    });

    test('should reject author requests without authentication', async ({ request }) => {
      const response = await request.get(`${apiUrl}/author`);
      expect(response.status()).toBe(401);
    });

    test('should reject tags requests without authentication', async ({ request }) => {
      const response = await request.get(`${apiUrl}/tags`);
      expect(response.status()).toBe(401);
    });
  });
});
