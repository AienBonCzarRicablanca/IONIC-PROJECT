import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'installment', label: 'Installment' },
  { value: 'other', label: 'Other' },
]

export const INVOICE_COLORS: Record<InvoiceStatus, string> = {
  draft: 'medium',
  issued: 'warning',
  partially_paid: 'tertiary',
  paid: 'success',
  void: 'danger',
}

export type InvoiceListRow = {
  id: string
  invoice_number: string
  status: InvoiceStatus
  total: number | null
  created_at: string
  patients: { full_name: string; profile_id: string | null } | null
}

export type InvoiceDetail = {
  id: string
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  discount: number
  total: number | null
  created_at: string
  issued_at: string | null
  patients: { full_name: string; contact_number: string | null } | null
  invoice_items: {
    id: string
    description: string
    quantity: number
    unit_price: number
    line_total: number | null
  }[]
  payments: {
    id: string
    amount: number
    method: PaymentMethod
    reference_number: string | null
    created_at: string
    is_confirmed: boolean
  }[]
  payment_installments: {
    id: string
    due_at: string
    amount: number
    paid_at: string | null
  }[]
}

export type ItemInput = {
  description: string
  quantity: number
  unit_price: number
  service_id: string | null
}

function fail(error: { message: string }): never {
  throw new Error(error.message)
}

function newInvoiceNumber() {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `INV-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`
}

export async function listInvoices(clinicId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total, created_at, patients(full_name, profile_id)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) fail(error)
  return data as unknown as InvoiceListRow[]
}

export async function getInvoice(clinicId: string, id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, status, subtotal, discount, total, created_at, issued_at, patients(full_name, contact_number), invoice_items(id, description, quantity, unit_price, line_total), payments(id, amount, method, reference_number, created_at, is_confirmed), payment_installments(id, due_at, amount, paid_at)',
    )
    .eq('clinic_id', clinicId)
    .eq('id', id)
    .single()
  if (error) fail(error)
  return data as unknown as InvoiceDetail
}

export async function listBillingOptions(clinicId: string) {
  const [patients, services] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).order('full_name').limit(500),
    supabase
      .from('services')
      .select('id, name, price')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name'),
  ])
  if (patients.error) fail(patients.error)
  if (services.error) fail(services.error)
  return { patients: patients.data, services: services.data }
}

export async function createInvoice(clinicId: string, createdBy: string, patientId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        created_by: createdBy,
        invoice_number: newInvoiceNumber(),
        status: 'draft',
      })
      .select('id')
      .single()
    if (!error) return data.id
    if (error.code !== '23505') fail(error)
  }
  throw new Error('Could not generate a unique invoice number. Please try again.')
}

export async function addInvoiceItem(clinicId: string, invoiceId: string, item: ItemInput) {
  const { error } = await supabase
    .from('invoice_items')
    .insert({ ...item, clinic_id: clinicId, invoice_id: invoiceId })
  if (error) fail(error)
}

export async function removeInvoiceItem(clinicId: string, id: string) {
  const { error } = await supabase.from('invoice_items').delete().eq('clinic_id', clinicId).eq('id', id)
  if (error) fail(error)
}

export async function setInvoiceDiscount(clinicId: string, id: string, discount: number) {
  const { error } = await supabase.from('invoices').update({ discount }).eq('clinic_id', clinicId).eq('id', id)
  if (error) fail(error)
}

export async function setInvoiceStatus(clinicId: string, id: string, status: 'issued' | 'void') {
  const { error } = await supabase
    .from('invoices')
    .update(status === 'issued' ? { status, issued_at: new Date().toISOString() } : { status })
    .eq('clinic_id', clinicId)
    .eq('id', id)
  if (error) fail(error)
}

export async function addInstallment(
  clinicId: string,
  invoiceId: string,
  dueAt: string,
  amount: number,
) {
  const { error } = await supabase.from('payment_installments').insert({
    clinic_id: clinicId,
    invoice_id: invoiceId,
    due_at: dueAt,
    amount,
  })
  if (error) fail(error)
}

export async function removeInstallment(clinicId: string, id: string) {
  const { error } = await supabase
    .from('payment_installments')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('id', id)
    .is('paid_at', null)
  if (error) fail(error)
}

async function settleInstallments(clinicId: string, invoiceId: string, amount: number) {
  const { data, error } = await supabase
    .from('payment_installments')
    .select('id, amount')
    .eq('clinic_id', clinicId)
    .eq('invoice_id', invoiceId)
    .is('paid_at', null)
    .order('due_at')
  if (error) fail(error)
  let remaining = amount
  const paidAt = new Date().toISOString()
  for (const row of data ?? []) {
    if (remaining + 0.009 < Number(row.amount)) break
    const update = await supabase
      .from('payment_installments')
      .update({ paid_at: paidAt })
      .eq('clinic_id', clinicId)
      .eq('id', row.id)
      .is('paid_at', null)
    if (update.error) fail(update.error)
    remaining -= Number(row.amount)
  }
}

export async function recordPayment(
  clinicId: string,
  invoiceId: string,
  receivedBy: string,
  amount: number,
  method: PaymentMethod,
  reference: string | null,
) {
  const { error } = await supabase.from('payments').insert({
    clinic_id: clinicId,
    invoice_id: invoiceId,
    received_by: receivedBy,
    amount,
    method,
    reference_number: reference,
    is_confirmed: true,
  })
  if (error) fail(error)
  await settleInstallments(clinicId, invoiceId, amount)
}
