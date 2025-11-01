/**
 * Authentication E2E Tests
 *
 * Tests for user authentication flows including:
 * - Login with valid/invalid credentials
 * - User roles
 * - Authenticated API access
 * - UI-based authentication flows
 */

describe('Authentication', () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = Cypress.env('testUser');
  const adminUser = Cypress.env('adminUser');

  beforeEach(() => {
    // Clear auth state before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login via API', () => {
    it('should successfully login with valid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id_token');
        cy.log('Login successful');
      });
    });

    it('should fail login with invalid username', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: 'nonexistentuser',
          password: 'wrongpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('message');
      });
    });

    it('should fail login with invalid password', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: 'wrongpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.message).to.include('wrong');
      });
    });

    it('should login admin user with admin role', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: adminUser.username,
          password: adminUser.password,
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id_token');
        const token = response.body.id_token;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/authent/user`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((userResponse) => {
          expect(userResponse.body.user.local.isAdmin).to.be.true;
          cy.log('Admin user has admin privileges');
        });
      });
    });
  });

  describe('Login via UI', () => {
    // FIXME: UI tests temporarily skipped - frontend crashes when Cypress visits it
    // Issue: Nx serve terminates when Cypress loads the Angular app
    it.skip('should display the application', () => {
      cy.visit('/', { failOnStatusCode: false, timeout: 10000 });
      cy.get('body', { timeout: 10000 }).should('exist');
      cy.get('my-calibre-server-root', { timeout: 10000 }).should('exist');
    });

    it('should login via custom command and store token', () => {
      cy.login(testUser.username, testUser.password).then((authData) => {
        expect(authData).to.have.property('token');
        expect(authData.token).to.not.be.empty;
        cy.log('Login via custom command successful');
      });
    });

    it.skip('should verify localStorage after login', () => {
      cy.visit('/', { failOnStatusCode: false });
      cy.login(testUser.username, testUser.password).then(() => {
        cy.window().then((win) => {
          const token = win.localStorage.getItem('authToken');
          expect(token).to.exist;
          cy.log('Token stored in localStorage');
        });
      });
    });
  });

  describe('Protected Routes', () => {
    it('should reject unauthenticated API requests', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        cy.log('Unauthenticated request properly rejected');
      });
    });

    it('should allow authenticated API access', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((loginResponse) => {
        const token = loginResponse.body.id_token;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/book`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          cy.log('Authenticated user can access books API');
        });
      });
    });
  });

  describe('API Authentication', () => {
    let userToken: string;

    before(() => {
      // Get auth token for subsequent tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        userToken = response.body.id_token;
      });
    });

    it('should include auth token in authenticated requests', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log('Authenticated book request successful');
      });
    });

    it('should reject requests without authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should reject requests with invalid token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('should access user info with valid token', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/authent/user`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('user');
        expect(response.body.user).to.have.property('id');
        expect(response.body.user.local).to.have.property('username', testUser.username);
        cy.log('User info retrieved successfully');
      });
    });
  });

  describe('User Roles', () => {
    it('should identify regular user', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((loginResponse) => {
        const token = loginResponse.body.id_token;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/authent/user`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((userResponse) => {
          expect(userResponse.body.user.local).to.have.property('isAdmin', false);
          cy.log('Regular user verified');
        });
      });
    });

    it('should identify admin user', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: adminUser.username,
          password: adminUser.password,
        },
      }).then((loginResponse) => {
        const token = loginResponse.body.id_token;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/authent/user`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((userResponse) => {
          expect(userResponse.body.user.local).to.have.property('isAdmin', true);
          cy.log('Admin user verified');
        });
      });
    });
  });
});
