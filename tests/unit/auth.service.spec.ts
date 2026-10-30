import { afterEach, describe, expect, it, vi } from 'vitest'

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}))

vi.mock('../../src/services/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signOut: signOutMock,
    },
  },
}))

import { signOut } from '../../src/services/auth.service'

describe('auth.service signOut', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('ends the current local session without requiring a remote logout request', async () => {
    signOutMock.mockResolvedValue({ error: null })

    await signOut()

    expect(signOutMock).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('surfaces Supabase sign-out errors', async () => {
    signOutMock.mockResolvedValue({ error: { message: 'Sign out failed' } })

    await expect(signOut()).rejects.toThrow('Sign out failed')
  })
})
