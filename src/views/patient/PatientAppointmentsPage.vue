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
          <header class="intro">
            <p>Harbor Dental</p>
            <h2>Book a visit</h2>
            <p>Choose the care, the dentist, and a free time. You can change any of these before you send the request.</p>
          </header>

          <ion-segment v-model="section" class="section-tabs" aria-label="Appointments">
            <ion-segment-button value="book"><ion-label>Book a visit</ion-label></ion-segment-button>
            <ion-segment-button value="mine"><ion-label>My appointments</ion-label></ion-segment-button>
          </ion-segment>

          <section v-if="section === 'book'" class="panel" aria-labelledby="request-heading">
              <h3 id="request-heading">Request an appointment</h3>
              <ol class="steps">
                <li>
                  <span>Service</span>
                  <ion-select class="slot-source" v-model="serviceId" label="Service" label-placement="stacked" placeholder="Choose a service" interface="popover">
                    <ion-select-option v-for="s in services" :key="s.id" :value="s.id">
                      {{ s.name }} ({{ s.duration_minutes }} min)
                    </ion-select-option>
                  </ion-select>
                  <div class="choices" role="listbox" aria-label="Service">
                    <button
                      v-for="s in services"
                      :key="s.id"
                      type="button"
                      role="option"
                      :aria-selected="serviceId === s.id"
                      :class="{ selected: serviceId === s.id }"
                      @click="serviceId = s.id"
                    >
                      <strong>{{ s.name }}</strong>
                      <span>{{ s.duration_minutes }} min</span>
                    </button>
                  </div>
                  <p v-if="!services.length" class="field-note">No services are available yet.</p>
                  <p v-else-if="selectedService" class="field-note">Selected for this visit. You can choose a different one.</p>
                </li>
                <li>
                  <span>Dentist</span>
                  <ion-select v-model="dentistId" label="Dentist" label-placement="stacked" placeholder="Choose a dentist" interface="popover" fill="outline">
                    <ion-select-option v-for="d in dentists" :key="d.id" :value="d.id">
                      {{ d.full_name }}<template v-if="d.specialization"> – {{ d.specialization }}</template>
                    </ion-select-option>
                  </ion-select>
                </li>
                <li>
                  <span>Date and time</span>
                  <div class="date-field">
                    <label for="appt-date">Date</label>
                    <input id="appt-date" v-model="date" type="date" :min="minDate" />
                  </div>
                  <ion-select class="slot-source" v-model="slot" label="Available time" label-placement="stacked"
                    :placeholder="slotPlaceholder"
                    :disabled="!slots.length" interface="popover">
                    <ion-select-option v-for="s in slots" :key="s" :value="s">{{ timeLabel(s) }}</ion-select-option>
                  </ion-select>
                  <p v-if="!slots.length" class="field-note">{{ slotPlaceholder }}</p>
                  <div v-else class="times" role="listbox" aria-label="Available time">
                    <button
                      v-for="s in slots"
                      :key="s"
                      type="button"
                      role="option"
                      :aria-selected="slot === s"
                      :class="{ selected: slot === s }"
                      @click="slot = s"
                    >{{ timeLabel(s) }}</button>
                  </div>
                </li>
                <li>
                  <span>Note</span>
                  <ion-textarea v-model="reason" label="Reason (optional)" label-placement="stacked" :maxlength="300" fill="outline" />
                </li>
              </ol>
              <ion-button expand="block" :disabled="busy || !canSubmit" @click="submit">Request appointment</ion-button>
              <p class="hint">Requests start as pending until the clinic confirms them. You will get a notice when the status changes.</p>
          </section>

          <section v-else class="panel" aria-labelledby="mine-heading">
              <h3 id="mine-heading">My appointments</h3>
              <p v-if="!appointments.length" class="state-message">No appointments yet.</p>
              <ul v-else class="visit-list">
                <li v-for="a in appointments" :key="a.id">
                  <div>
                    <strong>{{ a.services?.name || 'Appointment' }}</strong>
                    <span>{{ fmt.format(new Date(a.starts_at)) }}</span>
                    <em v-if="a.reason">{{ a.reason }}</em>
                  </div>
                  <ion-chip :color="STATUS_COLOR[a.status] ?? 'medium'">{{ a.status.replace('_', ' ') }}</ion-chip>
                  <ion-button v-if="cancellable(a)" size="small" fill="outline" color="danger" :disabled="busy" @click="cancel(a)">Cancel</ion-button>
                </li>
              </ul>
              <p class="hint">Online cancellation is available up to 24 hours before the appointment. To reschedule, cancel and book a new time, or call the clinic.</p>
          </section>
        </template>
      </div>
      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="3000" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonButton, IonButtons, IonChip, IonContent, IonHeader, IonLabel, IonMenuButton, IonPage,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToast, IonToolbar,
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

const route = useRoute()
const section = ref<'book' | 'mine'>('book')
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

function applyRequestedService() {
  const wanted = typeof route.query.service === 'string' ? route.query.service.trim().toLowerCase() : ''
  if (!wanted) return
  const match = services.value.find((service) => service.name.trim().toLowerCase() === wanted)
  if (match) serviceId.value = match.id
}

watch(services, applyRequestedService)
watch(() => route.query.service, applyRequestedService)

const { patient, loadError, reload } = useMyPatient(async (p) => {
  const [svc, den, appts] = await Promise.all([
    portal.listServices(p.clinic_id),
    portal.listDentists(),
    portal.listMyAppointments(p.id),
  ])
  services.value = svc
  dentists.value = den
  appointments.value = appts
  applyRequestedService()
})

async function submit() {
  if (!patient.value || !selectedService.value) return
  busy.value = true
  try {
    await portal.requestAppointment(patient.value, {
      dentistId: dentistId.value, service: selectedService.value, start: new Date(slot.value), reason: reason.value,
    })
    showToast('Request sent. The clinic will confirm it soon.')
    section.value = 'mine'
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
.page { margin: 0 auto; max-width: 980px; padding: 8px 2px 28px; }
.intro p:first-child {
  margin: 0;
  color: var(--clinic-blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.intro h2 {
  margin: 4px 0 6px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 500;
  letter-spacing: -0.03em;
}
.intro p:last-child { margin: 0; max-width: 62ch; color: var(--muted); line-height: 1.5; }
.section-tabs { margin-top: 16px; }
.panel {
  margin-top: 16px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.panel h3 {
  margin: 0 0 12px;
  color: var(--clinic-ink);
  font-size: 1.05rem;
}
.steps { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 12px; }
.steps li { position: relative; display: grid; gap: 6px; }
.steps li > span {
  color: var(--clinic-blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.field-note, .hint { margin: 0; color: var(--muted); font-size: 0.85rem; line-height: 1.45; }
.hint { margin-top: 10px; }
.date-field { display: grid; gap: 6px; }
.slot-source {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.choices button {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  text-align: left;
  color: var(--clinic-ink);
  background: var(--canvas);
  border: 1px solid var(--line);
  border-radius: 14px;
  font: inherit;
  cursor: pointer;
}
.choices button span { color: var(--muted); font-size: 0.78rem; }
.choices button.selected {
  color: var(--clinic-ink);
  background: var(--accent-soft);
  border-color: var(--clinic-blue);
  box-shadow: inset 0 0 0 1px var(--clinic-blue);
}
.times { display: flex; flex-wrap: wrap; gap: 8px; }
.times button {
  min-width: 92px;
  padding: 10px 12px;
  color: var(--clinic-ink);
  background: var(--canvas);
  border: 1px solid var(--line);
  border-radius: 999px;
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
.times button.selected {
  color: #fff;
  background: var(--clinic-blue);
  border-color: var(--clinic-blue);
}
.date-field input {
  height: 44px;
  padding: 0 12px;
  color: var(--clinic-ink);
  background: var(--canvas);
  border: 1px solid var(--line);
  border-radius: 12px;
  font: inherit;
}
.visit-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.visit-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 10px;
  align-items: center;
  padding: 12px;
  background: var(--canvas);
  border-radius: var(--radius-md);
}
.visit-list strong, .visit-list span, .visit-list em { display: block; }
.visit-list strong { color: var(--clinic-ink); }
.visit-list span, .visit-list em { color: var(--muted); font-size: 0.84rem; font-style: normal; }
.visit-list ion-button { grid-column: 1 / -1; justify-self: start; margin: 0; }
.state-message { padding: 1rem 0; text-align: center; color: var(--muted); }
.error-message { color: var(--ion-color-danger); }
@media (max-width: 800px) {
  .choices { grid-template-columns: 1fr; }
}
</style>
