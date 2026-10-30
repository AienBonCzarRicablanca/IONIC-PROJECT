const userId = 'd58a57c0-f51f-4bea-b540-5b49efb87028'
const clinicId = 'b9416d80-e8f7-4ae9-af4e-16de67e384e7'

describe('Profile editing', () => {
  it('updates personal details, requests email change, changes password, and uploads a private avatar', () => {
    let avatarPath: string | null = null
    cy.intercept({ method: 'POST', url: /\/auth\/v1\/token\?grant_type=password(?:&|$)/ }, {
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
    }).as('login')
    cy.intercept('GET', '**/rest/v1/profiles*', (request) => {
      request.reply({
        statusCode: 200,
        body: {
          id: userId,
          full_name: 'Test Patient',
          contact_number: '',
          avatar_path: avatarPath,
          role: 'patient',
          is_active: true,
        },
      })
    })
    cy.intercept('GET', '**/rest/v1/clinic_memberships*', {
      statusCode: 200,
      body: { clinic_id: clinicId, role: 'patient', is_active: true },
    })
    cy.intercept('POST', '**/rest/v1/rpc/update_my_profile', (request) => {
      expect(request.body).to.deep.equal({
        p_full_name: 'Updated Patient',
        p_contact_number: '09171234567',
      })
      request.reply({ statusCode: 204, body: '' })
    }).as('updatePersonalInfo')
    cy.intercept('PUT', '**/auth/v1/user', (request) => {
      expect(request.body).to.satisfy((body: { email?: string; password?: string }) =>
        body.email === 'updated@example.com' || body.password === 'NewPassword123!',
      )
      request.reply({
        statusCode: 200,
        body: { id: userId, email: request.body.email ?? 'patient@example.com' },
      })
    }).as('updateAuthUser')
    cy.intercept('POST', '**/storage/v1/object/profile-avatars/**', (request) => {
      request.reply({ statusCode: 200, body: { Key: 'profile-avatars/avatar.png' } })
    }).as('uploadAvatar')
    cy.intercept('PATCH', '**/rest/v1/profiles*', (request) => {
      avatarPath = request.body.avatar_path
      request.reply({ statusCode: 204, body: '' })
    }).as('saveAvatarPath')
    cy.intercept('POST', '**/storage/v1/object/sign/profile-avatars/**', {
      statusCode: 200,
      body: { signedURL: '/storage/v1/object/sign/profile-avatars/avatar.png?token=mock' },
    }).as('signAvatar')

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
    cy.wait('@login')
    cy.location('pathname').should('eq', '/profile')
    cy.location('search').should('include', 'completeProfile=1')

    cy.get('ion-input').contains('Full name')
    cy.get('ion-input').eq(0).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'Updated Patient'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-input').eq(1).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = '09171234567'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.contains('ion-button', 'Save personal information').click()
    cy.wait('@updatePersonalInfo')

    cy.get('ion-input').eq(2).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'updated@example.com'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.contains('ion-button', 'Update email').click()
    cy.wait('@updateAuthUser')
    cy.contains('Check your new email address for a confirmation link.').should('be.visible')

    cy.get('ion-input').eq(3).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'NewPassword123!'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.get('ion-input').eq(4).then(($input) => {
      const input = $input[0] as HTMLIonInputElement
      input.value = 'NewPassword123!'
      input.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: input.value } }))
    })
    cy.contains('ion-button', 'Update password').click()
    cy.wait('@updateAuthUser')
    cy.get('ion-input').eq(3).should('have.prop', 'value', '')
    cy.get('ion-input').eq(4).should('have.prop', 'value', '')

    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('avatar'), fileName: 'avatar.png', mimeType: 'image/png' },
      { force: true },
    )
    cy.wait('@uploadAvatar')
    cy.wait('@saveAvatarPath')
    cy.wait('@signAvatar')
    cy.get('ion-avatar img[alt="Your profile picture"]')
      .should('have.attr', 'src')
      .and('include', 'token=mock')
  })
})
