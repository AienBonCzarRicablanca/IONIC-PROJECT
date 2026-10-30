import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type DentalCondition = Database['public']['Enums']['dental_condition']
export type TreatmentStatus = Database['public']['Enums']['treatment_status']
export type OdontogramEntry = Database['public']['Tables']['odontogram_entries']['Row']
export type DentalRecord = Database['public']['Tables']['dental_records']['Row']
export type ClinicalNote = Database['public']['Tables']['clinical_notes']['Row']
export type PlanItem = Database['public']['Tables']['treatment_plan_items']['Row']
export type TreatmentPlan = Database['public']['Tables']['treatment_plans']['Row'] & {
  treatment_plan_items: PlanItem[]
}

export type RecordInput = {
  diagnosis: string
  procedures_performed: string
  observations: string
  recommendations: string
  follow_up_instructions: string
}

export type PlanItemInput = {
  description: string
  tooth_number: number | null
  cost: number
}

function fail(error: { message: string }): never {
  throw new Error(error.message)
}

const clean = (value: string) => (value.trim() === '' ? null : value.trim())

export async function getMyDentistId(clinicId: string, profileId: string) {
  const { data, error } = await supabase
    .from('dentists')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('profile_id', profileId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) fail(error)
  return data?.id ?? null
}

export async function listAssignedPatients(clinicId: string, search: string) {
  let query = supabase
    .from('patients')
    .select('id, full_name, email, contact_number, date_of_birth, profile_id')
    .eq('clinic_id', clinicId)
    .order('full_name')
    .limit(100)
  const term = search.trim().replace(/[%,()]/g, '')
  if (term) query = query.ilike('full_name', `%${term}%`)
  const { data, error } = await query
  if (error) fail(error)
  return data
}

export async function getPatient(clinicId: string, patientId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select(
      'id, full_name, email, contact_number, date_of_birth, sex, address, emergency_contact_name, emergency_contact_number, allergies, medical_history',
    )
    .eq('clinic_id', clinicId)
    .eq('id', patientId)
    .maybeSingle()
  if (error) fail(error)
  return data
}

export async function listOdontogram(patientId: string) {
  const { data, error } = await supabase
    .from('odontogram_entries')
    .select('*')
    .eq('patient_id', patientId)
  if (error) fail(error)
  return data
}

export async function saveTooth(
  clinicId: string,
  patientId: string,
  recordedBy: string,
  toothNumber: number,
  condition: DentalCondition,
  notes: string,
) {
  const { error } = await supabase.from('odontogram_entries').upsert(
    {
      clinic_id: clinicId,
      patient_id: patientId,
      tooth_number: toothNumber,
      dentition: toothNumber > 32 ? 'primary' : 'adult',
      condition,
      notes: clean(notes),
      recorded_by: recordedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'patient_id,tooth_number' },
  )
  if (error) fail(error)
}

export async function listRecords(patientId: string) {
  const { data, error } = await supabase
    .from('dental_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
  if (error) fail(error)
  return data
}

export async function addRecord(
  clinicId: string,
  patientId: string,
  dentistId: string,
  input: RecordInput,
) {
  const { error } = await supabase.from('dental_records').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    dentist_id: dentistId,
    diagnosis: input.diagnosis.trim(),
    procedures_performed: clean(input.procedures_performed),
    observations: clean(input.observations),
    recommendations: clean(input.recommendations),
    follow_up_instructions: clean(input.follow_up_instructions),
  })
  if (error) fail(error)
}

export async function listNotes(patientId: string) {
  const { data, error } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data
}

export async function addNote(
  clinicId: string,
  patientId: string,
  dentistId: string,
  content: string,
  shared: boolean,
) {
  const { error } = await supabase.from('clinical_notes').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    dentist_id: dentistId,
    content: content.trim(),
    is_shared_with_patient: shared,
  })
  if (error) fail(error)
}

export async function listPlans(patientId: string) {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*, treatment_plan_items(*)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data as unknown as TreatmentPlan[]
}

export async function createPlan(
  clinicId: string,
  patientId: string,
  dentistId: string,
  title: string,
  notes: string,
) {
  const { error } = await supabase.from('treatment_plans').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    dentist_id: dentistId,
    title: title.trim(),
    notes: clean(notes),
  })
  if (error) fail(error)
}

export async function addPlanItem(clinicId: string, planId: string, input: PlanItemInput) {
  const { error } = await supabase.from('treatment_plan_items').insert({
    clinic_id: clinicId,
    plan_id: planId,
    description: input.description.trim(),
    tooth_number: input.tooth_number,
    cost: input.cost,
  })
  if (error) fail(error)
}

export async function setItemStatus(clinicId: string, itemId: string, status: TreatmentStatus) {
  const { error } = await supabase
    .from('treatment_plan_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('clinic_id', clinicId)
    .eq('id', itemId)
  if (error) fail(error)
}

export async function setPlanStatus(clinicId: string, planId: string, status: TreatmentStatus) {
  const { error } = await supabase
    .from('treatment_plans')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('clinic_id', clinicId)
    .eq('id', planId)
  if (error) fail(error)
}

export async function listMyToday(clinicId: string, dentistId: string, fromIso: string, toIso: string) {
  const [appointments, queue] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, status, patient_id, patients(full_name, profile_id), services(name)')
      .eq('clinic_id', clinicId)
      .eq('dentist_id', dentistId)
      .gte('starts_at', fromIso)
      .lt('starts_at', toIso)
      .not('status', 'in', '(cancelled,no_show)')
      .order('starts_at'),
    supabase
      .from('queues')
      .select('id, queue_number, status, appointments!inner(dentist_id, patients(full_name, profile_id))')
      .eq('clinic_id', clinicId)
      .eq('appointments.dentist_id', dentistId)
      .gte('added_at', fromIso)
      .lt('added_at', toIso)
      .in('status', ['waiting', 'in_session'])
      .order('queue_number'),
  ])
  if (appointments.error) fail(appointments.error)
  if (queue.error) fail(queue.error)
  return {
    appointments: appointments.data as unknown as {
      id: string
      starts_at: string
      status: string
      patient_id: string
      patients: { full_name: string; profile_id: string | null } | null
      services: { name: string } | null
    }[],
    queue: queue.data as unknown as {
      id: string
      queue_number: number
      status: string
      appointments: { patients: { full_name: string; profile_id: string | null } | null } | null
    }[],
  }
}
