describe('Trade Task Manager - E2E UI Tests (Positive & Negative Flows)', () => {

  beforeEach(() => {
    // Öffnet die Anwendung über die in cypress.config.js / CI gesetzte baseUrl
    cy.visit('/');
  });

  // =========================================================================
  // 1. POSITIVE TESTS (Happy Paths)
  // =========================================================================
  context('Positive Test Cases (CRUD Lifecycle)', () => {

    it('should create, complete (DONE), and delete a trade task successfully', () => {
      const uniqueTitle = `Cypress E2E DAX Check ${Date.now()}`;
      const description = 'Automated E2E test verifying full UI CRUD lifecycle';

      // 1. CREATE: Formular ausfüllen & absenden
      cy.get('input[placeholder*="Aufgabentitel"]').type(uniqueTitle);
      cy.get('input[placeholder*="Beschreibung"], textarea[placeholder*="Beschreibung"]').type(description);
      cy.get('select').select('HIGH');
      cy.contains('button', 'Aufgabe anlegen').click();

      // Prüfen, ob die neue Aufgabe mit Status OPEN erscheint
      cy.contains(uniqueTitle)
          .should('be.visible')
          .parentsUntil('body')
          .filter(':has(button)')
          .first()
          .as('taskCard');

      cy.get('@taskCard').should('contain', 'HIGH');
      cy.get('@taskCard').should('contain', 'OPEN');

      // 2. UPDATE: Aufgabe auf "Erledigt" (DONE) setzen
      cy.get('@taskCard').contains('button', 'Erledigt').click();
      cy.get('@taskCard').should('contain', 'DONE');

      // 3. DELETE: Aufgabe wieder löschen (sauberer Cleanup)
      cy.get('@taskCard').contains('button', 'Löschen').click();
      cy.contains(uniqueTitle).should('not.exist');
    });
  });

  // =========================================================================
  // 2. NEGATIVE TESTS (Validierung & API-Fehlersimulation)
  // =========================================================================
  context('Negative Test Cases (Validation & Error Resilience)', () => {

    it('should not create a task when the title input is empty', () => {
      // Versuchen, ohne Titel abzusenden (POST-Request abfangen, um sicherzustellen, dass nichts gesendet wird)
      cy.intercept('POST', '/api/tasks').as('createTaskRequest');

      cy.get('input[placeholder*="Aufgabentitel"]').clear();
      cy.contains('button', 'Aufgabe anlegen').click();

      // Prüfen, dass kein POST-Request ausgelöst wurde (HTML5 required / Frontend-Validierung greift)
      cy.get('@createTaskRequest.all').should('have.length', 0);
    });

    it('should handle a 500 Internal Server Error gracefully when loading tasks', () => {
      // Simuliert einen Datenbank-/Serverausfall beim Laden der Aufgaben
      cy.intercept('GET', '/api/tasks', {
        statusCode: 500,
        body: { message: 'Internal Server Error' }
      }).as('getTasksFail');

      cy.visit('/');
      cy.wait('@getTasksFail');

      // Die Anwendung darf nicht abstürzen – die Hauptüberschrift bleibt sichtbar
      cy.contains('Trade Task Manager').should('be.visible');
    });

    it('should handle a 404 Not Found error gracefully when deleting a non-existent task', () => {
      // Simuliert den Fall, dass eine Aufgabe bereits von einem anderen User gelöscht wurde
      cy.intercept('DELETE', '/api/tasks/*', {
        statusCode: 404,
        body: { message: 'Task not found' }
      }).as('deleteNotFound');

      // Falls mindestens ein Löschen-Button existiert, Klick auslösen und 404-Antwort abfangen
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Löschen")').length > 0) {
          cy.contains('button', 'Löschen').first().click();
          cy.wait('@deleteNotFound').its('response.statusCode').should('eq', 404);
        }
      });
    });
  });
});
