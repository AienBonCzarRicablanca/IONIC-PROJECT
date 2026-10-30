const patientId = 'f67eecb7-67da-4470-81a9-0dfbc8f00489'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'
const appointmentId = 'appointment-future'

describe('Patient appointment cancellation', () => {
  it('offers cancellation only more than 24 hours ahead and refreshes after cancellation', () => {
    const futureStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    const futureEnd = new Date(futureStart.getTime() + 30 * 60 * 1000)
    const nearStart = new Date(Date.now() + 12 * 60 * 60 * 1000)
    const nearEnd = new Date(nearStart.getTime() + 30 * 60 * 1000)
    let futureStatus = 'confirmed'

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
    cy.intercept('GET', '**/rest/v1/services*', {
      statusCode: 200,
      body: [{ id: 'service-1', name: 'Cleaning', duration_minutes: 30, price: 1000 }],
    }).as('patientServices')
    cy.intercept('POST', '**/rest/v1/rpc/list_bookable_dentists', {
      statusCode: 200,
      body: [{ id: 'dentist-1', full_name: 'Dr Test', specialization: null }],
    }).as('bookableDentists')
    cy.intercept('GET', '**/rest/v1/appointments*', (request) => {
      request.reply({
        statusCode: 200,
        body: [
          {
            id: appointmentId,
            starts_at: futureStart.toISOString(),
            ends_at: futureEnd.toISOString(),
            status: futureStatus,
            reason: 'Regular checkup',
            services: { name: 'Cleaning' },
          },
          {
            id: 'appointment-near',
            starts_at: nearStart.toISOString(),
            ends_at: nearEnd.toISOString(),
            status: 'pending',
            reason: 'Tooth pain',
            services: { name: 'Filling' },
          },
        ],
      })
    }).as('patientAppointments')
    cy.intercept('POST', '**/rest/v1/rpc/cancel_my_appointment', (request) => {
      expect(request.body).to.deep.equal({ p_appointment: appointmentId })
      futureStatus = 'cancelled'
      request.reply({ statusCode: 204, body: '' })
    }).as('cancelAppointment')

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
    cy.get('ion-menu').contains('ion-item', 'Appointments').click()
    cy.location('pathname').should('eq', '/patient/appointments')
    cy.wait('@patientServices')
    cy.wait('@bookableDentists')
    cy.wait('@patientAppointments')
    cy.contains('ion-item', 'Regular checkup').find('ion-button').should('be.visible').click()
    cy.wait('@cancelAppointment')
    cy.contains('ion-item', 'Regular checkup').should('contain.text', 'cancelled')
    cy.contains('ion-item', 'Regular checkup').find('ion-button').should('not.exist')
    cy.contains('ion-item', 'Tooth pain').find('ion-button').should('not.exist')
  })
})
