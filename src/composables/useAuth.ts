import { computed, readonly, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../services/supabase'
import * as authService from '../services/auth.service'
import { ROLE_HOME, type UserProfile, type UserRole } from '../types'
import { isPatientProfileComplete } from '../utils/profileCompletion'

const session = ref<Session | null>(null)
const profile = ref<UserProfile | null>(null)
const initialized = ref(false)
const loading = ref(false)
let initPromise: Promise<void> | null = null

async function loadProfile() {
  profile.value = session.value ? await authService.fetchProfile(session.value) : null
}

function initialize(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    session.value = await authService.getSession()
    await loadProfile()
    initialized.value = true

    if (isSupabaseConfigured) {
      supabase.auth.onAuthStateChange((event, next) => {
        session.value = next
        if (event === 'SIGNED_OUT') {
          profile.value = null
          return
        }
        // Defer to avoid calling Supabase inside its own auth callback.
        setTimeout(() => {
          void loadProfile()
        }, 0)
      })
    }
  })()

  return initPromise
}

async function logout() {
  await authService.signOut()
  session.value = null
  profile.value = null
}

async function login(email: string, password: string) {
  loading.value = true
  try {
    const { session: next } = await authService.signIn(email, password)
    session.value = next
    await loadProfile()
    if (!profile.value) {
      await logout()
      throw new Error('Your account has no clinic profile yet. Please contact the clinic.')
    }
    if (!profile.value.isActive) {
      await logout()
      throw new Error('This account is deactivated. Please contact the clinic.')
    }
    return profile.value
  } finally {
    loading.value = false
  }
}

async function register(email: string, password: string, fullName: string) {
  loading.value = true
  try {
    return await authService.signUp(email, password, fullName)
  } finally {
    loading.value = false
  }
}

function homeFor(role: UserRole | undefined): string {
  return role ? ROLE_HOME[role] : '/login'
}

export function useAuth() {
  const requiresProfileCompletion = computed(() => !isPatientProfileComplete(profile.value))

  return {
    session: readonly(session),
    profile: readonly(profile),
    initialized: readonly(initialized),
    loading: readonly(loading),
    isAuthenticated: computed(() => Boolean(session.value && profile.value?.isActive)),
    role: computed(() => profile.value?.role),
    requiresProfileCompletion,
    initialize,
    login,
    register,
    logout,
    homeFor,
    refreshProfile: loadProfile,
  }
}
