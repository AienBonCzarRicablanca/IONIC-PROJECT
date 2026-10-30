import { supabase } from './supabase'

const AVATAR_BUCKET = 'profile-avatars'
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type MyPatientDetails = {
  dateOfBirth: string | null
  sex: string | null
  address: string | null
  allergies: string | null
  medicalHistory: string | null
  emergencyContactName: string | null
  emergencyContactNumber: string | null
}

export async function getMyPatientDetails(userId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select(
      'date_of_birth, sex, address, allergies, medical_history, emergency_contact_name, emergency_contact_number',
    )
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    dateOfBirth: data.date_of_birth,
    sex: data.sex,
    address: data.address,
    allergies: data.allergies,
    medicalHistory: data.medical_history,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactNumber: data.emergency_contact_number,
  } satisfies MyPatientDetails
}

export async function updateMyPatientDetails(input: MyPatientDetails) {
  const { error } = await supabase.rpc('update_my_patient_details', {
    p_date_of_birth: input.dateOfBirth,
    p_sex: input.sex,
    p_address: input.address,
    p_allergies: input.allergies,
    p_medical_history: input.medicalHistory,
    p_emergency_contact_name: input.emergencyContactName,
    p_emergency_contact_number: input.emergencyContactNumber,
  })
  if (error) throw new Error(error.message)
}

export async function updateProfileDetails(fullName: string, contactNumber: string) {
  const { error } = await supabase.rpc('update_my_profile', {
    p_full_name: fullName.trim(),
    p_contact_number: contactNumber.trim() || null,
  })
  if (error) throw new Error(error.message)
}

export async function requestEmailChange(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Enter an email address.')
  const { error } = await supabase.auth.updateUser({ email: normalizedEmail })
  if (error) throw new Error(error.message)
}

export async function changePassword(password: string) {
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

const avatarUrlCache = new Map<string, string>()

export async function getAvatarUrl(path: string | null) {
  if (!path) return null
  const cached = avatarUrlCache.get(path)
  if (cached) return cached
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600)
  if (error) throw new Error(error.message)
  avatarUrlCache.set(path, data.signedUrl)
  return data.signedUrl
}

export async function memberAvatarPaths(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))]
  const paths = new Map<string, string>()
  if (!ids.length) return paths
  const { data, error } = await supabase.rpc('member_avatar_paths', { user_ids: ids })
  if (error) return paths
  for (const row of data) {
    if (row.avatar_path) paths.set(row.user_id, row.avatar_path)
  }
  return paths
}

export async function uploadAvatar(userId: string, file: File, previousPath: string | null) {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.')
  }
  if (file.size < 1 || file.size > MAX_AVATAR_BYTES) {
    throw new Error('Profile pictures must be smaller than 2 MB.')
  }

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new Error(uploadError.message)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', userId)
  if (profileError) {
    const { error: cleanupError } = await supabase.storage.from(AVATAR_BUCKET).remove([path])
    if (cleanupError) {
      throw new Error(`${profileError.message} The new image could not be cleaned up: ${cleanupError.message}`)
    }
    throw new Error(profileError.message)
  }

  let cleanupWarning: string | null = null
  if (previousPath) {
    const { error: cleanupError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath])
    if (cleanupError) {
      cleanupWarning = `Picture saved, but the previous image could not be removed: ${cleanupError.message}`
    }
  }

  return { path, cleanupWarning }
}
