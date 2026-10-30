import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type QueueStatus = Database['public']['Enums']['queue_status']

export type QueueRow = {
  id: string
  appointment_id: string
  queue_number: number
  status: QueueStatus
  added_at: string
  appointments: {
    starts_at: string
    status: string
    patients: { full_name: string; profile_id: string | null } | null
    services: { name: string } | null
    dentists: { profile_id: string; profiles: { full_name: string } | null } | null
  } | null
}

export type CheckInCandidate = {
  id: string
  starts_at: string
  patients: { full_name: string; profile_id: string | null } | null
  services: { name: string } | null
}

const QUEUE_SELECT =
  'id, appointment_id, queue_number, status, added_at, appointments(starts_at, status, patients(full_name, profile_id), services(name), dentists(profile_id, profiles(full_name)))'

export async function listQueue(clinicId: string, fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from('queues')
    .select(QUEUE_SELECT)
    .eq('clinic_id', clinicId)
    .gte('added_at', fromIso)
    .lt('added_at', toIso)
    .order('queue_number')
  if (error) throw new Error(error.message)
  return data as unknown as QueueRow[]
}

export async function listCheckInCandidates(
  clinicId: string,
  fromIso: string,
  toIso: string,
  queuedAppointmentIds: string[],
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, patients(full_name, profile_id), services(name)')
    .eq('clinic_id', clinicId)
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', fromIso)
    .lt('starts_at', toIso)
    .order('starts_at')
  if (error) throw new Error(error.message)
  const queued = new Set(queuedAppointmentIds)
  return (data as unknown as CheckInCandidate[]).filter((appt) => !queued.has(appt.id))
}

// queue_number is unique per clinic, so retry when two staff check in at once.
export async function checkInAppointment(clinicId: string, appointmentId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: last, error: lastError } = await supabase
      .from('queues')
      .select('queue_number')
      .eq('clinic_id', clinicId)
      .order('queue_number', { ascending: false })
      .limit(1)
    if (lastError) throw new Error(lastError.message)

    const { error } = await supabase.from('queues').insert({
      clinic_id: clinicId,
      appointment_id: appointmentId,
      queue_number: (last[0]?.queue_number ?? 0) + 1,
    })
    if (!error) return
    if (error.code === '23505' && error.message.includes('appointment_id')) {
      throw new Error('This appointment is already in the queue.')
    }
    if (error.code !== '23505') throw new Error(error.message)
  }
  throw new Error('Could not assign a queue number. Please try again.')
}

export async function setQueueStatus(clinicId: string, entry: QueueRow, status: QueueStatus) {
  const { error } = await supabase
    .from('queues')
    .update({ status })
    .eq('clinic_id', clinicId)
    .eq('id', entry.id)
  if (error) throw new Error(error.message)

  if (status === 'done') {
    const { error: apptError } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .eq('clinic_id', clinicId)
      .eq('id', entry.appointment_id)
    if (apptError) throw new Error(apptError.message)
  }
}

export async function removeFromQueue(clinicId: string, id: string) {
  const { error } = await supabase.from('queues').delete().eq('clinic_id', clinicId).eq('id', id)
  if (error) throw new Error(error.message)
}
