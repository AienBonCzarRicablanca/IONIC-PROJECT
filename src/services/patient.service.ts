import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type Patient = Database['public']['Tables']['patients']['Row']
export type PatientInput = {
  full_name: string
  date_of_birth: string | null
  contact_number: string | null
  email: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_number: string | null
  medical_history: string | null
  allergies: string | null
  sex: string | null
}

const PAGE_SIZE = 25

export async function listPatients(clinicId: string, search: string, page: number) {
  const start = page * PAGE_SIZE
  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('clinic_id', clinicId)
    .order('full_name')
    .range(start, start + PAGE_SIZE - 1)

  const term = search.trim().replace(/[\\%_]/g, '')
  if (term) query = query.ilike('full_name', `%${term}%`)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { patients: data, count: count ?? 0 }
}

async function ensureNoDuplicate(clinicId: string, input: PatientInput, excludeId?: string) {
  const email = input.email?.trim()
  if (email) {
    let emailQuery = supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinicId)
      .ilike('email', email)
      .limit(1)
    if (excludeId) emailQuery = emailQuery.neq('id', excludeId)

    const { data, error } = await emailQuery
    if (error) throw new Error(error.message)
    if (data.length) throw new Error('A patient with this email address already exists.')
  }

  let nameQuery = supabase
    .from('patients')
    .select('id')
    .eq('clinic_id', clinicId)
    .ilike('full_name', input.full_name.trim())

  nameQuery = input.date_of_birth
    ? nameQuery.eq('date_of_birth', input.date_of_birth)
    : nameQuery.is('date_of_birth', null)

  nameQuery = nameQuery.limit(1)
  if (excludeId) nameQuery = nameQuery.neq('id', excludeId)

  const { data, error } = await nameQuery
  if (error) throw new Error(error.message)
  if (data.length) throw new Error('A patient with the same name and date of birth already exists.')
}

export async function createPatient(
  clinicId: string,
  createdBy: string,
  input: PatientInput,
): Promise<Patient> {
  await ensureNoDuplicate(clinicId, input)
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...input, clinic_id: clinicId, created_by: createdBy })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updatePatient(
  clinicId: string,
  patientId: string,
  input: PatientInput,
): Promise<Patient> {
  await ensureNoDuplicate(clinicId, input, patientId)
  const { data, error } = await supabase
    .from('patients')
    .update(input)
    .eq('clinic_id', clinicId)
    .eq('id', patientId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getPatientHistory(clinicId: string, patientId: string) {
  const [appointments, records] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, status, reason')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('starts_at', { ascending: false })
      .limit(10),
    supabase
      .from('dental_records')
      .select('id, recorded_at, diagnosis, procedures_performed')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(10),
  ])

  if (appointments.error) throw new Error(appointments.error.message)
  if (records.error) throw new Error(records.error.message)
  return { appointments: appointments.data, records: records.data }
}
