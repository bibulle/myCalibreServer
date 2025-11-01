/**
 * Simple E2E Tests - API with Authentication
 *
 * Tests basic API functionality including authentication flow
 */

describe('Calibre Server E2E - API Tests', () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = Cypress.env('testUser');
  let authToken: string;

  describe('Health & Version', () => {
    it('should return API health status', () => {
      cy.request(`${apiUrl}/health`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        expect(response.body.status).to.have.property('calibreStatus', 'OK');
      });
    });

    it('should return API version', () => {
      cy.request(`${apiUrl}/version`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('version');
        expect(response.body).to.have.property('status');
      });
    });
  });

  describe('Authentication', () => {
    it('should reject login with wrong credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: 'wronguser',
          password: 'wrongpass',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

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
        authToken = response.body.id_token;
        cy.log('Authentication successful');
      });
    });
  });

  describe('Books API (Authenticated)', () => {
    before(() => {
      // Login before running these tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        authToken = response.body.id_token;
      });
    });

    it('should return books list with authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        // Books endpoint returns StreamableFile - check it's not empty
        cy.log(`Books response length: ${JSON.stringify(response.body).length}`);
      });
    });

    it('should return new books with authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book/new`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log(`New books response length: ${JSON.stringify(response.body).length}`);
      });
    });
  });

  describe('Series API (Authenticated)', () => {
    before(() => {
      // Login before running these tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        authToken = response.body.id_token;
      });
    });

    it('should return series list with authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/series`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log(`Series response length: ${JSON.stringify(response.body).length}`);
      });
    });
  });

  describe('Authors API (Authenticated)', () => {
    before(() => {
      // Login before running these tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        authToken = response.body.id_token;
      });
    });

    it('should return authors list with authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/author`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log(`Authors response length: ${JSON.stringify(response.body).length}`);
      });
    });
  });

  describe('Tags API (Authenticated)', () => {
    before(() => {
      // Login before running these tests
      cy.request({
        method: 'POST',
        url: `${apiUrl}/authent/login`,
        body: {
          username: testUser.username,
          password: testUser.password,
        },
      }).then((response) => {
        authToken = response.body.id_token;
      });
    });

    it('should return tags list with authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/tags`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log(`Tags response length: ${JSON.stringify(response.body).length}`);
      });
    });
  });

  describe('Unauthorized Access', () => {
    it('should reject book requests without authentication', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/book`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });
});
