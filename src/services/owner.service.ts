import { supabase } from './supabase'
import type { Database } from '../types/database.types'

export type AppointmentStatus = Database['public']['Enums']['appointment_status']

export type OwnerDashboardSummary = {
  totalPatients: number
  activeStaff: number
  todayAppointments: number
  pendingAppointments: number
  openInvoices: number
  outstandingBalance: number
  lowStockCount: number
  revenueThisMonth: number
}

export type RevenuePoint = {
  month: string
  revenue: number
}

export type ServicePopularity = {
  name: string
  appointments: number
}

export type DentistStatistic = {
  id: string
  name: string
  appointments: number
  completedAppointments: number
  noShowAppointments: number
}

export type AppointmentOutcome = {
  status: AppointmentStatus
  count: number
}

export type OwnerOperationalAnalytics = {
  servicePopularity: ServicePopularity[]
  dentistStatistics: DentistStatistic[]
  appointmentOutcomes: AppointmentOutcome[]
}

export type AuditLogRow = {
  id: number
  action: string
  entity_table: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  profiles: { full_name: string | null } | null
}

function fail(error: { message: string }): never {
  throw new Error(error.message)
}

function clinicDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => item.type === type)?.value
    if (!part) throw new Error(`Could not determine ${type} in clinic timezone ${timeZone}.`)
    return Number(part)
  }
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  }
}

function clinicLocalMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const targetWallTime = Date.UTC(year, month - 1, day)
  let timestamp = targetWallTime

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = clinicDateParts(new Date(timestamp), timeZone)
    const representedWallTime = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    )
    const adjustment = targetWallTime - representedWallTime
    timestamp += adjustment
    if (adjustment === 0) break
  }

  return new Date(timestamp)
}

function clinicMonthStart(date: Date, timeZone: string, monthsBack = 0): Date {
  const local = clinicDateParts(date, timeZone)
  const month = new Date(Date.UTC(local.year, local.month - 1 - monthsBack, 1))
  return clinicLocalMidnight(
    month.getUTCFullYear(),
    month.getUTCMonth() + 1,
    1,
    timeZone,
  )
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

async function getClinicTimeZone(clinicId: string): Promise<string> {
  const { data, error } = await supabase
    .from('clinics')
    .select('timezone')
    .eq('id', clinicId)
    .single()
  if (error) fail(error)
  return data.timezone
}

export async function getOwnerDashboard(clinicId: string): Promise<OwnerDashboardSummary> {
  const timeZone = await getClinicTimeZone(clinicId)
  const now = new Date()
  const today = clinicDateParts(now, timeZone)
  const start = clinicLocalMidnight(today.year, today.month, today.day, timeZone)
  const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1))
  const end = clinicLocalMidnight(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth() + 1,
    tomorrow.getUTCDate(),
    timeZone,
  )
  const monthStart = clinicMonthStart(now, timeZone)

  const [patients, staff, appointments, invoices, inventory, revenue] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact' }).eq('clinic_id', clinicId),
    supabase
      .from('clinic_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .in('role', ['superadmin', 'admin', 'dentist']),
    supabase.from('appointments').select('id, status').eq('clinic_id', clinicId).gte('starts_at', start.toISOString()).lt('starts_at', end.toISOString()),
    supabase.from('invoices').select('id, total, payments(amount, is_confirmed)').eq('clinic_id', clinicId).in('status', ['issued', 'partially_paid']),
    supabase.from('inventory_items').select('id, quantity, reorder_threshold').eq('clinic_id', clinicId).eq('is_archived', false),
    supabase.from('payments').select('amount, created_at, invoices!inner(clinic_id)').eq('invoices.clinic_id', clinicId).eq('is_confirmed', true).gte('created_at', monthStart.toISOString()),
  ])

  if (patients.error) fail(patients.error)
  if (staff.error) fail(staff.error)
  if (appointments.error) fail(appointments.error)
  if (invoices.error) fail(invoices.error)
  if (inventory.error) fail(inventory.error)
  if (revenue.error) fail(revenue.error)

  const open = invoices.data as unknown as {
    total: number | null
    payments: { amount: number; is_confirmed: boolean }[]
  }[]
  const outstandingBalance = open.reduce((sum, invoice) => {
    const paid = invoice.payments.filter((p) => p.is_confirmed).reduce((acc, p) => acc + p.amount, 0)
    return sum + Math.max(0, (invoice.total ?? 0) - paid)
  }, 0)

  const revenueThisMonth = (revenue.data as unknown as { amount: number }[]).reduce((sum, row) => sum + (row.amount ?? 0), 0)

  return {
    totalPatients: patients.count ?? 0,
    activeStaff: staff.count ?? 0,
    todayAppointments: appointments.data.filter((item) => item.status !== 'cancelled' && item.status !== 'no_show').length,
    pendingAppointments: appointments.data.filter((item) => item.status === 'pending').length,
    openInvoices: open.length,
    outstandingBalance,
    lowStockCount: inventory.data.filter((item) => item.quantity <= item.reorder_threshold).length,
    revenueThisMonth,
  }
}

export async function getRevenueAnalytics(clinicId: string): Promise<RevenuePoint[]> {
  const timeZone = await getClinicTimeZone(clinicId)
  const now = new Date()
  const start = clinicMonthStart(now, timeZone, 5)

  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at, invoices!inner(clinic_id)')
    .eq('invoices.clinic_id', clinicId)
    .eq('is_confirmed', true)
    .gte('created_at', start.toISOString())
    .lt('created_at', now.toISOString())
    .order('created_at', { ascending: true })

  if (error) fail(error)

  const buckets = new Map<string, number>()
  const firstMonth = clinicDateParts(start, timeZone)
  for (let i = 0; i < 6; i += 1) {
    const month = new Date(Date.UTC(firstMonth.year, firstMonth.month - 1 + i, 15))
    const key = monthKey(month.getUTCFullYear(), month.getUTCMonth() + 1)
    buckets.set(key, 0)
  }

  const rows = data as unknown as { amount: number; created_at: string }[]
  rows.forEach((row) => {
    const date = clinicDateParts(new Date(row.created_at), timeZone)
    const key = monthKey(date.year, date.month)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (row.amount ?? 0))
  })

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const [year, month] = key.split('-').map(Number)
    return { month: monthLabel(year, month), revenue }
  })
}

export async function getOwnerOperationalAnalytics(
  clinicId: string,
): Promise<OwnerOperationalAnalytics> {
  const timeZone = await getClinicTimeZone(clinicId)
  const end = new Date()
  const start = clinicMonthStart(end, timeZone, 5)

  const { data, error } = await supabase
    .from('appointments')
    .select('status, service_id, dentist_id, services(name), dentists(profiles(full_name))')
    .eq('clinic_id', clinicId)
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at', { ascending: true })

  if (error) fail(error)

  const rows = data as unknown as {
    status: AppointmentStatus
    service_id: string
    dentist_id: string
    services: { name: string } | null
    dentists: { profiles: { full_name: string } | null } | null
  }[]
  const outcomes = new Map<AppointmentStatus, number>([
    ['pending', 0],
    ['confirmed', 0],
    ['completed', 0],
    ['cancelled', 0],
    ['no_show', 0],
  ])
  const services = new Map<string, ServicePopularity>()
  const dentists = new Map<string, DentistStatistic>()

  for (const row of rows) {
    outcomes.set(row.status, (outcomes.get(row.status) ?? 0) + 1)

    const dentist = dentists.get(row.dentist_id) ?? {
      id: row.dentist_id,
      name: row.dentists?.profiles?.full_name || 'Dentist',
      appointments: 0,
      completedAppointments: 0,
      noShowAppointments: 0,
    }
    dentist.appointments += 1
    if (row.status === 'completed') dentist.completedAppointments += 1
    if (row.status === 'no_show') dentist.noShowAppointments += 1
    dentists.set(row.dentist_id, dentist)

    if (row.status === 'cancelled' || row.status === 'no_show') continue
    const service = services.get(row.service_id) ?? {
      name: row.services?.name || 'Service',
      appointments: 0,
    }
    service.appointments += 1
    services.set(row.service_id, service)
  }

  return {
    servicePopularity: Array.from(services.values()).sort((a, b) => b.appointments - a.appointments),
    dentistStatistics: Array.from(dentists.values()).sort((a, b) => b.appointments - a.appointments),
    appointmentOutcomes: Array.from(outcomes, ([status, count]) => ({ status, count })),
  }
}

export async function listAuditLogs(clinicId: string, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_table, entity_id, metadata, created_at, profiles(full_name)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) fail(error)
  return data as unknown as AuditLogRow[]
}
