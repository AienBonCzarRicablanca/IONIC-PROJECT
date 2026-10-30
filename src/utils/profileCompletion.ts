import type { UserProfile } from '../types'

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function isPatientProfileComplete(profile: UserProfile | null) {
  if (!profile || profile.role !== 'patient') return true
  return hasValue(profile.fullName) && hasValue(profile.contactNumber)
}
