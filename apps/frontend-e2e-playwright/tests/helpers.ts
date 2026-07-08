import { APIRequestContext, Page } from '@playwright/test';

export const apiUrl = 'http://localhost:3333/api';

export const testUser = { username: 'testuser', password: 'password123' };
export const adminUser = { username: 'adminuser', password: 'password123' };
export const deletableUser = { username: 'deletableuser', password: 'password123' };

/**
 * Log in through the real login form (not the API) and wait for the
 * post-login redirect to /home, for UI-driven e2e tests.
 */
export async function loginViaUi(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.locator('.submit-btn').click();
  await page.waitForURL(/\/home/);
}

export async function login(request: APIRequestContext, username: string, password: string): Promise<string> {
  const response = await request.post(`${apiUrl}/authent/login`, {
    data: { username, password },
  });
  if (response.status() !== 201) {
    throw new Error(`Login failed for ${username}: ${response.status()}`);
  }
  const body = await response.json();
  return body.id_token;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBooks(request: APIRequestContext, token: string, params: Record<string, any> = {}): Promise<any> {
  const response = await request.get(`${apiUrl}/book`, { headers: authHeader(token), params });
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBook(request: APIRequestContext, token: string, bookId: number): Promise<any> {
  const response = await request.get(`${apiUrl}/book/${bookId}`, { headers: authHeader(token) });
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSeries(request: APIRequestContext, token: string, params: Record<string, any> = {}): Promise<any> {
  const response = await request.get(`${apiUrl}/series`, { headers: authHeader(token), params });
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAuthors(request: APIRequestContext, token: string, params: Record<string, any> = {}): Promise<any> {
  const response = await request.get(`${apiUrl}/author`, { headers: authHeader(token), params });
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTags(request: APIRequestContext, token: string, params: Record<string, any> = {}): Promise<any> {
  const response = await request.get(`${apiUrl}/tags`, { headers: authHeader(token), params });
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rateBook(request: APIRequestContext, token: string, bookId: number, rating: number): Promise<any> {
  const response = await request.post(`${apiUrl}/book/${bookId}/rating`, { headers: authHeader(token), data: { rating } });
  return response.json();
}
