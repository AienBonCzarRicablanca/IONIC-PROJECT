import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type AppointmentStatus = Database['public']['Enums']['appointment_status']

export type AppointmentRow = {
  id: string
  patient_id: string
  dentist_id: string
  service_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  patients: { full_name: string; profile_id: string | null } | null
  services: { name: string; duration_minutes: number } | null
  dentists: { profile_id: string; profiles: { full_name: string } | null } | null
}

export type AppointmentInput = {
  patient_id: string
  dentist_id: string
  service_id: string
  starts_at: string
  ends_at: string
  reason: string | null
  notes: string | null
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'medium',
  no_show: 'danger',
}

const SELECT =
  'id, patient_id, dentist_id, service_id, starts_at, ends_at, status, reason, notes, patients(full_name, profile_id), services(name, duration_minutes), dentists(profile_id, profiles(full_name))'

function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === '23P01') {
    return new Error(
      'This time slot conflicts with another appointment for the same dentist or patient.',
    )
  }
  if (error.code === '23514') return new Error('The end time must be after the start time.')
  return new Error(error.message)
}

export async function listAppointments(
  clinicId: string,
  fromIso: string,
  toIso: string,
  dentistId?: string,
) {
  let query = supabase
    .from('appointments')
    .select(SELECT)
    .eq('clinic_id', clinicId)
    .gte('starts_at', fromIso)
    .lt('starts_at', toIso)
  if (dentistId) query = query.eq('dentist_id', dentistId)
  const { data, error } = await query.order('starts_at')
  if (error) throw new Error(error.message)
  return data as unknown as AppointmentRow[]
}

export async function listBookingOptions(clinicId: string) {
  const [patients, dentists, services] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).order('full_name').limit(500),
    supabase
      .from('dentists')
      .select('id, profile_id, profiles(full_name)')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
    supabase
      .from('services')
      .select('id, name, duration_minutes')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name'),
  ])
  if (patients.error) throw new Error(patients.error.message)
  if (dentists.error) throw new Error(dentists.error.message)
  if (services.error) throw new Error(services.error.message)
  return {
    patients: patients.data,
    dentists: (dentists.data as unknown as { id: string; profile_id: string; profiles: { full_name: string } | null }[]).map(
      (dentist) => ({
        id: dentist.id,
        name: dentist.profiles?.full_name || 'Dentist',
        profileId: dentist.profile_id,
      }),
    ),
    services: services.data,
  }
}

export async function createAppointment(
  clinicId: string,
  createdBy: string,
  input: AppointmentInput,
) {
  const { error } = await supabase
    .from('appointments')
    .insert({ ...input, clinic_id: clinicId, created_by: createdBy, status: 'confirmed' })
  if (error) throw friendlyError(error)
}

export async function updateAppointment(clinicId: string, id: string, input: AppointmentInput) {
  const { error } = await supabase
    .from('appointments')
    .update(input)
    .eq('clinic_id', clinicId)
    .eq('id', id)
  if (error) throw friendlyError(error)
}

export async function setAppointmentStatus(
  clinicId: string,
  id: string,
  status: AppointmentStatus,
) {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('clinic_id', clinicId)
    .eq('id', id)
  if (error) throw friendlyError(error)
}

export async function findSchedulingConflict(
  clinicId: string,
  input: Pick<AppointmentInput, 'patient_id' | 'dentist_id' | 'starts_at' | 'ends_at'>,
  ignoreId?: string,
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_id, dentist_id')
    .eq('clinic_id', clinicId)
    .in('status', ['pending', 'confirmed', 'completed'])
    .lt('starts_at', input.ends_at)
    .gt('ends_at', input.starts_at)
  if (error) throw new Error(error.message)
  const overlap = (data ?? []).find(
    (row) =>
      row.id !== ignoreId &&
      (row.dentist_id === input.dentist_id || row.patient_id === input.patient_id),
  )
  if (!overlap) return ''
  if (overlap.dentist_id === input.dentist_id) {
    return 'This dentist already has an appointment at that time.'
  }
  if (overlap.patient_id === input.patient_id) {
    return 'This patient already has an appointment at that time.'
  }
  return 'This time slot conflicts with another appointment.'
}

export type StatusHistoryEntry = {
  id: string
  old_status: AppointmentStatus | null
  new_status: AppointmentStatus
  changed_at: string
}

export async function listStatusHistory(clinicId: string, appointmentId: string) {
  const { data, error } = await supabase
    .from('appointment_status_history')
    .select('id, old_status, new_status, changed_at')
    .eq('clinic_id', clinicId)
    .eq('appointment_id', appointmentId)
    .order('changed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as StatusHistoryEntry[]
}
