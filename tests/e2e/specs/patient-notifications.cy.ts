const patientId = 'f67eecb7-67da-4470-81a9-0dfbc8f00489'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'

describe('Patient notifications', () => {
  it('keeps a notice unread on save failure and marks it read after a successful retry', () => {
    let updateAttempts = 0

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
      body: { clinic_id: clinicId, role: 'patient', is_active: true },
    })
    cy.intercept('GET', '**/rest/v1/patients*', {
      statusCode: 200,
      body: { id: 'patient-record-1', clinic_id: clinicId, full_name: 'Test Patient' },
    })
    cy.intercept('GET', '**/rest/v1/notifications*', {
      statusCode: 200,
      body: [
        {
          id: 'notice-1',
          title: 'Appointment reminder',
          message: 'Your appointment is tomorrow.',
          read_at: null,
          created_at: '2026-10-22T08:00:00Z',
        },
      ],
    }).as('patientNotifications')
    cy.intercept('PATCH', '**/rest/v1/notifications*', (request) => {
      expect(request.body.read_at).to.be.a('string')
      updateAttempts += 1
      if (updateAttempts === 1) {
        request.reply({
          statusCode: 500,
          body: { code: 'XX000', message: 'Temporary notification update failure.' },
        })
        return
      }
      request.reply({ statusCode: 204, body: '' })
    }).as('markNotificationRead')

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
    cy.get('ion-menu').contains('ion-item', 'Notifications').click()
    cy.location('pathname').should('eq', '/patient/notifications')
    cy.wait('@patientNotifications')
    cy.contains('ion-item', 'Appointment reminder').find('ion-chip').should('contain.text', 'New')

    cy.contains('ion-item', 'Appointment reminder').click()
    cy.wait('@markNotificationRead')
    cy.get('[role="alert"]').should('contain.text', 'Temporary notification update failure.')
    cy.contains('ion-item', 'Appointment reminder').find('ion-chip').should('contain.text', 'New')

    cy.contains('ion-item', 'Appointment reminder').click()
    cy.wait('@markNotificationRead')
    cy.get('[role="alert"]').should('not.exist')
    cy.contains('ion-item', 'Appointment reminder').find('ion-chip').should('not.exist')
  })
})
