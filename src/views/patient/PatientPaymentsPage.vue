<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Payment History</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading" class="state-message" role="status">Loading...</div>

        <template v-if="patient && !loadError">
          <ion-card color="light">
            <ion-card-content>
              <strong>Total outstanding balance: {{ peso(totalBalance) }}</strong>
            </ion-card-content>
          </ion-card>
          <p v-if="!invoices.length" class="state-message">No invoices yet.</p>
          <ion-card v-for="inv in invoices" :key="inv.id">
            <ion-card-header>
              <ion-card-title>{{ inv.invoice_number }}</ion-card-title>
              <ion-card-subtitle>
                {{ inv.status.replace('_', ' ') }} · Total {{ peso(inv.total ?? 0) }} · Balance {{ peso(invoiceBalance(inv)) }}
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div v-if="canPay(inv)" class="pay-row">
                <ion-button size="small" @click="openCheckout(inv, 'gcash')">Pay with GCash</ion-button>
                <ion-button size="small" fill="outline" @click="openCheckout(inv, 'card')">Card</ion-button>
                <ion-button size="small" fill="outline" @click="openCheckout(inv, 'bank_transfer')">Bank</ion-button>
              </div>
              <h4 v-if="confirmed(inv).length">Confirmed payments</h4>
              <ion-list v-if="confirmed(inv).length" lines="full">
                <ion-item v-for="p in confirmed(inv)" :key="p.id">
                  <ion-label>
                    <h3>{{ peso(p.amount) }}</h3>
                    <p>
                      {{ methodLabel(p.method) }} · {{ fmt.format(new Date(p.created_at)) }}
                      <span v-if="p.reference_number"> · {{ p.reference_number }}</span>
                    </p>
                  </ion-label>
                </ion-item>
              </ion-list>
              <h4 v-if="inv.payment_installments.length">Installments</h4>
              <ion-list v-if="inv.payment_installments.length" lines="full">
                <ion-item v-for="i in inv.payment_installments" :key="i.id">
                  <ion-label>
                    <h3>{{ peso(i.amount) }} due {{ i.due_at }}</h3>
                    <p>{{ i.paid_at ? 'Paid' : 'Unpaid' }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </template>
      </div>

      <PaymentCheckout
        :open="checkoutOpen"
        :invoice-number="checkoutInvoice?.invoice_number ?? ''"
        :balance="checkoutInvoice ? invoiceBalance(checkoutInvoice) : 0"
        :method="checkoutMethod"
        :pay="submitPayment"
        @close="checkoutOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent,
  IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar,
} from '@ionic/vue'
import PaymentCheckout from '../../components/billing/PaymentCheckout.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import { useMyPatient } from '../../composables/useMyPatient'
import { invoiceBalance, listMyInvoices, simulateMyPayment, type MyInvoice } from '../../services/portal.service'

const invoices = ref<MyInvoice[]>([])
const checkoutOpen = ref(false)
const checkoutInvoice = ref<MyInvoice | null>(null)
const checkoutMethod = ref<'gcash' | 'card' | 'bank_transfer'>('gcash')
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const peso = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v)
const confirmed = (inv: MyInvoice) => inv.payments.filter((p) => p.is_confirmed)
const canPay = (inv: MyInvoice) =>
  (inv.status === 'issued' || inv.status === 'partially_paid') && invoiceBalance(inv) > 0
const methodLabel = (method: string) => method.replace('_', ' ')
const totalBalance = computed(() => invoices.value.reduce((sum, i) => sum + invoiceBalance(i), 0))

const { patient, loading, loadError } = useMyPatient(async (p) => {
  invoices.value = await listMyInvoices(p.id)
})

function openCheckout(invoice: MyInvoice, method: 'gcash' | 'card' | 'bank_transfer') {
  checkoutInvoice.value = invoice
  checkoutMethod.value = method
  checkoutOpen.value = true
}

async function submitPayment(input: { amount: number; reference: string }) {
  const invoice = checkoutInvoice.value
  if (!invoice) throw new Error('Choose an invoice and try again.')
  await simulateMyPayment(invoice.id, input.amount, checkoutMethod.value, input.reference)
  if (patient.value) invoices.value = await listMyInvoices(patient.value.id)
}
</script>

<style scoped>
.page { margin: 0 auto; max-width: 800px; padding: 0.5rem; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
.pay-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
</style>
