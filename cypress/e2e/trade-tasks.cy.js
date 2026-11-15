describe('Trade Task Manager - E2E UI Tests (Positive & Negative Flows)', () => {

  beforeEach(() => {
    cy.visit('/');
  });

  // =========================================================================
  // 1. POSITIVE TESTS (Happy Paths)
  // =========================================================================
  context('Positive Test Cases (CRUD Lifecycle)', () => {

    it('should create, complete (DONE), and delete a trade task successfully', () => {
      const uniqueTitle = `Cypress E2E DAX Check ${Date.now()}`;
      const description = 'Automated E2E test verifying full UI CRUD lifecycle';

      // API-Calls abfangen, um sauber auf das Neuladen der Liste zu warten
      cy.intercept('POST', '/api/tasks').as('createTask');
      cy.intercept('GET', '/api/tasks').as('getTasks');
      cy.intercept('PUT', '/api/tasks/*').as('updateTask');
      cy.intercept('DELETE', '/api/tasks/*').as('deleteTask');

      // 1. CREATE: Formular ausfüllen & absenden
      cy.get('input[placeholder*="Aufgabentitel"]').type(uniqueTitle);
      cy.get('input[placeholder*="Beschreibung"], textarea[placeholder*="Beschreibung"]').type(description);
      cy.get('select').select('HIGH');
      cy.contains('button', 'Aufgabe anlegen').click();

      cy.wait('@createTask');
      cy.wait('@getTasks');

      // Prüfen, ob die neue Aufgabe mit HIGH und OPEN angezeigt wird
      cy.contains(uniqueTitle)
          .should('be.visible')
          .parent()
          .should('contain', 'HIGH')
          .and('contain', 'OPEN');

      // 2. UPDATE: Frisch nach dem Titel suchen und auf "Erledigt" klicken
      cy.contains(uniqueTitle)
          .closest('div, li, tr')
          .within(() => {
            cy.contains('button', 'Erledigt').click();
          });

      cy.wait('@updateTask');
      cy.wait('@getTasks');

      // Frisch prüfen, ob Status jetzt DONE ist
      cy.contains(uniqueTitle)
          .parent()
          .should('contain', 'DONE');

      // 3. DELETE: Frisch suchen und auf "Löschen" klicken
      cy.contains(uniqueTitle)
          .closest('div, li, tr')
          .within(() => {
            cy.contains('button', 'Löschen').click();
          });

      cy.wait('@deleteTask');
      cy.wait('@getTasks');

      // Prüfen, dass die Aufgabe aus dem DOM verschwunden ist
      cy.contains(uniqueTitle).should('not.exist');
    });
  });

  // =========================================================================
  // 2. NEGATIVE TESTS (Validierung & API-Fehlersimulation)
  // =========================================================================
  context('Negative Test Cases (Validation & Error Resilience)', () => {

    it('should prevent creating a task with an empty title or keep UI stable', () => {
      cy.get('input[placeholder*="Aufgabentitel"]').clear();
      cy.contains('button', 'Aufgabe anlegen').click();

      // Prüfen, dass das Eingabefeld sichtbar und die Anwendung stabil bleibt
      cy.get('input[placeholder*="Aufgabentitel"]').should('be.visible');
      cy.contains('Trade Task Manager').should('be.visible');
    });

    it('should handle a 500 Internal Server Error gracefully when loading tasks', () => {
      // Verhindert, dass Cypress bei einer simulierten 500er-Fetch-Rejection abbricht
      cy.on('uncaught:exception', () => false);

      cy.intercept('GET', '/api/tasks', {
        statusCode: 500,
        body: []
      }).as('getTasksFail');

      cy.visit('/');
      cy.wait('@getTasksFail');

      // Die Anwendung darf nicht abstürzen – die Hauptüberschrift bleibt sichtbar
      cy.contains('Trade Task Manager').should('be.visible');
    });

    it('should handle a 404 Not Found error gracefully when deleting a non-existent task', () => {
      cy.on('uncaught:exception', () => false);

      // Erst eine temporäre Aufgabe anlegen, damit sicher ein Löschen-Button vorhanden ist
      const tempTitle = `Temp 404 Check ${Date.now()}`;
      cy.get('input[placeholder*="Aufgabentitel"]').type(tempTitle);
      cy.contains('button', 'Aufgabe anlegen').click();
      cy.contains(tempTitle).should('be.visible');

      // 404-Fehler beim Löschen simulieren
      cy.intercept('DELETE', '/api/tasks/*', {
        statusCode: 404,
        body: { message: 'Task not found' }
      }).as('deleteNotFound');

      cy.contains(tempTitle)
          .closest('div, li, tr')
          .within(() => {
            cy.contains('button', 'Löschen').click();
          });

      cy.wait('@deleteNotFound').its('response.statusCode').should('eq', 404);
      cy.contains('Trade Task Manager').should('be.visible');
    });
  });
});
