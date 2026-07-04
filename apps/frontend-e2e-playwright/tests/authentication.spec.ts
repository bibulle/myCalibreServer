import { test, expect } from '@playwright/test';
import { apiUrl, testUser, adminUser, login, authHeader } from './helpers';

/**
 * Only covers API-based login flows - visiting the Angular app directly
 * from an e2e test isn't exercised here (see app.spec.ts for the flows that
 * only need the app to load, without authentication).
 */
test.describe('Authentication', () => {
  test.describe('Login via API', () => {
    test('should successfully login with valid credentials', async ({ request }) => {
      const response = await request.post(`${apiUrl}/authent/login`, {
        data: { username: testUser.username, password: testUser.password },
      });
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id_token');
    });

    test('should fail login with invalid username', async ({ request }) => {
      const response = await request.post(`${apiUrl}/authent/login`, {
        data: { username: 'nonexistentuser', password: 'wrongpassword' },
      });
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('message');
    });

    test('should fail login with invalid password', async ({ request }) => {
      const response = await request.post(`${apiUrl}/authent/login`, {
        data: { username: testUser.username, password: 'wrongpassword' },
      });
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.message).toContain('wrong');
    });

    test('should login admin user with admin role', async ({ request }) => {
      const token = await login(request, adminUser.username, adminUser.password);

      const userResponse = await request.get(`${apiUrl}/authent/user`, { headers: authHeader(token) });
      const userBody = await userResponse.json();
      expect(userBody.user.local.isAdmin).toBe(true);
    });
  });

  test.describe('Protected Routes', () => {
    test('should reject unauthenticated API requests', async ({ request }) => {
      const response = await request.get(`${apiUrl}/book`);
      expect(response.status()).toBe(401);
    });

    test('should allow authenticated API access', async ({ request }) => {
      const token = await login(request, testUser.username, testUser.password);
      const response = await request.get(`${apiUrl}/book`, { headers: authHeader(token) });
      expect(response.status()).toBe(200);
    });
  });

  test.describe('API Authentication', () => {
    test('should include auth token in authenticated requests', async ({ request }) => {
      const token = await login(request, testUser.username, testUser.password);
      const response = await request.get(`${apiUrl}/book`, { headers: authHeader(token) });
      expect(response.status()).toBe(200);
    });

    test('should reject requests without authentication', async ({ request }) => {
      const response = await request.get(`${apiUrl}/book`);
      expect(response.status()).toBe(401);
    });

    test('should reject requests with invalid token', async ({ request }) => {
      const response = await request.get(`${apiUrl}/book`, { headers: authHeader('invalid-token-12345') });
      expect(response.status()).toBe(401);
    });

    test('should access user info with valid token', async ({ request }) => {
      const token = await login(request, testUser.username, testUser.password);
      const response = await request.get(`${apiUrl}/authent/user`, { headers: authHeader(token) });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('id');
      expect(body.user.local).toHaveProperty('username', testUser.username);
    });
  });

  test.describe('User Roles', () => {
    test('should identify regular user', async ({ request }) => {
      const token = await login(request, testUser.username, testUser.password);
      const response = await request.get(`${apiUrl}/authent/user`, { headers: authHeader(token) });
      const body = await response.json();
      expect(body.user.local).toHaveProperty('isAdmin', false);
    });

    test('should identify admin user', async ({ request }) => {
      const token = await login(request, adminUser.username, adminUser.password);
      const response = await request.get(`${apiUrl}/authent/user`, { headers: authHeader(token) });
      const body = await response.json();
      expect(body.user.local).toHaveProperty('isAdmin', true);
    });
  });
});
