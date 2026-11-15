describe("Trade Task Manager – Komplett-Durchlauf (10 Tasks: Erstellen -> Erledigen -> Löschen)", () => {
  const anzahl = 50;
  const batchId = Date.now();
  // Erzeugt 10 eindeutige Aufgabennamen
  const taskTitles = Array.from({ length: anzahl }, (_, i) => `Trading Check #${i + 1} (${batchId})`);

  it(`sollte ${anzahl} Aufgaben erstellen, als DONE markieren und komplett wieder löschen`, () => {
    cy.intercept("GET", "/api/tasks").as("getTasks");
    cy.intercept("POST", "/api/tasks").as("createTask");
    cy.intercept("PUT", "/api/tasks/*").as("updateTask");
    cy.intercept("DELETE", "/api/tasks/*").as("deleteTask");

    cy.visit("/");
    cy.wait("@getTasks");

    // ---------------------------------------------------------
    // 1. SCHRITT: 10 Aufgaben über das Formular anlegen (POST)
    // ---------------------------------------------------------
    taskTitles.forEach((title, index) => {
      const priority = index % 3 === 0 ? "HIGH" : index % 2 === 0 ? "MEDIUM" : "LOW";

      cy.get("#title").type(title);
      cy.get("#description").type(`Automatischer Testlauf Nr. ${index + 1}`);
      cy.get("#priority").select(priority);
      cy.get('#taskForm button[type="submit"]').click();

      cy.wait("@createTask").its("response.statusCode").should("be.oneOf", [200, 201]);
      cy.wait("@getTasks");

      cy.contains('[data-cy="task-item"]', title)
          .should("be.visible")
          .and("contain", priority)
          .and("contain", "OPEN");
    });

    // ---------------------------------------------------------
    // 2. SCHRITT: Alle 10 Aufgaben als erledigt markieren (PUT)
    // ---------------------------------------------------------
    taskTitles.forEach((title) => {
      cy.contains('[data-cy="task-item"]', title)
          .find(".btn-done")
          .click();

      cy.wait("@updateTask").its("response.statusCode").should("eq", 200);
      cy.wait("@getTasks");

      cy.contains('[data-cy="task-item"]', title)
          .should("contain", "DONE")
          .find(".btn-done")
          .should("not.exist");
    });

    // ---------------------------------------------------------
    // 3. SCHRITT: Alle 10 Aufgaben wieder löschen (DELETE)
    // ---------------------------------------------------------
    taskTitles.forEach((title) => {
      cy.contains('[data-cy="task-item"]', title)
          .find(".btn-del")
          .click();

      cy.wait("@deleteTask").its("response.statusCode").should("be.oneOf", [200, 204]);
      cy.wait("@getTasks");

      cy.get("#taskList").should("not.contain", title);
    });
  });
});
