import { supabase } from './supabase'

export type DashboardSummary = {
  todayAppointments: number
  pendingAppointments: number
  waitingInQueue: number
  inSession: number
  unpaidInvoices: number
  outstandingBalance: number
  lowStockItems: string[]
  upcoming: {
    id: string
    starts_at: string
    status: string
    patients: { full_name: string; profile_id: string | null } | null
    services: { name: string } | null
  }[]
}

function fail(error: { message: string }): never {
  throw new Error(error.message)
}

export async function getDashboardSummary(clinicId: string): Promise<DashboardSummary> {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)

  const [appointments, queue, invoices, inventory] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, starts_at, status, patients(full_name, profile_id), services(name)')
      .eq('clinic_id', clinicId)
      .gte('starts_at', from.toISOString())
      .lt('starts_at', to.toISOString())
      .order('starts_at'),
    supabase
      .from('queues')
      .select('status')
      .eq('clinic_id', clinicId)
      .gte('added_at', from.toISOString())
      .lt('added_at', to.toISOString()),
    supabase
      .from('invoices')
      .select('total, payments(amount, is_confirmed)')
      .eq('clinic_id', clinicId)
      .in('status', ['issued', 'partially_paid']),
    supabase
      .from('inventory_items')
      .select('name, quantity, reorder_threshold')
      .eq('clinic_id', clinicId)
      .eq('is_archived', false),
  ])

  if (appointments.error) fail(appointments.error)
  if (queue.error) fail(queue.error)
  if (invoices.error) fail(invoices.error)
  if (inventory.error) fail(inventory.error)

  const todays = appointments.data as unknown as DashboardSummary['upcoming']
  const open = invoices.data as unknown as {
    total: number | null
    payments: { amount: number; is_confirmed: boolean }[]
  }[]

  const outstandingBalance = open.reduce((sum, invoice) => {
    const paid = invoice.payments
      .filter((payment) => payment.is_confirmed)
      .reduce((acc, payment) => acc + payment.amount, 0)
    return sum + Math.max(0, (invoice.total ?? 0) - paid)
  }, 0)

  return {
    todayAppointments: todays.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show').length,
    pendingAppointments: todays.filter((a) => a.status === 'pending').length,
    waitingInQueue: queue.data.filter((q) => q.status === 'waiting').length,
    inSession: queue.data.filter((q) => q.status === 'in_session').length,
    unpaidInvoices: open.length,
    outstandingBalance,
    lowStockItems: inventory.data.filter((i) => i.quantity <= i.reorder_threshold).map((i) => i.name),
    upcoming: todays.filter((a) => a.status === 'pending' || a.status === 'confirmed').slice(0, 6),
  }
}
