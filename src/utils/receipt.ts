import type { InvoiceDetail } from '../services/billing.service'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const peso = (value: number | null) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value ?? 0)

export function buildReceiptHtml(invoice: InvoiceDetail, clinicName: string) {
  const paid = invoice.payments
    .filter((payment) => payment.is_confirmed)
    .reduce((sum, payment) => sum + payment.amount, 0)
  const total = invoice.total ?? 0

  const items = invoice.invoice_items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td class="n">${item.quantity}</td><td class="n">${peso(item.unit_price)}</td><td class="n">${peso(item.line_total)}</td></tr>`,
    )
    .join('')
  const payments = invoice.payments
    .filter((payment) => payment.is_confirmed)
    .map(
      (payment) =>
        `<tr><td>${new Date(payment.created_at).toLocaleDateString()}</td><td>${escapeHtml(payment.method.replace('_', ' '))}${payment.reference_number ? ` (${escapeHtml(payment.reference_number)})` : ''}</td><td class="n">${peso(payment.amount)}</td></tr>`,
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(invoice.invoice_number)}</title>
<style>body{font-family:Arial,sans-serif;margin:2rem;color:#111}h1{margin:0}table{border-collapse:collapse;margin:1rem 0;width:100%}th,td{border-bottom:1px solid #ccc;padding:.4rem;text-align:left}.n{text-align:right}.sum{margin-left:auto;width:16rem}</style></head><body>
<h1>${escapeHtml(clinicName)}</h1>
<p>Receipt / Invoice <strong>${escapeHtml(invoice.invoice_number)}</strong><br>Date: ${new Date(invoice.issued_at ?? invoice.created_at).toLocaleDateString()}<br>Patient: ${escapeHtml(invoice.patients?.full_name ?? '')}</p>
<table><thead><tr><th>Description</th><th class="n">Qty</th><th class="n">Price</th><th class="n">Amount</th></tr></thead><tbody>${items}</tbody></table>
<table class="sum"><tr><td>Subtotal</td><td class="n">${peso(invoice.subtotal)}</td></tr><tr><td>Discount</td><td class="n">${peso(invoice.discount)}</td></tr><tr><td><strong>Total</strong></td><td class="n"><strong>${peso(total)}</strong></td></tr><tr><td>Paid</td><td class="n">${peso(paid)}</td></tr><tr><td><strong>Balance</strong></td><td class="n"><strong>${peso(total - paid)}</strong></td></tr></table>
${payments ? `<h3>Payments</h3><table><tbody>${payments}</tbody></table>` : ''}
${
  invoice.payment_installments.length
    ? `<h3>Installments</h3><table><tbody>${invoice.payment_installments
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.due_at)}</td><td>${item.paid_at ? 'Paid' : 'Unpaid'}</td><td class="n">${peso(item.amount)}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : ''
}
<p>Status: ${escapeHtml(invoice.status.replace('_', ' '))}</p>
<script>window.onload=function(){window.print()}</script></body></html>`
}

export function printReceipt(invoice: InvoiceDetail, clinicName: string) {
  const win = window.open('', '_blank')
  if (!win) throw new Error('Allow pop-ups for this site to print the receipt.')
  win.document.write(buildReceiptHtml(invoice, clinicName))
  win.document.close()
}
