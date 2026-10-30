const userId = 'd58a57c0-f51f-4bea-b540-5b49efb87028'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'

describe('Inventory transaction history', () => {
  it('shows recent stock changes with the staff member and note', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'mock-admin-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-admin-refresh-token',
        user: {
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@example.com',
          email_confirmed_at: '2026-10-20T00:00:00Z',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: 'Test Admin' },
          identities: [],
          created_at: '2026-10-20T00:00:00Z',
        },
      },
    })
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: {
        id: userId,
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true,
      },
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: {
        clinic_id: clinicId,
        role: 'admin',
        is_active: true,
      },
    })
    cy.intercept({ method: 'GET', url: /\/rest\/v1\/inventory_items(?:\?.*)?$/ }, {
      statusCode: 200,
      body: [
        {
          id: 'item-1',
          clinic_id: clinicId,
          name: 'Dental gloves',
          category: 'Supplies',
          unit: 'box',
          quantity: 12,
          reorder_threshold: 4,
          unit_cost: 250,
          supplier: null,
          is_archived: false,
          created_at: '2026-10-20T00:00:00Z',
          updated_at: '2026-10-20T00:00:00Z',
        },
      ],
    }).as('inventoryItems')
    cy.intercept({ method: 'GET', url: /\/rest\/v1\/inventory_transactions(?:\?.*)?$/ }, {
      statusCode: 200,
      body: [
        {
          id: 'transaction-1',
          transaction_type: 'addition',
          quantity_change: 10,
          note: 'Weekly restock',
          created_at: '2026-10-24T08:00:00Z',
          profiles: { full_name: 'Test Admin' },
        },
        {
          id: 'transaction-2',
          transaction_type: 'consumption',
          quantity_change: -2,
          note: 'Used for appointments',
          created_at: '2026-10-23T08:00:00Z',
          profiles: { full_name: 'Test Dentist' },
        },
      ],
    }).as('inventoryTransactions')

    cy.visit('/login')
    cy.get('.auth-form ion-input').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'admin@example.com'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('.auth-form ion-input').eq(1).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'test-password'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-button.auth-submit').click()

    cy.location('pathname').should('eq', '/admin/dashboard')
    cy.get('ion-menu').contains('ion-item', 'Inventory').click()
    cy.location('pathname').should('eq', '/admin/inventory')
    cy.wait('@inventoryItems')
    cy.contains('ion-item', 'Dental gloves').contains('ion-button', 'History').click()
    cy.wait('@inventoryTransactions')
    cy.get('ion-modal').last().within(() => {
      cy.contains('History: Dental gloves').should('be.visible')
      cy.contains('Stock added').should('be.visible')
      cy.contains('+10').should('be.visible')
      cy.contains('Weekly restock').should('be.visible')
      cy.contains('Test Admin').should('be.visible')
      cy.contains('Stock used').should('be.visible')
      cy.contains('-2').should('be.visible')
      cy.contains('Used for appointments').should('be.visible')
      cy.contains('Test Dentist').should('be.visible')
    })
  })
})
