const dentistUserId = 'c3df78e8-6f16-4959-8122-84cb72b13793'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'
const patientId = 'patient-chart-1'
const dentistId = 'dentist-record-1'

describe('Dentist clinical records', () => {
  it('stores a trimmed diagnosis and procedure in the selected patient chart', () => {
    let records = []

    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'mock-dentist-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-dentist-refresh-token',
        user: {
          id: dentistUserId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'dentist@example.com',
          email_confirmed_at: '2026-10-20T00:00:00Z',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { full_name: 'Dr Test' },
          identities: [],
          created_at: '2026-10-20T00:00:00Z',
        },
      },
    })
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: { id: dentistUserId, full_name: 'Dr Test', role: 'dentist', is_active: true },
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: { clinic_id: clinicId, role: 'dentist', is_active: true },
    })
    cy.intercept('GET', '**/rest/v1/patients*', {
      statusCode: 200,
      body: {
        id: patientId,
        full_name: 'Test Patient',
        email: 'patient@example.com',
        contact_number: '09170000000',
        date_of_birth: '1990-01-01',
        allergies: 'Penicillin',
        medical_history: 'Asthma',
      },
    }).as('patientChart')
    cy.intercept('GET', '**/rest/v1/dentists*', {
      statusCode: 200,
      body: { id: dentistId },
    }).as('dentistProfile')
    cy.intercept('GET', '**/rest/v1/odontogram_entries*', {
      statusCode: 200,
      body: [],
    }).as('odontogram')
    cy.intercept('GET', '**/rest/v1/dental_records*', (request) => {
      request.reply({ statusCode: 200, body: records })
    }).as('clinicalRecords')
    cy.intercept('GET', '**/rest/v1/clinical_notes*', {
      statusCode: 200,
      body: [],
    }).as('clinicalNotes')
    cy.intercept('GET', '**/rest/v1/treatment_plans*', {
      statusCode: 200,
      body: [],
    }).as('treatmentPlans')
    cy.intercept('POST', '**/rest/v1/dental_records', (request) => {
      expect(request.body).to.deep.equal({
        clinic_id: clinicId,
        patient_id: patientId,
        dentist_id: dentistId,
        diagnosis: 'Dental caries',
        procedures_performed: 'Composite filling',
        observations: null,
        recommendations: 'Brush twice daily',
        follow_up_instructions: null,
      })
      records = [{
        id: 'record-1',
        clinic_id: clinicId,
        patient_id: patientId,
        dentist_id: dentistId,
        diagnosis: request.body.diagnosis,
        procedures_performed: request.body.procedures_performed,
        observations: null,
        recommendations: request.body.recommendations,
        follow_up_instructions: null,
        recorded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        appointment_id: null,
      }]
      request.reply({ statusCode: 201, body: '' })
    }).as('saveClinicalRecord')

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
    cy.visit(`/dentist/patients/${patientId}`)
    cy.wait('@patientChart')
    cy.wait('@dentistProfile')
    cy.wait('@odontogram')
    cy.wait('@clinicalRecords')
    cy.wait('@clinicalNotes')
    cy.wait('@treatmentPlans')

    cy.contains('ion-card-content', 'Penicillin').should('contain.text', 'Allergies:')
    cy.contains('ion-card-content', 'Asthma').should('contain.text', 'Medical history:')
    cy.get('ion-segment').first().then(($segment) => {
      const segment = $segment[0] as HTMLIonSegmentElement
      segment.value = 'records'
      segment.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: 'records' } }))
    })
    cy.get('ion-input').first().then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = '  Dental caries  '
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-textarea').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonTextareaElement
      input.value = '  Composite filling  '
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-textarea').eq(2).then(($input) => {
      const input = $input[0] as HTMLIonTextareaElement
      input.value = '  Brush twice daily  '
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })

    cy.contains('ion-button', 'Save record').click()
    cy.wait('@saveClinicalRecord')
    cy.contains('ion-card-title', 'Dental caries').should('be.visible')
    cy.contains('ion-card-content', 'Composite filling').should('contain.text', 'Procedure:')
    cy.contains('ion-card-content', 'Brush twice daily').should('contain.text', 'Recommendations:')
  })
})
