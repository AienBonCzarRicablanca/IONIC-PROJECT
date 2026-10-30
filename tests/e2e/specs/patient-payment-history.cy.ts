const patientId = 'f67eecb7-67da-4470-81a9-0dfbc8f00489'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'

describe('Patient payment history', () => {
  it('shows only issued invoices and calculates balances from confirmed payments', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'mock-patient-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-patient-refresh-token',
        user: {
          id: patientId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'patient@example.com',
          email_confirmed_at: '2026-10-20T00:00:00Z',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: 'Test Patient' },
          identities: [],
          created_at: '2026-10-20T00:00:00Z',
        },
      },
    })
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: {
        id: patientId,
        full_name: 'Test Patient',
        contact_number: '09170000000',
        role: 'patient',
        is_active: true,
      },
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: {
        clinic_id: clinicId,
        role: 'patient',
        is_active: true,
      },
    })
    cy.intercept('GET', '**/rest/v1/patients*', {
      statusCode: 200,
      body: { id: 'patient-record-1', clinic_id: clinicId, full_name: 'Test Patient' },
    }).as('patientRecord')
    cy.intercept('GET', '**/rest/v1/invoices*', {
      statusCode: 200,
      body: [
        {
          id: 'invoice-1',
          invoice_number: 'INV-2026-001',
          status: 'partially_paid',
          total: 2000,
          issued_at: '2026-10-20T00:00:00Z',
          due_at: '2026-11-20',
          payments: [
            { id: 'payment-1', amount: 500, method: 'cash', is_confirmed: true, created_at: '2026-10-21T00:00:00Z' },
            { id: 'payment-2', amount: 200, method: 'gcash', is_confirmed: false, created_at: '2026-10-22T00:00:00Z' },
          ],
          payment_installments: [],
        },
        {
          id: 'invoice-2',
          invoice_number: 'INV-2026-002',
          status: 'void',
          total: 400,
          issued_at: '2026-10-20T00:00:00Z',
          due_at: null,
          payments: [],
          payment_installments: [],
        },
      ],
    }).as('patientInvoices')

    cy.visit('/login')
    cy.get('.auth-form ion-input').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'patient@example.com'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('.auth-form ion-input').eq(1).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'test-password'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-button.auth-submit').click()

    cy.location('pathname').should('eq', '/patient/dashboard')
    cy.get('ion-menu').contains('ion-item', 'Payments').click()
    cy.location('pathname').should('eq', '/patient/payments')
    cy.wait('@patientRecord')
    cy.wait('@patientInvoices')
    cy.contains('Total outstanding balance:').should('contain.text', '₱1,500.00')
    cy.contains('INV-2026-001').should('be.visible')
    cy.contains('INV-2026-002').should('be.visible')
    cy.contains('Balance ₱1,500.00').should('be.visible')
    cy.contains('₱500.00').should('be.visible')
    cy.contains('₱200.00').should('not.exist')
    cy.contains('₱0.00').should('be.visible')
    cy.contains('INV-2026-003').should('not.exist')
  })
})
