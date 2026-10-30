import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type PatientFile = Database['public']['Tables']['patient_files']['Row']

const BUCKET = 'patient-files'
export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP or PDF files are allowed.'
  if (file.size < 1) return 'The file is empty.'
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 20 MB.'
  return null
}

export async function listFiles(patientId: string) {
  const { data, error } = await supabase
    .from('patient_files')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function uploadFile(clinicId: string, patientId: string, userId: string, file: File) {
  const invalid = validateFile(file)
  if (invalid) throw new Error(invalid)

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
  const path = `${patientId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new Error(uploadError.message)

  const { error } = await supabase.from('patient_files').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    storage_path: path,
    original_name: file.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userId,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw new Error(error.message)
  }
}

// Files are private; access is through short-lived signed URLs only.
export async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 120)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
