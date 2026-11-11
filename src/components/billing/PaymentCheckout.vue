<template>
  <ion-modal :is-open="open" @did-dismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="step === 'processing'" @click="close">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="checkout">
        <p class="demo-note">School demo. No real money is charged.</p>

        <form v-if="step === 'form'" class="checkout-form" @submit.prevent="start">
          <p class="invoice-line">{{ invoiceNumber }} · Balance {{ peso(balance) }}</p>
          <ion-input
            v-model="amount"
            label="Amount (PHP)"
            label-placement="stacked"
            fill="outline"
            type="number"
            min="0.01"
            step="0.01"
            inputmode="decimal"
          />

          <template v-if="method === 'gcash'">
            <PhContactInput
              v-model="mobile"
              label="GCash mobile number"
              placeholder="09XXXXXXXXX"
            />
          </template>

          <template v-else-if="method === 'card'">
            <ion-input v-model="cardName" label="Name on card" label-placement="stacked" fill="outline" />
            <ion-input
              v-model="cardNumber"
              label="Card number"
              label-placement="stacked"
              fill="outline"
              placeholder="4242 4242 4242 4242"
              inputmode="numeric"
            />
            <div class="split">
              <ion-input v-model="expiry" label="Expiry" label-placement="stacked" fill="outline" placeholder="MM/YY" inputmode="numeric" />
              <ion-input v-model="cvv" label="CVV" label-placement="stacked" fill="outline" type="password" inputmode="numeric" :maxlength="4" />
            </div>
            <p class="hint">Demo card: 4242 4242 4242 4242, any future expiry, any 3-digit CVV.</p>
          </template>

          <template v-else>
            <ion-select v-model="bank" label="Bank" label-placement="stacked" fill="outline" interface="popover" placeholder="Choose a bank">
              <ion-select-option value="BDO">BDO</ion-select-option>
              <ion-select-option value="BPI">BPI</ion-select-option>
              <ion-select-option value="Metrobank">Metrobank</ion-select-option>
              <ion-select-option value="Landbank">Landbank</ion-select-option>
            </ion-select>
            <p class="account">
              Transfer to Harbor Dental · Calapan City<br />
              Demo account 0042 1188 3601
            </p>
          </template>

          <p v-if="error" class="error-message" role="alert">{{ error }}</p>
          <ion-button expand="block" type="submit">Continue</ion-button>
        </form>

        <div v-else-if="step === 'processing'" class="status-panel" role="status">
          <ion-spinner name="crescent" />
          <h2>{{ processingCopy }}</h2>
          <p>Please keep this open.</p>
        </div>

        <div v-else class="status-panel">
          <span class="mark" aria-hidden="true">✓</span>
          <h2>Payment received</h2>
          <p>{{ peso(paidAmount) }} via {{ title }}</p>
          <p class="reference">Reference {{ reference }}</p>
          <ion-button expand="block" @click="close">Done</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PhContactInput from '../common/PhContactInput.vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'

const props = defineProps<{
  open: boolean
  invoiceNumber: string
  balance: number
  method: 'gcash' | 'card' | 'bank_transfer'
  pay: (input: { amount: number; reference: string }) => Promise<void>
}>()

const emit = defineEmits<{ close: [] }>()

const step = ref<'form' | 'processing' | 'success'>('form')
const amount = ref('')
const mobile = ref('')
const cardName = ref('')
const cardNumber = ref('')
const expiry = ref('')
const cvv = ref('')
const bank = ref('')
const error = ref('')
const reference = ref('')
const paidAmount = ref(0)

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

const title = computed(() =>
  props.method === 'gcash' ? 'GCash' : props.method === 'card' ? 'Card' : 'Bank transfer',
)
const processingCopy = computed(() =>
  props.method === 'gcash'
    ? 'Waiting for GCash confirmation'
    : props.method === 'card'
      ? 'Authorizing the card'
      : 'Confirming the bank transfer',
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    step.value = 'form'
    amount.value = props.balance > 0 ? props.balance.toFixed(2) : ''
    mobile.value = ''
    cardName.value = ''
    cardNumber.value = ''
    expiry.value = ''
    cvv.value = ''
    bank.value = ''
    error.value = ''
    reference.value = ''
    paidAmount.value = 0
  },
)

function close() {
  if (step.value === 'processing') return
  emit('close')
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

function luhn(num: string) {
  let sum = 0
  let alternate = false
  for (let index = num.length - 1; index >= 0; index -= 1) {
    let digit = Number(num[index])
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return sum % 10 === 0
}

function validate(value: number) {
  if (!(value > 0)) return 'Enter an amount above zero.'
  if (value > props.balance + 0.009) return 'Amount cannot exceed the remaining balance.'
  if (props.method === 'gcash' && !/^09\d{9}$/.test(digits(mobile.value))) {
    return 'Enter an 11-digit GCash number starting with 09.'
  }
  if (props.method === 'card') {
    const pan = digits(cardNumber.value)
    if (!cardName.value.trim()) return 'Enter the name on the card.'
    if (pan.length !== 16 || !luhn(pan)) return 'Enter a valid 16-digit card number.'
    const match = expiry.value.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/)
    if (!match) return 'Enter the expiry as MM/YY.'
    const month = Number(match[1])
    const year = 2000 + Number(match[2])
    const now = new Date()
    const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)
    if (month < 1 || month > 12 || expired) return 'Enter a future expiry date.'
    if (!/^\d{3,4}$/.test(cvv.value.trim())) return 'Enter the 3-digit CVV.'
  }
  if (props.method === 'bank_transfer' && !bank.value) return 'Choose a bank.'
  return ''
}

function buildReference() {
  const stamp = Math.floor(100000 + Math.random() * 900000)
  if (props.method === 'gcash') return `GCASH-${digits(mobile.value).slice(-4)}-${stamp}`
  if (props.method === 'card') return `CARD-${digits(cardNumber.value).slice(-4)}-${stamp}`
  return `${bank.value}-${stamp}`
}

async function start() {
  const value = Number(amount.value)
  error.value = validate(value)
  if (error.value) return
  const nextReference = buildReference()
  step.value = 'processing'
  await new Promise((resolve) => setTimeout(resolve, 1400))
  try {
    await props.pay({ amount: value, reference: nextReference })
    paidAmount.value = value
    reference.value = nextReference
    step.value = 'success'
  } catch (cause) {
    step.value = 'form'
    error.value = cause instanceof Error ? cause.message : 'The payment could not be recorded.'
  }
}
</script>

<style scoped>
.checkout {
  display: grid;
  gap: 0.9rem;
  max-width: 460px;
  margin: 0 auto;
  padding: 1rem;
}

.demo-note,
.hint,
.account,
.invoice-line {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.checkout-form,
.split {
  display: grid;
  gap: 0.75rem;
}

.split {
  grid-template-columns: 1fr 1fr;
}

.status-panel {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding: 2rem 0;
  text-align: center;
}

.status-panel h2 {
  margin: 0.4rem 0 0;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-weight: 500;
}

.mark {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e5f6ef;
  color: #0f7a4a;
  font-size: 2rem;
}

.reference {
  font-weight: 700;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
