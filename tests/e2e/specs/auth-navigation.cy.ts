const userId = 'd58a57c0-f51f-4bea-b540-5b49efb87028'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'

describe('Authentication navigation', () => {
  it('renders the owner dashboard immediately after login without a page reload', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@example.com',
          email_confirmed_at: '2026-10-20T00:00:00Z',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: 'Test Owner' },
          identities: [],
          created_at: '2026-10-20T00:00:00Z',
        },
      },
    })
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: {
        id: userId,
        full_name: 'Test Owner',
        role: 'superadmin',
        is_active: true,
      },
    })
    cy.intercept('GET', '**/rest/v1/clinics*', {
      statusCode: 200,
      body: { timezone: 'Asia/Manila' },
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: {
        clinic_id: clinicId,
        role: 'superadmin',
        is_active: true,
      },
    })
    cy.intercept('HEAD', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      headers: { 'content-range': '0-1/2' },
    })
    cy.intercept('GET', '**/rest/v1/patients*', {
      statusCode: 200,
      headers: { 'content-range': '0-2/3' },
      body: [{ id: 'patient-1' }, { id: 'patient-2' }, { id: 'patient-3' }],
    })
    cy.intercept('GET', '**/rest/v1/appointments*', {
      statusCode: 200,
      body: [
        {
          id: 'appointment-1',
          status: 'pending',
          service_id: 'service-1',
          dentist_id: 'dentist-1',
          services: { name: 'Cleaning' },
          dentists: { profiles: { full_name: 'Dr Test' } },
        },
        {
          id: 'appointment-2',
          status: 'completed',
          service_id: 'service-2',
          dentist_id: 'dentist-1',
          services: { name: 'Filling' },
          dentists: { profiles: { full_name: 'Dr Test' } },
        },
      ],
    })
    cy.intercept('GET', '**/rest/v1/invoices*', {
      statusCode: 200,
      body: [
        { id: 'invoice-1', total: 1000, payments: [{ amount: 300, is_confirmed: true }] },
        { id: 'invoice-2', total: 500, payments: [{ amount: 250, is_confirmed: true }] },
      ],
    })
    cy.intercept('GET', '**/rest/v1/inventory_items*', {
      statusCode: 200,
      body: [{ id: 'item-1', quantity: 2, reorder_threshold: 5 }],
    })
    cy.intercept('GET', '**/rest/v1/payments*', {
      statusCode: 200,
      body: [{ amount: 300, created_at: new Date().toISOString(), invoices: { clinic_id: clinicId } }],
    })
    cy.intercept('GET', '**/rest/v1/audit_logs*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          action: 'UPDATE',
          entity_table: 'inventory_items',
          entity_id: 'item-1',
          metadata: { quantity: 2 },
          created_at: '2026-10-22T08:00:00Z',
          profiles: { full_name: 'Test Owner' },
        },
      ],
    })

    cy.visit('/login')
    cy.get('.auth-form ion-input').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'owner@example.com'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('.auth-form ion-input').eq(1).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'test-password'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-button.auth-submit').click()

    cy.location('pathname').should('eq', '/superadmin/dashboard')
    cy.get('ion-title').should('contain.text', 'Clinic Dashboard')
    cy.contains('ion-button', 'Refresh').should('be.visible')
    cy.contains('.stat', 'Total patients').should('contain.text', '3')
    cy.contains('.stat', 'Active staff').should('contain.text', '2')
    cy.contains('.stat', 'Appointments today').should('contain.text', '2')
    cy.contains('.stat', 'Open invoices').should('contain.text', '2')
    cy.contains('.stat', 'Low-stock items').should('contain.text', '1')

    cy.get('ion-menu').contains('ion-item', 'Analytics').click()
    cy.location('pathname').should('eq', '/superadmin/analytics')
    cy.contains('Revenue Analytics').should('be.visible')
    cy.contains('Appointment outcomes (last 6 months)').should('be.visible')
    cy.contains('ion-item', 'Cleaning').should('contain.text', '1 appointments')
    cy.contains('ion-item', 'Dr Test').should('contain.text', '2 total')

    cy.get('ion-menu').contains('ion-item', 'Audit Logs').click()
    cy.location('pathname').should('eq', '/superadmin/audit-logs')
    cy.contains('UPDATE · inventory_items').should('be.visible')
    cy.contains('Test Owner').should('be.visible')
    cy.contains('Record ID: item-1').should('be.visible')
    cy.contains('Metadata: {"quantity":2}').should('be.visible')

    cy.visit('/admin/dashboard')
    cy.location('pathname').should('eq', '/superadmin/dashboard')
    cy.get('ion-title').should('contain.text', 'Clinic Dashboard')
  })

  it('redirects incomplete patient profiles to My Profile right after login', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: userId,
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
        id: userId,
        full_name: 'Test Patient',
        contact_number: null,
        role: 'patient',
        is_active: true,
      },
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: { clinic_id: clinicId, role: 'patient', is_active: true },
    })

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

    cy.location('pathname').should('eq', '/profile')
    cy.location('search').should('include', 'completeProfile=1')
    cy.contains('Please complete your personal information first.').should('be.visible')
  })
})
