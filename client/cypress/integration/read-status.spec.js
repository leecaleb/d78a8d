/// <reference types="cypress" />

const alice = {
    username: "Alice",
    email: "alice@example.com",
    password: "Z6#6%xfLTarZ9U",
  };
  const bob = {
    username: "Bob",
    email: "bob@example.com",
    password: "L%e$xZHC4QKP@F",
  };
  
  describe("Bug Fix: Sending Messages", () => {
    it("setup", () => {
      cy.signup(alice.username, alice.email, alice.password);
      cy.logout();
      cy.signup(bob.username, bob.email, bob.password);
      cy.logout();
    });
  
    it("sends message in a new conversation", () => {
      cy.login(alice.username, alice.password);
  
      cy.get("input[name=search]").type("Bob");
      cy.contains("Bob").click();
  
      cy.get("input[name=text]").type("First message{enter}");
  
      cy.contains("First message");
    });
  
    it("displays unread message with bold font", () => {
      cy.reload();
      cy.login(bob.username, bob.password);
      cy.get('[data-cy=previewUnreadText]').should('have.css', 'font-weight', '700')
    });

    it("displays unread message amount", () => {
      cy.reload();
      cy.login(bob.username, bob.password);
      cy.get('[data-cy=unreadAmountText]').contains(1)
    });

    it("displays read message with normal font weight", () => {
      cy.reload();
      cy.login(bob.username, bob.password);
      cy.contains("Alice").click();
      cy.get('[data-cy=previewUnreadText]').should('have.css', 'font-weight', '400')
    });
  });
  