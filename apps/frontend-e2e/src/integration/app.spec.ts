describe('Calibre Library Application', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Homepage', () => {
    it('should load the application', () => {
      cy.url().should('include', '/');
      // Check for the custom root element
      cy.get('my-calibre-server-root').should('exist');
    });

    it('should display the application title', () => {
      // Check for title or main content
      cy.title().should('contain', 'Shared library');
    });
  });

  describe('API Health Check', () => {
    it('should have a healthy API backend', () => {
      cy.request('http://localhost:3333/api/health').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        expect(response.body.status).to.have.property('calibreStatus', 'OK');
        expect(response.body.status).to.have.property('cacheStatus', 'OK');
      });
    });

    it('should have API version endpoint', () => {
      cy.request('http://localhost:3333/api/version').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('version');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      cy.get('my-calibre-server-root').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.get('my-calibre-server-root').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.get('my-calibre-server-root').should('be.visible');
    });
  });
});
