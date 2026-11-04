import { supabase } from './supabase'

export type MyPatient = { id: string; clinic_id: string; full_name: string }

export type MyAppointment = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  reason: string | null
  services: { name: string } | null
}

export type PortalService = { id: string; name: string; duration_minutes: number; price: number }
export type PortalDentist = { id: string; full_name: string; specialization: string | null }
export type BusySlot = { starts_at: string; ends_at: string }

export type MyInvoice = {
  id: string
  invoice_number: string
  status: string
  total: number | null
  issued_at: string | null
  due_at: string | null
  payments: {
    id: string
    amount: number
    method: string
    is_confirmed: boolean
    reference_number: string | null
    created_at: string
  }[]
  payment_installments: { id: string; due_at: string; amount: number; paid_at: string | null }[]
}

export type MyNotification = {
  id: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

function fail(error: { message: string }): never {
  throw new Error(error.message)
}

export async function getMyPatient(userId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, clinic_id, full_name')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) fail(error)
  return data as MyPatient | null
}

export async function listMyAppointments(patientId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, starts_at, ends_at, status, reason, services(name)')
    .eq('patient_id', patientId)
    .order('starts_at', { ascending: false })
    .limit(50)
  if (error) fail(error)
  return data as unknown as MyAppointment[]
}

export async function listServices(clinicId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('name')
  if (error) fail(error)
  return data as PortalService[]
}

export async function listDentists() {
  const { data, error } = await supabase.rpc('list_bookable_dentists')
  if (error) fail(error)
  return data as PortalDentist[]
}

export type PublicDentist = {
  id: string
  fullName: string
  specialization: string | null
  avatarPath: string | null
}

export async function listPublicDentists() {
  const { data, error } = await supabase.rpc('list_public_dentists')
  if (error || !data) return [] as PublicDentist[]
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    specialization: row.specialization,
    avatarPath: row.avatar_path,
  }))
}

export async function getBusySlots(dentistId: string, fromIso: string, toIso: string) {
  const { data, error } = await supabase.rpc('dentist_busy_slots', {
    p_dentist: dentistId,
    p_from: fromIso,
    p_to: toIso,
  })
  if (error) fail(error)
  return data as BusySlot[]
}

export async function requestAppointment(
  patient: MyPatient,
  input: { dentistId: string; service: PortalService; start: Date; reason: string },
) {
  const end = new Date(input.start.getTime() + input.service.duration_minutes * 60000)
  const { error } = await supabase.from('appointments').insert({
    clinic_id: patient.clinic_id,
    patient_id: patient.id,
    dentist_id: input.dentistId,
    service_id: input.service.id,
    starts_at: input.start.toISOString(),
    ends_at: end.toISOString(),
    status: 'pending',
    reason: input.reason.trim() || null,
  })
  if (error) {
    if (error.code === '23P01') {
      throw new Error('That time is no longer available. Please choose another slot.')
    }
    fail(error)
  }
}

export async function cancelMyAppointment(id: string) {
  const { error } = await supabase.rpc('cancel_my_appointment', { p_appointment: id })
  if (error) fail(error)
}

export async function listMyInvoices(patientId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, status, total, issued_at, due_at, payments(id, amount, method, is_confirmed, reference_number, created_at), payment_installments(id, due_at, amount, paid_at)',
    )
    .eq('patient_id', patientId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return data as unknown as MyInvoice[]
}

export function invoiceBalance(invoice: MyInvoice) {
  if (invoice.status === 'void') return 0
  const paid = invoice.payments.filter((p) => p.is_confirmed).reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, (invoice.total ?? 0) - paid)
}

export async function simulateMyPayment(
  invoiceId: string,
  amount: number,
  method: 'gcash' | 'card' | 'bank_transfer',
  reference: string,
) {
  const { error } = await supabase.rpc('simulate_my_payment', {
    p_invoice: invoiceId,
    p_amount: amount,
    p_method: method,
    p_reference: reference,
  })
  if (error) fail(error)
}

export async function countUnreadNotifications(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) return 0
  return count ?? 0
}

export async function listMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) fail(error)
  return data as MyNotification[]
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) fail(error)
}
