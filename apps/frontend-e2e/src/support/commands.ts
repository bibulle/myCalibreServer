// ***********************************************
// Custom Cypress commands for E2E testing
// https://on.cypress.io/custom-commands
// ***********************************************

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    /**
     * Login to the application via API
     * @param username - Username for login
     * @param password - Password for login
     * @returns JWT token and user data
     */
    login(username: string, password: string): Chainable<any>;

    /**
     * Login via API and set token in localStorage
     * @param username - Username for login
     * @param password - Password for login
     */
    loginViaUI(username: string, password: string): Chainable<void>;

    /**
     * Logout and clear authentication
     */
    logout(): Chainable<void>;

    /**
     * Seed the test databases (MongoDB and Calibre)
     */
    seedDatabase(): Chainable<void>;

    /**
     * Get books from the API with optional filters
     * @param filters - Optional query parameters (search, limit_to, etc.)
     */
    getBooks(filters?: any): Chainable<any>;

    /**
     * Get a specific book by ID
     * @param bookId - Book ID
     */
    getBook(bookId: number): Chainable<any>;

    /**
     * Get series list from the API
     */
    getSeries(): Chainable<any>;

    /**
     * Get authors list from the API
     */
    getAuthors(): Chainable<any>;

    /**
     * Get tags list from the API
     */
    getTags(): Chainable<any>;

    /**
     * Check API health status
     */
    checkApiHealth(): Chainable<any>;

    /**
     * Rate a book
     * @param bookId - Book ID to rate
     * @param rating - Rating value (1-5)
     */
    rateBook(bookId: number, rating: number): Chainable<any>;
  }
}

/**
 * Login to the application via API
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  const apiUrl = Cypress.env('apiUrl');

  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/authent/login`,
      body: { username, password },
    })
    .then((response) => {
      expect(response.status).to.eq(201);
      const token = response.body.id_token;
      const user = response.body.user;

      // Store auth data in localStorage
      window.localStorage.setItem('authToken', token);
      window.localStorage.setItem('currentUser', JSON.stringify(user));

      return { token, user };
    });
});

/**
 * Login via API and set token in localStorage for UI navigation
 */
Cypress.Commands.add('loginViaUI', (username: string, password: string) => {
  cy.login(username, password).then((authData) => {
    window.localStorage.setItem('token', authData.token);
    window.localStorage.setItem('user', JSON.stringify(authData.user));
  });
});

/**
 * Logout and clear authentication
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  cy.visit('/');
});

/**
 * Seed the test databases
 */
Cypress.Commands.add('seedDatabase', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';

  // In a real scenario, you'd have a test endpoint to seed the database
  // For now, we assume the database is seeded before running tests
  cy.log('Database seeding should be done before running tests');
  cy.log('Run: node apps/frontend-e2e/scripts/seed-test-db.js');

  // Verify the API is healthy
  cy.request(`${apiUrl}/health`).then((response) => {
    expect(response.status).to.eq(200);
  });
});
/**
 * Get books from the API
 */
Cypress.Commands.add('getBooks', (filters = {}) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/book`,
      qs: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      // API returns a StreamableFile, so body might be a string
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      return data;
    });
});

/**
 * Get a specific book by ID
 */
Cypress.Commands.add('getBook', (bookId: number) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/book/${bookId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return response.body;
    });
});

/**
 * Get series list
 */
Cypress.Commands.add('getSeries', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/series`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      // API returns a StreamableFile, so body might be a string
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      return data;
    });
});

/**
 * Get authors list
 */
Cypress.Commands.add('getAuthors', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/author`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      // API returns a StreamableFile, so body might be a string
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      return data;
    });
});

/**
 * Get tags list
 */
Cypress.Commands.add('getTags', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/tags`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      // API returns a StreamableFile, so body might be a string
      const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      return data;
    });
});

/**
 * Check API health
 */
Cypress.Commands.add('checkApiHealth', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';

  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/health`,
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status');
      return response.body;
    });
});

/**
 * Rate a book (requires authentication)
 */
Cypress.Commands.add('rateBook', (bookId: number, rating: number) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3333/api';
  const token = window.localStorage.getItem('authToken');

  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/book/${bookId}/rating`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { rating },
    })
    .then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
      return response.body;
    });
});

/**
 * Seed test databases (MongoDB and Calibre)
 * This command executes the seed script to reset test data
 */
Cypress.Commands.add('seedDatabase', () => {
  // Cypress runs from apps/frontend-e2e, so use relative path from there
  cy.exec('node scripts/seed-test-db.js', { timeout: 30000 }).then((result) => {
    expect(result.code).to.eq(0);
    cy.log('✓ Test databases seeded successfully');
  });
});
