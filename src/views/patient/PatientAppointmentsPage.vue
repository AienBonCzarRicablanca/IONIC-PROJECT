<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Book an Appointment</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="patient && !loadError">
          <ion-card>
            <ion-card-header><ion-card-title>Request an appointment</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-select v-model="serviceId" label="Service" label-placement="stacked" placeholder="Choose a service" interface="popover">
                <ion-select-option v-for="s in services" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.duration_minutes }} min)
                </ion-select-option>
              </ion-select>
              <ion-select v-model="dentistId" label="Dentist" label-placement="stacked" placeholder="Choose a dentist" interface="popover">
                <ion-select-option v-for="d in dentists" :key="d.id" :value="d.id">
                  {{ d.full_name }}<template v-if="d.specialization"> – {{ d.specialization }}</template>
                </ion-select-option>
              </ion-select>
              <div class="date-field">
                <label for="appt-date">Date</label>
                <input id="appt-date" v-model="date" type="date" :min="minDate" />
              </div>
              <ion-select v-model="slot" label="Available time" label-placement="stacked"
                :placeholder="slotPlaceholder"
                :disabled="!slots.length" interface="popover">
                <ion-select-option v-for="s in slots" :key="s" :value="s">{{ timeLabel(s) }}</ion-select-option>
              </ion-select>
              <ion-textarea v-model="reason" label="Reason (optional)" label-placement="stacked" :maxlength="300" />
              <ion-button :disabled="busy || !canSubmit" @click="submit">Request appointment</ion-button>
              <p class="hint">Requests start as pending until the clinic confirms them.</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>My appointments</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!appointments.length" class="state-message">No appointments yet.</p>
              <ion-list v-else lines="full">
                <ion-item v-for="a in appointments" :key="a.id" :detail="false">
                  <ion-label class="ion-text-wrap">
                    <h3>{{ fmt.format(new Date(a.starts_at)) }}</h3>
                    <p>{{ a.services?.name }}<span v-if="a.reason"> · {{ a.reason }}</span></p>
                  </ion-label>
                  <ion-chip :color="STATUS_COLOR[a.status] ?? 'medium'">{{ a.status.replace('_', ' ') }}</ion-chip>
                  <ion-button v-if="cancellable(a)" slot="end" size="small" fill="outline" color="danger"
                    :disabled="busy" @click="cancel(a)">Cancel</ion-button>
                </ion-item>
              </ion-list>
              <p class="hint">Online cancellation is available up to 24 hours before the appointment. To reschedule, cancel and book a new time, or call the clinic.</p>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="3000" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonContent,
  IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonSelect, IonSelectOption,
  IonTextarea, IonTitle, IonToast, IonToolbar,
} from '@ionic/vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import { useMyPatient } from '../../composables/useMyPatient'
import * as portal from '../../services/portal.service'

const OPEN_HOUR = 9
const CLOSE_HOUR = 17
const STEP_MIN = 30
const STATUS_COLOR: Record<string, string> = {
  pending: 'warning', confirmed: 'primary', completed: 'success', cancelled: 'medium', no_show: 'danger',
}

const services = ref<portal.PortalService[]>([])
const dentists = ref<portal.PortalDentist[]>([])
const appointments = ref<portal.MyAppointment[]>([])
const busy = ref(false)
const toastOpen = ref(false)
const toastMessage = ref('')
const serviceId = ref('')
const dentistId = ref('')
const date = ref('')
const slot = ref('')
const reason = ref('')
const busySlots = ref<portal.BusySlot[]>([])
const availabilityLoading = ref(false)
const availabilityLoaded = ref(false)
const availabilityError = ref('')
let availabilityRequestId = 0
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const pad = (n: number) => String(n).padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const minDate = toDateInput(new Date(Date.now() + 86400000))
const timeLabel = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

const selectedService = computed(() => services.value.find((s) => s.id === serviceId.value))
const canSubmit = computed(() =>
  Boolean(
    selectedService.value &&
      dentistId.value &&
      availabilityLoaded.value &&
      !availabilityLoading.value &&
      slots.value.includes(slot.value),
  ),
)
const slotPlaceholder = computed(() => {
  if (availabilityLoading.value) return 'Checking availability...'
  if (availabilityError.value) return 'Availability could not be loaded'
  return slots.value.length ? 'Choose a time' : 'No free time on this date'
})

const slots = computed(() => {
  const service = selectedService.value
  if (!service || !dentistId.value || !date.value || !availabilityLoaded.value) return []
  const [y, m, d] = date.value.split('-').map(Number)
  const result: string[] = []
  const closing = new Date(y, m - 1, d, CLOSE_HOUR, 0)
  for (let t = new Date(y, m - 1, d, OPEN_HOUR, 0); t < closing; t = new Date(t.getTime() + STEP_MIN * 60000)) {
    const end = new Date(t.getTime() + service.duration_minutes * 60000)
    if (end > closing || t <= new Date()) continue
    const clash = busySlots.value.some((b) => new Date(b.starts_at) < end && new Date(b.ends_at) > t)
    if (!clash) result.push(t.toISOString())
  }
  return result
})

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

const cancellable = (a: portal.MyAppointment) =>
  ['pending', 'confirmed'].includes(a.status) && new Date(a.starts_at).getTime() > Date.now() + 86400000

async function refreshBusy() {
  const requestId = ++availabilityRequestId
  slot.value = ''
  busySlots.value = []
  availabilityLoaded.value = false
  availabilityError.value = ''
  if (!dentistId.value || !date.value) {
    availabilityLoading.value = false
    return
  }
  availabilityLoading.value = true
  const requestedDentistId = dentistId.value
  const requestedDate = date.value
  const [y, m, d] = requestedDate.split('-').map(Number)
  try {
    const busy = await portal.getBusySlots(
      requestedDentistId,
      new Date(y, m - 1, d).toISOString(),
      new Date(y, m - 1, d + 1).toISOString(),
    )
    if (
      requestId !== availabilityRequestId ||
      dentistId.value !== requestedDentistId ||
      date.value !== requestedDate
    ) return
    busySlots.value = busy
    availabilityLoaded.value = true
  } catch (error) {
    if (
      requestId !== availabilityRequestId ||
      dentistId.value !== requestedDentistId ||
      date.value !== requestedDate
    ) return
    availabilityError.value =
      error instanceof Error ? error.message : 'Could not check availability.'
    showToast(availabilityError.value)
  } finally {
    if (requestId === availabilityRequestId) availabilityLoading.value = false
  }
}
watch([dentistId, date], () => void refreshBusy(), { flush: 'sync' })

const { patient, loadError, reload } = useMyPatient(async (p) => {
  const [svc, den, appts] = await Promise.all([
    portal.listServices(p.clinic_id),
    portal.listDentists(),
    portal.listMyAppointments(p.id),
  ])
  services.value = svc
  dentists.value = den
  appointments.value = appts
})

async function submit() {
  if (!patient.value || !selectedService.value) return
  busy.value = true
  try {
    await portal.requestAppointment(patient.value, {
      dentistId: dentistId.value, service: selectedService.value, start: new Date(slot.value), reason: reason.value,
    })
    showToast('Request sent. The clinic will confirm it soon.')
    reason.value = ''
    await reload()
    await refreshBusy()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not book.')
    await refreshBusy()
  } finally {
    busy.value = false
  }
}

async function cancel(a: portal.MyAppointment) {
  busy.value = true
  try {
    await portal.cancelMyAppointment(a.id)
    showToast('Appointment cancelled.')
    await reload()
    await refreshBusy()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not cancel.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.page { margin: 0 auto; max-width: 800px; padding: 0.5rem; }
.date-field { display: grid; gap: 0.25rem; margin: 0.75rem 0; }
.hint { color: var(--ion-color-medium); font-size: 0.85rem; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
