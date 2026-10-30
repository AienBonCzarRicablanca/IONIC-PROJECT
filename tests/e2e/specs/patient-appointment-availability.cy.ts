const patientId = 'f67eecb7-67da-4470-81a9-0dfbc8f00489'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'
const serviceId = 'service-1'
const dentistId = 'dentist-1'

describe('Patient appointment availability', () => {
  it('blocks booking until availability loads and submits the selected service duration', () => {
    const firstDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const nextDate = new Date(firstDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const dateValue = (value: Date) => {
      const pad = (part: number) => String(part).padStart(2, '0')
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    }
    let busyRequests = 0
    let expectedStart = ''

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
      body: [{ id: serviceId, name: 'Extended cleaning', duration_minutes: 60, price: 1500 }],
    }).as('patientServices')
    cy.intercept('POST', '**/rest/v1/rpc/list_bookable_dentists', {
      statusCode: 200,
      body: [{ id: dentistId, full_name: 'Dr Test', specialization: null }],
    }).as('bookableDentists')
    cy.intercept('GET', '**/rest/v1/appointments*', {
      statusCode: 200,
      body: [],
    }).as('patientAppointments')
    cy.intercept('POST', '**/rest/v1/rpc/dentist_busy_slots', (request) => {
      expect(request.body.p_dentist).to.equal(dentistId)
      busyRequests += 1
      if (busyRequests === 1) {
        request.reply({
          statusCode: 500,
          body: { code: 'XX000', message: 'Availability service is temporarily unavailable.' },
        })
        return
      }
      const dayStart = new Date(request.body.p_from)
      const busyEnd = new Date(dayStart.getTime() + 10 * 60 * 60 * 1000)
      expectedStart = busyEnd.toISOString()
      request.reply({
        statusCode: 200,
        body: [{
          starts_at: new Date(dayStart.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
          ends_at: busyEnd.toISOString(),
        }],
      })
    }).as('busySlots')
    cy.intercept('POST', '**/rest/v1/appointments', (request) => {
      const startsAt = new Date(request.body.starts_at)
      const endsAt = new Date(request.body.ends_at)
      expect(startsAt.toISOString()).to.equal(expectedStart)
      expect(endsAt.getTime() - startsAt.getTime()).to.equal(60 * 60 * 1000)
      expect(request.body.status).to.equal('pending')
      expect(request.body.reason).to.equal('Routine checkup')
      request.reply({ statusCode: 201, body: [{ id: 'new-appointment' }] })
    }).as('createAppointment')

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

    cy.get('ion-select').eq(0).then(($select) => {
      const select = $select[0] as HTMLIonSelectElement
      select.value = serviceId
      select.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: serviceId } }))
    })
    cy.get('ion-select').eq(1).then(($select) => {
      const select = $select[0] as HTMLIonSelectElement
      select.value = dentistId
      select.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: dentistId } }))
    })
    cy.get('#appt-date').then(($input) => {
      const input = $input[0] as HTMLInputElement
      input.value = dateValue(firstDate)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.wait('@busySlots')
    cy.get('ion-select').eq(2).should(($select) => {
      expect(($select[0] as HTMLIonSelectElement).disabled).to.equal(true)
    })
    cy.get('ion-select').eq(2).should(($select) => {
      expect(($select[0] as HTMLIonSelectElement).placeholder).to.equal('Availability could not be loaded')
    })
    cy.contains('ion-button', 'Request appointment').should(($button) => {
      expect(($button[0] as HTMLIonButtonElement).disabled).to.equal(true)
    })

    cy.get('#appt-date').then(($input) => {
      const input = $input[0] as HTMLInputElement
      input.value = dateValue(nextDate)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    cy.wait('@busySlots')
    cy.get('ion-select').eq(2).should(($select) => {
      expect(($select[0] as HTMLIonSelectElement).disabled).to.equal(false)
    })
    cy.get('ion-select').eq(2).find('ion-select-option').should('have.length.greaterThan', 0)

    cy.get('ion-select').eq(2).find('ion-select-option').first().then(($option) => {
      const value = ($option[0] as HTMLOptionElement).value
      const select = Cypress.$('ion-select')[2] as HTMLIonSelectElement
      select.value = value
      select.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value } }))
    })
    cy.get('ion-textarea').then(($textarea) => {
      const textarea = $textarea[0] as HTMLIonTextareaElement
      textarea.value = ' Routine checkup '
      textarea.dispatchEvent(new CustomEvent('ionInput', {
        bubbles: true,
        detail: { value: textarea.value },
      }))
    })
    cy.contains('ion-button', 'Request appointment').should('not.be.disabled').click()
    cy.wait('@createAppointment')
    cy.get('ion-toast').should(($toast) => {
      expect(($toast[0] as HTMLIonToastElement).message).to.equal(
        'Request sent. The clinic will confirm it soon.',
      )
      expect(($toast[0] as HTMLIonToastElement).isOpen).to.equal(true)
    })
  })
})
