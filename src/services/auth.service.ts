import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import type { UserProfile, UserRole } from '../types'

const ROLES: UserRole[] = ['superadmin', 'admin', 'dentist', 'patient']

export const CONFIG_ERROR =
  'Supabase is not configured. Copy .env.example to .env and add your project URL and anon key.'

function assertConfigured() {
  if (!isSupabaseConfigured) throw new Error(CONFIG_ERROR)
}

function friendlyMessage(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (text.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if (text.includes('already registered')) return 'An account with this email already exists.'
  if (text.includes('failed to fetch') || text.includes('network')) {
    return 'Network error. Check your connection and try again.'
  }
  return message
}

async function run<R extends { data: unknown; error: { message: string } | null }>(
  action: () => PromiseLike<R>,
): Promise<NonNullable<R['data']>> {
  assertConfigured()
  try {
    const { data, error } = await action()
    if (error) throw new Error(friendlyMessage(error.message))
    return data as NonNullable<R['data']>
  } catch (err) {
    throw new Error(friendlyMessage(err instanceof Error ? err.message : 'Something went wrong.'))
  }
}

export function signIn(email: string, password: string) {
  return run(() => supabase.auth.signInWithPassword({ email, password }))
}

// Role is never sent from the client; the database assigns 'patient' to new sign-ups.
export function signUp(email: string, password: string, fullName: string) {
  return run(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    }),
  )
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw new Error(friendlyMessage(error.message))
}

export function requestPasswordReset(email: string) {
  return run(() =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
  )
}

export function updatePassword(password: string) {
  return run(() => supabase.auth.updateUser({ password }))
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(friendlyMessage(error.message))
  return data.session
}

/** Role and clinic membership are read from RLS-protected tables, never browser storage. */
export async function fetchProfile(session: Session): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, contact_number, avatar_path, role, is_active')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw new Error(friendlyMessage(error.message))
  if (!data) return null

  const { data: membership, error: membershipError } = await supabase
    .from('clinic_memberships')
    .select('clinic_id, role, is_active')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(friendlyMessage(membershipError.message))
  if (!membership || !ROLES.includes(membership.role as UserRole)) return null

  return {
    id: data.id as string,
    email: session.user.email ?? '',
    fullName: (data.full_name as string | null) ?? session.user.email ?? '',
    contactNumber: (data.contact_number as string | null) ?? null,
    avatarPath: (data.avatar_path as string | null) ?? null,
    role: membership.role as UserRole,
    isActive: Boolean(data.is_active && membership.is_active),
    clinicId: membership.clinic_id as string,
  }
}
