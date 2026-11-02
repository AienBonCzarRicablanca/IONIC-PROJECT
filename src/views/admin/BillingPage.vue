<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Billing & Invoicing</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="billing-page">
        <PageAction :icon="addOutline" @click="newOpen = true">New invoice</PageAction>
        <div v-if="loading" class="state-message" role="status">Loading invoices...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">
          {{ loadError }}
        </div>
        <p v-else-if="!invoices.length" class="state-message">No invoices yet.</p>
        <ion-list v-else lines="full">
          <ion-item v-for="inv in invoices" :key="inv.id" button :detail="false" @click="openInvoice(inv.id)">
            <UserAvatar
              slot="start"
              :name="inv.patients?.full_name ?? 'Patient'"
              :path="avatars.pathFor(inv.patients?.profile_id)"
            />
            <ion-label>
              <h2>{{ inv.invoice_number }} · {{ inv.patients?.full_name }}</h2>
              <p>{{ new Date(inv.created_at).toLocaleDateString() }} · {{ peso(inv.total) }}</p>
            </ion-label>
            <ion-chip :color="INVOICE_COLORS[inv.status]">{{ label(inv.status) }}</ion-chip>
          </ion-item>
        </ion-list>
      </div>

      <ion-modal :is-open="newOpen" @did-dismiss="newOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>New invoice</ion-title>
            <ion-buttons slot="end"><ion-button @click="newOpen = false">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="form" @submit.prevent="createDraft">
            <ion-select v-model="newPatientId" label="Patient" label-placement="stacked" fill="outline" interface="popover">
              <ion-select-option v-for="p in options.patients" :key="p.id" :value="p.id">
                {{ p.full_name }}
              </ion-select-option>
            </ion-select>
            <p v-if="newError" class="error-message" role="alert">{{ newError }}</p>
            <ion-button expand="block" type="submit" :disabled="busy || !newPatientId">Create draft</ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="Boolean(detail)" @did-dismiss="closeDetail">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ detail?.invoice_number }}</ion-title>
            <ion-buttons slot="end"><ion-button @click="closeDetail">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content v-if="detail">
          <div class="form">
            <p>
              <strong>{{ detail.patients?.full_name }}</strong>
              <ion-chip :color="INVOICE_COLORS[detail.status]">{{ label(detail.status) }}</ion-chip>
            </p>

            <ion-list lines="full">
              <ion-item v-for="item in detail.invoice_items" :key="item.id">
                <ion-label class="ion-text-wrap">
                  <h3>{{ item.description }}</h3>
                  <p>{{ item.quantity }} × {{ peso(item.unit_price) }} = {{ peso(item.line_total) }}</p>
                </ion-label>
                <ion-button v-if="isDraft" slot="end" fill="clear" color="danger" size="small" :disabled="busy" @click="removeItem(item.id)">
                  Remove
                </ion-button>
              </ion-item>
              <ion-item v-if="!detail.invoice_items.length"><ion-label>No line items yet.</ion-label></ion-item>
            </ion-list>

            <form v-if="isDraft" class="form inline" @submit.prevent="addItem">
              <ion-select v-model="itemServiceId" label="Service (optional)" label-placement="stacked" fill="outline" interface="popover" @ion-change="fillFromService">
                <ion-select-option v-for="s in options.services" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ peso(s.price) }})
                </ion-select-option>
              </ion-select>
              <ion-input v-model="itemDescription" label="Description" label-placement="stacked" fill="outline" />
              <ion-input v-model="itemQuantity" label="Quantity" label-placement="stacked" fill="outline" type="number" min="1" />
              <ion-input v-model="itemPrice" label="Unit price (PHP)" label-placement="stacked" fill="outline" type="number" min="0" step="0.01" />
              <ion-button type="submit" fill="outline" :disabled="busy">Add item</ion-button>
              <ion-input v-model="discountValue" label="Discount (PHP)" label-placement="stacked" fill="outline" type="number" min="0" step="0.01" />
              <ion-button fill="outline" :disabled="busy" @click="saveDiscount">Save discount</ion-button>
            </form>

            <ion-list lines="none">
              <ion-item><ion-label>Subtotal</ion-label><span slot="end">{{ peso(detail.subtotal) }}</span></ion-item>
              <ion-item><ion-label>Discount</ion-label><span slot="end">{{ peso(detail.discount) }}</span></ion-item>
              <ion-item><ion-label><strong>Total</strong></ion-label><strong slot="end">{{ peso(detail.total) }}</strong></ion-item>
              <ion-item><ion-label>Paid</ion-label><span slot="end">{{ peso(paidAmount) }}</span></ion-item>
              <ion-item><ion-label><strong>Balance</strong></ion-label><strong slot="end">{{ peso(balance) }}</strong></ion-item>
            </ion-list>

            <template v-if="detail.payments.length">
              <h3>Payments</h3>
              <ion-list lines="full">
                <ion-item v-for="pay in detail.payments" :key="pay.id">
                  <ion-label>
                    {{ peso(pay.amount) }} · {{ label(pay.method) }}
                    <p>{{ new Date(pay.created_at).toLocaleString() }}{{ pay.reference_number ? ` · ${pay.reference_number}` : '' }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </template>

            <h3>Installments</h3>
            <ion-list v-if="sortedInstallments.length" lines="full">
              <ion-item v-for="item in sortedInstallments" :key="item.id">
                <ion-label>
                  {{ peso(item.amount) }} due {{ item.due_at }}
                  <p>{{ item.paid_at ? `Paid ${new Date(item.paid_at).toLocaleDateString()}` : 'Unpaid' }}</p>
                </ion-label>
                <ion-button
                  v-if="!item.paid_at && detail.status !== 'void'"
                  slot="end"
                  fill="clear"
                  color="danger"
                  size="small"
                  :disabled="busy"
                  @click="deleteInstallment(item.id)"
                >
                  Remove
                </ion-button>
              </ion-item>
            </ion-list>
            <p v-else>No installment schedule yet.</p>
            <form v-if="detail.status !== 'void' && detail.status !== 'paid'" class="form inline" @submit.prevent="saveInstallment">
              <ion-input v-model="installmentDue" label="Due date" label-placement="stacked" fill="outline" type="date" />
              <ion-input v-model="installmentAmount" label="Amount (PHP)" label-placement="stacked" fill="outline" type="number" min="0.01" step="0.01" />
              <ion-button type="submit" fill="outline" :disabled="busy">Add installment</ion-button>
              <p>A payment marks the next unpaid installment paid when the amount covers it.</p>
            </form>

            <div v-if="canPay" class="pay-row">
              <h3>Demo checkout</h3>
              <p>GCash, card, and bank look like a real payment. No money is charged.</p>
              <ion-button size="small" :disabled="busy" @click="openCheckout('gcash')">GCash</ion-button>
              <ion-button size="small" fill="outline" :disabled="busy" @click="openCheckout('card')">Card</ion-button>
              <ion-button size="small" fill="outline" :disabled="busy" @click="openCheckout('bank_transfer')">Bank</ion-button>
            </div>
            <form v-if="canPay" class="form inline" @submit.prevent="addPayment">
              <h3>Record cash at the desk</h3>
              <ion-input v-model="payAmount" label="Amount (PHP)" label-placement="stacked" fill="outline" type="number" min="0.01" step="0.01" />
              <ion-input v-model="payReference" label="Reference no. (optional)" label-placement="stacked" fill="outline" />
              <ion-button type="submit" :disabled="busy">Record cash</ion-button>
            </form>

            <p v-if="detailError" class="error-message" role="alert">{{ detailError }}</p>

            <div class="actions">
              <ion-button v-if="isDraft" :disabled="busy || !detail.invoice_items.length" @click="changeStatus('issued')">Issue invoice</ion-button>
              <ion-button v-if="isDraft || detail.status === 'issued'" color="danger" fill="outline" :disabled="busy" @click="changeStatus('void')">Void</ion-button>
              <ion-button v-if="detail.status !== 'draft' && detail.status !== 'void'" fill="outline" @click="print">Print receipt</ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>

      <PaymentCheckout
        :open="checkoutOpen"
        :invoice-number="detail?.invoice_number ?? ''"
        :balance="balance"
        :method="checkoutMethod"
        :pay="submitCheckout"
        @close="checkoutOpen = false"
      />

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2600" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import PaymentCheckout from '../../components/billing/PaymentCheckout.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import {
  addInstallment,
  addInvoiceItem,
  createInvoice,
  getInvoice,
  INVOICE_COLORS,
  type InvoiceDetail,
  type InvoiceListRow,
  listBillingOptions,
  listInvoices,
  recordPayment,
  removeInstallment,
  removeInvoiceItem,
  setInvoiceDiscount,
  setInvoiceStatus,
} from '../../services/billing.service'
import { printReceipt } from '../../utils/receipt'

type Options = Awaited<ReturnType<typeof listBillingOptions>>

const { profile } = useAuth()
const avatars = useAvatarPaths()
const invoices = ref<InvoiceListRow[]>([])
watch(invoices, (rows) => void avatars.load(rows.map((invoice) => invoice.patients?.profile_id)), {
  immediate: true,
})
const options = ref<Options>({ patients: [], services: [] })
const detail = ref<InvoiceDetail | null>(null)
const loading = ref(false)
const busy = ref(false)
const loadError = ref('')
const detailError = ref('')
const newError = ref('')
const newOpen = ref(false)
const newPatientId = ref('')
const itemServiceId = ref('')
const itemDescription = ref('')
const itemQuantity = ref('1')
const itemPrice = ref('')
const discountValue = ref('0')
const payAmount = ref('')
const payReference = ref('')
const checkoutOpen = ref(false)
const checkoutMethod = ref<'gcash' | 'card' | 'bank_transfer'>('gcash')
const installmentDue = ref('')
const installmentAmount = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')

const peso = (value: number | null) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value ?? 0)
const label = (value: string) => {
  const text = value.replace('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const isDraft = computed(() => detail.value?.status === 'draft')
const paidAmount = computed(() =>
  (detail.value?.payments ?? []).filter((p) => p.is_confirmed).reduce((sum, p) => sum + p.amount, 0),
)
const balance = computed(() => (detail.value?.total ?? 0) - paidAmount.value)
const canPay = computed(
  () => (detail.value?.status === 'issued' || detail.value?.status === 'partially_paid') && balance.value > 0,
)
const sortedInstallments = computed(() =>
  [...(detail.value?.payment_installments ?? [])].sort((a, b) => a.due_at.localeCompare(b.due_at)),
)

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

async function loadList() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    invoices.value = await listInvoices(clinicId)
    options.value = await listBillingOptions(clinicId)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load invoices.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void loadList(), { immediate: true })

async function refreshDetail(id: string) {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  detail.value = await getInvoice(clinicId, id)
  discountValue.value = String(detail.value.discount)
  payAmount.value = ''
}

async function openInvoice(id: string) {
  detailError.value = ''
  try {
    await refreshDetail(id)
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not open the invoice.')
  }
}

function closeDetail() {
  detail.value = null
  void loadList()
}

async function createDraft() {
  const clinicId = profile.value?.clinicId
  const actorId = profile.value?.id
  if (!clinicId || !actorId) return
  busy.value = true
  newError.value = ''
  try {
    const id = await createInvoice(clinicId, actorId, newPatientId.value)
    newOpen.value = false
    newPatientId.value = ''
    await refreshDetail(id)
  } catch (error) {
    newError.value = error instanceof Error ? error.message : 'Could not create the invoice.'
  } finally {
    busy.value = false
  }
}

async function mutate(action: (clinicId: string, invoiceId: string) => Promise<void>, success?: string) {
  const clinicId = profile.value?.clinicId
  const current = detail.value
  if (!clinicId || !current) return
  busy.value = true
  detailError.value = ''
  try {
    await action(clinicId, current.id)
    await refreshDetail(current.id)
    if (success) showToast(success)
  } catch (error) {
    detailError.value = error instanceof Error ? error.message : 'Action failed.'
  } finally {
    busy.value = false
  }
}

function fillFromService() {
  const service = options.value.services.find((s) => s.id === itemServiceId.value)
  if (!service) return
  itemDescription.value = service.name
  itemPrice.value = String(service.price)
}

const addItem = () =>
  mutate(async (clinicId, invoiceId) => {
    const quantity = Number(itemQuantity.value)
    const price = Number(itemPrice.value)
    if (!itemDescription.value.trim() || !Number.isInteger(quantity) || quantity < 1 || !(price >= 0) || itemPrice.value === '') {
      throw new Error('Enter a description, a whole-number quantity and a valid price.')
    }
    await addInvoiceItem(clinicId, invoiceId, {
      description: itemDescription.value.trim(),
      quantity,
      unit_price: price,
      service_id: itemServiceId.value || null,
    })
    itemServiceId.value = ''
    itemDescription.value = ''
    itemQuantity.value = '1'
    itemPrice.value = ''
  })

const removeItem = (itemId: string) => mutate((clinicId) => removeInvoiceItem(clinicId, itemId))

const saveDiscount = () =>
  mutate(async (clinicId, invoiceId) => {
    const discount = Number(discountValue.value)
    if (!(discount >= 0)) throw new Error('Discount must be zero or more.')
    await setInvoiceDiscount(clinicId, invoiceId, discount)
  }, 'Discount saved.')

const changeStatus = (status: 'issued' | 'void') =>
  mutate((clinicId, invoiceId) => setInvoiceStatus(clinicId, invoiceId, status), status === 'issued' ? 'Invoice issued.' : 'Invoice voided.')

const saveInstallment = () =>
  mutate(async (clinicId, invoiceId) => {
    const amount = Number(installmentAmount.value)
    if (!installmentDue.value) throw new Error('Choose an installment due date.')
    if (!(amount > 0)) throw new Error('Enter an installment amount above zero.')
    const scheduled = sortedInstallments.value.reduce((sum, item) => sum + Number(item.amount), 0)
    if (scheduled + amount > (detail.value?.total ?? 0) + 0.009) {
      throw new Error('Installments cannot add up to more than the invoice total.')
    }
    await addInstallment(clinicId, invoiceId, installmentDue.value, amount)
    installmentDue.value = ''
    installmentAmount.value = ''
  }, 'Installment added.')

const deleteInstallment = (id: string) =>
  mutate((clinicId) => removeInstallment(clinicId, id), 'Installment removed.')

function openCheckout(method: 'gcash' | 'card' | 'bank_transfer') {
  checkoutMethod.value = method
  checkoutOpen.value = true
}

async function submitCheckout(input: { amount: number; reference: string }) {
  const clinicId = profile.value?.clinicId
  const actorId = profile.value?.id
  const current = detail.value
  if (!clinicId || !actorId || !current) throw new Error('Sign in again and retry.')
  await recordPayment(clinicId, current.id, actorId, input.amount, checkoutMethod.value, input.reference)
  await refreshDetail(current.id)
}

const addPayment = () =>
  mutate(async (clinicId, invoiceId) => {
    const amount = Number(payAmount.value)
    const actorId = profile.value?.id
    if (!actorId) throw new Error('Sign in again and retry.')
    if (!(amount > 0)) throw new Error('Enter a payment amount above zero.')
    if (amount > balance.value) throw new Error('Payment cannot exceed the remaining balance.')
    await recordPayment(clinicId, invoiceId, actorId, amount, 'cash', payReference.value.trim() || null)
    payReference.value = ''
  }, 'Payment recorded.')

function print() {
  if (!detail.value) return
  try {
    printReceipt(detail.value, 'Harbor Dental')
  } catch (error) {
    detailError.value = error instanceof Error ? error.message : 'Could not print.'
  }
}
</script>

<style scoped>
.billing-page {
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.form {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.form.inline {
  padding: 0;
}

.actions,
.pay-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pay-row {
  align-items: center;
}

.pay-row h3,
.pay-row p {
  flex-basis: 100%;
  margin: 0;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
