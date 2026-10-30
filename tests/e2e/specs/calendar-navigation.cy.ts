const userId = 'd58a57c0-f51f-4bea-b540-5b49efb87028'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'
const dentistId = 'dentist-1'
const appointment = {
  id: 'appointment-1',
  patient_id: 'patient-1',
  dentist_id: dentistId,
  service_id: 'service-1',
  starts_at: '2026-10-25T02:00:00.000Z',
  ends_at: '2026-10-25T02:30:00.000Z',
  status: 'confirmed',
  reason: 'Checkup',
  notes: null,
  patients: { full_name: 'Test Patient' },
  services: { name: 'Cleaning', duration_minutes: 30 },
  dentists: { profiles: { full_name: 'Dr Test' } },
}

function mockLogin(role: 'admin' | 'dentist') {
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
        email: `${role}@example.com`,
        email_confirmed_at: '2026-10-20T00:00:00Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Test User' },
        identities: [],
        created_at: '2026-10-20T00:00:00Z',
      },
    },
  })
  cy.intercept('GET', '**/rest/v1/profiles*', {
    statusCode: 200,
    body: {
      id: userId,
      full_name: 'Test User',
      contact_number: null,
      avatar_path: null,
      role,
      is_active: true,
    },
  })
  cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
    statusCode: 200,
    body: { clinic_id: clinicId, role, is_active: true },
  })
}

describe('Calendar navigation', () => {
  it('supports month browsing and opening a selected date in the admin calendar', () => {
    mockLogin('admin')
    cy.intercept({ method: 'GET', url: /\/rest\/v1\/appointments(?:\?.*)?$/ }, {
      statusCode: 200,
      body: [appointment],
    })
    cy.intercept('GET', '**/rest/v1/patients*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/rest/v1/dentists*', {
      statusCode: 200,
      body: [{ id: dentistId, profiles: { full_name: 'Dr Test' } }],
    })
    cy.intercept('GET', '**/rest/v1/services*', {
      statusCode: 200,
      body: [{ id: 'service-1', name: 'Cleaning', duration_minutes: 30 }],
    })

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
    cy.get('ion-menu').contains('ion-item', 'Appointments').click()
    cy.location('pathname').should('eq', '/admin/appointments')

    cy.get('ion-segment').then(($segment) => {
      const segment = $segment[0] as HTMLIonSegmentElement
      segment.value = 'month'
      segment.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: 'month' } }))
    })
    cy.get('ion-segment').should('have.prop', 'value', 'month')
    cy.get('input[aria-label="Jump to date"]')
      .invoke('val', '2026-10-25')
      .trigger('change')
    cy.contains('October 2026').should('be.visible')
    cy.get('button[aria-label="Sunday, Oct 25, 2026, 1 appointment"]').click()
    cy.contains('ion-segment-button', 'Day').should('have.class', 'segment-button-checked')
    cy.get('.dentist-columns').contains('Test Patient').should('be.visible')
    cy.get('.dentist-column').contains('Dr Test').should('be.visible')
  })

  it('shows only the signed-in dentist’s own appointments in their calendar', () => {
    mockLogin('dentist')
    cy.intercept('GET', '**/rest/v1/dentists*', {
      statusCode: 200,
      body: { id: dentistId },
    })
    cy.intercept({ method: 'GET', url: /\/rest\/v1\/appointments(?:\?.*)?$/ }, (request) => {
      expect(request.url).to.include(`dentist_id=eq.${dentistId}`)
      request.reply({ statusCode: 200, body: [appointment] })
    }).as('dentistAppointments')

    cy.visit('/login')
    cy.get('.auth-form ion-input').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'dentist@example.com'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('.auth-form ion-input').eq(1).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'test-password'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-button.auth-submit').click()
    cy.location('pathname').should('eq', '/dentist/dashboard')
    cy.get('ion-menu').contains('ion-item', 'My Calendar').click()
    cy.location('pathname').should('eq', '/dentist/calendar')
    cy.wait('@dentistAppointments')
    cy.contains('Test Patient').should('be.visible')
    cy.contains('Cleaning').should('be.visible')
  })
})
