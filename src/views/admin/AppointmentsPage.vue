<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Appointment Calendar</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="appt-page">
        <PageAction :icon="addOutline" @click="openNew">New appointment</PageAction>
        <ion-card>
          <ion-card-content class="appt-tools">
            <ion-segment v-model="view" aria-label="Calendar view">
              <ion-segment-button value="day"><ion-label>Day</ion-label></ion-segment-button>
              <ion-segment-button value="week"><ion-label>Week</ion-label></ion-segment-button>
              <ion-segment-button value="month"><ion-label>Month</ion-label></ion-segment-button>
              <ion-segment-button value="planner"><ion-label>Planner</ion-label></ion-segment-button>
            </ion-segment>
            <div class="appt-nav">
              <ion-button fill="outline" size="small" @click="shift(-1)">Previous</ion-button>
              <ion-button fill="outline" size="small" @click="goToday">Today</ion-button>
              <ion-button fill="outline" size="small" @click="shift(1)">Next</ion-button>
              <strong>{{ rangeLabel }}</strong>
              <label class="date-picker">
                <span>Jump to date</span>
                <input :value="selectedDate" type="date" aria-label="Jump to date" @change="selectDate" />
              </label>
            </div>
            <ion-select
              v-model="selectedDentist"
              label="Dentist"
              label-placement="stacked"
              fill="outline"
              interface="popover"
            >
              <ion-select-option value="all">All dentists</ion-select-option>
              <ion-select-option v-for="dentist in options.dentists" :key="dentist.id" :value="dentist.id">
                {{ dentist.name }}
              </ion-select-option>
            </ion-select>
            <div class="legend">
              <ion-chip v-for="(color, status) in STATUS_COLORS" :key="status" :color="color">
                {{ statusLabel(status) }}
              </ion-chip>
            </div>
          </ion-card-content>
        </ion-card>

        <div v-if="loading" class="state-message" role="status">Loading appointments...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">
          {{ loadError }}
        </div>

        <template v-else>
          <div v-if="view === 'month'" class="month-calendar">
            <div class="month-weekdays" aria-hidden="true">
              <strong v-for="label in weekdayLabels" :key="label">{{ label }}</strong>
            </div>
            <div class="month-grid">
              <div v-for="blank in monthBlanks" :key="`blank-${blank}`" class="month-blank" aria-hidden="true" />
              <button
                v-for="day in days"
                :key="day.key"
                type="button"
                class="month-day"
                :class="{ 'month-day-today': day.isToday }"
                :aria-label="`${day.label}, ${day.items.length} appointment${day.items.length === 1 ? '' : 's'}`"
                @click="openDay(day.date)"
              >
                <span class="month-day-number">{{ day.date.getDate() }}</span>
                <span v-if="day.items.length" class="month-day-count">
                  {{ day.items.length }} {{ day.items.length === 1 ? 'appointment' : 'appointments' }}
                </span>
                <span v-for="appt in day.items.slice(0, 2)" :key="appt.id" class="month-event">
                  {{ timeFmt.format(new Date(appt.starts_at)) }} · {{ appt.patients?.full_name ?? 'Patient' }}
                </span>
                <span v-if="day.items.length > 2" class="month-more">+{{ day.items.length - 2 }} more</span>
              </button>
            </div>
          </div>

          <div v-else-if="view === 'day'" class="dentist-columns">
            <ion-card v-for="column in dentistColumns" :key="column.id" class="dentist-column">
              <ion-card-header>
                <ion-card-title class="person-line">
                  <UserAvatar :name="column.name" :path="avatars.pathFor(column.profileId)" />
                  {{ column.name }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p v-if="!column.items.length" class="state-message">No appointments.</p>
                <div v-else class="appt-list">
                  <article v-for="appt in column.items" :key="appt.id" class="appt-row">
                    <div class="appt-main">
                      <UserAvatar
                        :name="appt.patients?.full_name ?? 'Patient'"
                        :path="avatars.pathFor(appt.patients?.profile_id)"
                      />
                      <div class="appt-copy">
                        <h2>{{ timeRange(appt) }} · {{ appt.patients?.full_name ?? 'Patient' }}</h2>
                        <p>{{ appt.services?.name ?? 'Service' }}</p>
                        <p v-if="appt.reason">{{ appt.reason }}</p>
                        <ion-chip :color="STATUS_COLORS[appt.status]">{{ statusLabel(appt.status) }}</ion-chip>
                      </div>
                    </div>
                    <div class="appt-actions">
                      <ion-button v-if="isActive(appt)" fill="outline" size="small" @click="openEdit(appt)">
                        Reschedule
                      </ion-button>
                      <ion-button
                        v-if="appt.status === 'pending'"
                        fill="outline"
                        size="small"
                        @click="changeStatus(appt, 'confirmed')"
                      >Confirm</ion-button>
                      <ion-button
                        v-if="isActive(appt)"
                        fill="outline"
                        size="small"
                        @click="changeStatus(appt, 'completed')"
                      >Complete</ion-button>
                      <ion-button
                        v-if="isActive(appt)"
                        fill="outline"
                        size="small"
                        color="danger"
                        @click="changeStatus(appt, 'no_show')"
                      >No-show</ion-button>
                      <ion-button
                        v-if="isActive(appt)"
                        fill="outline"
                        size="small"
                        color="danger"
                        @click="changeStatus(appt, 'cancelled')"
                      >Cancel</ion-button>
                    </div>
                  </article>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <ion-card v-for="day in days" v-else :key="day.key">
            <ion-card-header>
              <ion-card-title>{{ day.label }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p v-if="!day.items.length" class="state-message">No appointments.</p>
              <div v-else class="appt-list">
                <article v-for="appt in day.items" :key="appt.id" class="appt-row">
                  <div class="appt-main">
                    <UserAvatar
                      :name="appt.patients?.full_name ?? 'Patient'"
                      :path="avatars.pathFor(appt.patients?.profile_id)"
                    />
                    <div class="appt-copy">
                      <h2>{{ timeRange(appt) }} · {{ appt.patients?.full_name ?? 'Patient' }}</h2>
                      <p class="person-line">
                        <UserAvatar
                          size="sm"
                          :name="appt.dentists?.profiles?.full_name ?? 'Dentist'"
                          :path="avatars.pathFor(appt.dentists?.profile_id)"
                        />
                        {{ appt.services?.name ?? 'Service' }} with
                        {{ appt.dentists?.profiles?.full_name ?? 'Dentist' }}
                      </p>
                      <p v-if="appt.reason">{{ appt.reason }}</p>
                      <ion-chip :color="STATUS_COLORS[appt.status]">{{ statusLabel(appt.status) }}</ion-chip>
                    </div>
                  </div>
                  <div class="appt-actions">
                    <ion-button fill="outline" size="small" @click="toggleHistory(appt)">History</ion-button>
                    <ion-button v-if="isActive(appt)" fill="outline" size="small" @click="openEdit(appt)">
                      Reschedule
                    </ion-button>
                    <ion-button
                      v-if="appt.status === 'pending'"
                      fill="outline"
                      size="small"
                      @click="changeStatus(appt, 'confirmed')"
                    >Confirm</ion-button>
                    <ion-button
                      v-if="isActive(appt)"
                      fill="outline"
                      size="small"
                      @click="changeStatus(appt, 'completed')"
                    >Complete</ion-button>
                    <ion-button
                      v-if="isActive(appt)"
                      fill="outline"
                      size="small"
                      color="danger"
                      @click="changeStatus(appt, 'no_show')"
                    >No-show</ion-button>
                    <ion-button
                      v-if="isActive(appt)"
                      fill="outline"
                      size="small"
                      color="danger"
                      @click="changeStatus(appt, 'cancelled')"
                    >Cancel</ion-button>
                  </div>
                  <div v-if="openHistoryId === appt.id" class="status-history">
                    <p v-if="historyLoading">Loading status history...</p>
                    <p v-else-if="historyError" class="error-message">{{ historyError }}</p>
                    <p v-else-if="!history.length">No status changes recorded.</p>
                    <template v-else>
                      <p v-for="entry in history" :key="entry.id">
                        {{ historyLabel(entry) }} · {{ historyWhen(entry.changed_at) }}
                      </p>
                    </template>
                  </div>
                </article>
              </div>
            </ion-card-content>
          </ion-card>
        </template>
      </div>

      <ion-modal :is-open="editorOpen" @did-dismiss="closeEditor">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingId ? 'Reschedule appointment' : 'New appointment' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="saving" @click="closeEditor">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="appt-form" @submit.prevent="save">
            <p v-if="!options.dentists.length || !options.services.length" class="error-message">
              Add at least one active dentist and one service before booking
              (see docs/supabase-setup.md).
            </p>
            <ion-select
              v-model="form.patient_id"
              label="Patient"
              label-placement="stacked"
              fill="outline"
              interface="popover"
            >
              <ion-select-option v-for="p in options.patients" :key="p.id" :value="p.id">
                {{ p.full_name }}
              </ion-select-option>
            </ion-select>
            <ion-select
              v-model="form.dentist_id"
              label="Dentist"
              label-placement="stacked"
              fill="outline"
              interface="popover"
            >
              <ion-select-option v-for="d in options.dentists" :key="d.id" :value="d.id">
                {{ d.name }}
              </ion-select-option>
            </ion-select>
            <ion-select
              v-model="form.service_id"
              label="Service"
              label-placement="stacked"
              fill="outline"
              interface="popover"
              @ion-change="applyDuration"
            >
              <ion-select-option v-for="s in options.services" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.duration_minutes }} min)
              </ion-select-option>
            </ion-select>
            <ion-input
              v-model="startLocal"
              label="Start"
              label-placement="stacked"
              fill="outline"
              type="datetime-local"
              @ion-input="applyDuration"
            />
            <ion-input
              v-model="endLocal"
              label="End"
              label-placement="stacked"
              fill="outline"
              type="datetime-local"
            />
            <ion-input v-model="form.reason" label="Reason" label-placement="stacked" fill="outline" />
            <ion-textarea
              v-model="form.notes"
              label="Notes"
              label-placement="stacked"
              fill="outline"
              :auto-grow="true"
            />
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">
              <ion-spinner v-if="saving" name="crescent" />
              <span v-else>{{ editingId ? 'Save new time' : 'Book appointment' }}</span>
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :duration="2600"
        @did-dismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import {
  type AppointmentInput,
  type AppointmentRow,
  type AppointmentStatus,
  createAppointment,
  findSchedulingConflict,
  listAppointments,
  listBookingOptions,
  listStatusHistory,
  setAppointmentStatus,
  type StatusHistoryEntry,
  STATUS_COLORS,
  updateAppointment,
} from '../../services/appointment.service'

type Options = Awaited<ReturnType<typeof listBookingOptions>>

const { profile } = useAuth()
const avatars = useAvatarPaths()
const view = ref<'day' | 'week' | 'month' | 'planner'>('day')
const anchor = ref(startOfDay(new Date()))
const selectedDentist = ref('all')
const appointments = ref<AppointmentRow[]>([])
const openHistoryId = ref('')
const history = ref<StatusHistoryEntry[]>([])
const historyLoading = ref(false)
const historyError = ref('')
const options = ref<Options>({ patients: [], dentists: [], services: [] })
watch([appointments, () => options.value.dentists], () => {
  void avatars.load([
    ...appointments.value.flatMap((appointment) => [
      appointment.patients?.profile_id,
      appointment.dentists?.profile_id,
    ]),
    ...options.value.dentists.map((dentist) => dentist.profileId),
  ])
}, { immediate: true })
const loading = ref(false)
const loadError = ref('')
const editorOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const startLocal = ref('')
const endLocal = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')
const form = reactive({
  patient_id: '',
  dentist_id: '',
  service_id: '',
  reason: '' as string | null,
  notes: '' as string | null,
})

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekStart(date: Date) {
  const d = startOfDay(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function monthStart(date: Date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

const range = computed(() => {
  const from =
    view.value === 'week' || view.value === 'planner'
      ? weekStart(anchor.value)
      : view.value === 'month'
        ? monthStart(anchor.value)
        : startOfDay(anchor.value)
  const to = new Date(from)
  if (view.value === 'month') to.setMonth(to.getMonth() + 1)
  else to.setDate(to.getDate() + (view.value === 'week' || view.value === 'planner' ? 7 : 1))
  return { from, to }
})

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

const rangeLabel = computed(() => {
  const last = new Date(range.value.to)
  last.setDate(last.getDate() - 1)
  if (view.value === 'day') return dateFmt.format(range.value.from)
  if (view.value === 'month') {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(range.value.from)
  }
  return `${dateFmt.format(range.value.from)} – ${dateFmt.format(last)}`
})

const days = computed(() => {
  const result: { key: string; label: string; date: Date; items: AppointmentRow[]; isToday: boolean }[] = []
  for (let d = new Date(range.value.from); d < range.value.to; d.setDate(d.getDate() + 1)) {
    const start = new Date(d)
    const end = new Date(d)
    end.setDate(end.getDate() + 1)
    result.push({
      key: localDateInput(start),
      label: dateFmt.format(start),
      date: start,
      isToday: localDateInput(start) === localDateInput(new Date()),
      items: appointments.value.filter((a) => {
        const t = new Date(a.starts_at)
        return t >= start && t < end && (selectedDentist.value === 'all' || a.dentist_id === selectedDentist.value)
      }),
    })
  }
  return result
})

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthBlanks = computed(() => new Date(range.value.from).getDay())
const selectedDate = computed(() => localDateInput(anchor.value))
const dentistColumns = computed(() => {
  const visibleDentists = options.value.dentists.filter(
    (dentist) => selectedDentist.value === 'all' || dentist.id === selectedDentist.value,
  )
  const columns = visibleDentists.map((dentist) => ({
    ...dentist,
    items: days.value[0]?.items.filter((appointment) => appointment.dentist_id === dentist.id) ?? [],
  }))
  const knownDentists = new Set(columns.map((column) => column.id))
  for (const appointment of days.value[0]?.items ?? []) {
    if (knownDentists.has(appointment.dentist_id)) continue
    columns.push({
      id: appointment.dentist_id,
      name: appointment.dentists?.profiles?.full_name ?? 'Dentist',
      profileId: appointment.dentists?.profile_id ?? '',
      items: days.value[0]?.items.filter((row) => row.dentist_id === appointment.dentist_id) ?? [],
    })
    knownDentists.add(appointment.dentist_id)
  }
  return columns
})

function localDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function selectDate(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (!value) return
  const [year, month, day] = value.split('-').map(Number)
  anchor.value = new Date(year, month - 1, day)
}

function openDay(date: Date) {
  anchor.value = startOfDay(date)
  view.value = 'day'
}

function statusLabel(status: string) {
  return status === 'no_show' ? 'No-show' : status.charAt(0).toUpperCase() + status.slice(1)
}

function isActive(appt: AppointmentRow) {
  return appt.status === 'pending' || appt.status === 'confirmed'
}

function historyLabel(entry: StatusHistoryEntry) {
  if (!entry.old_status) return `Created as ${statusLabel(entry.new_status)}`
  return `${statusLabel(entry.old_status)} → ${statusLabel(entry.new_status)}`
}

function historyWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function toggleHistory(appt: AppointmentRow) {
  if (openHistoryId.value === appt.id) {
    openHistoryId.value = ''
    return
  }
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  openHistoryId.value = appt.id
  historyLoading.value = true
  historyError.value = ''
  history.value = []
  try {
    history.value = await listStatusHistory(clinicId, appt.id)
  } catch (error) {
    historyError.value = error instanceof Error ? error.message : 'Could not load status history.'
  } finally {
    historyLoading.value = false
  }
}

function timeRange(appt: AppointmentRow) {
  return `${timeFmt.format(new Date(appt.starts_at))} – ${timeFmt.format(new Date(appt.ends_at))}`
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function shift(direction: number) {
  const d = new Date(anchor.value)
  if (view.value === 'month') {
    d.setDate(1)
    d.setMonth(d.getMonth() + direction)
  } else {
    d.setDate(d.getDate() + direction * (view.value === 'week' || view.value === 'planner' ? 7 : 1))
  }
  anchor.value = d
}

function goToday() {
  anchor.value = startOfDay(new Date())
}

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    appointments.value = await listAppointments(
      clinicId,
      range.value.from.toISOString(),
      range.value.to.toISOString(),
    )
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load appointments.'
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  try {
    options.value = await listBookingOptions(clinicId)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load booking options.'
  }
}

watch(
  () => [profile.value?.clinicId, view.value, anchor.value] as const,
  () => void load(),
  { immediate: true },
)
watch(() => profile.value?.clinicId, () => void loadOptions(), { immediate: true })

function applyDuration() {
  const service = options.value.services.find((s) => s.id === form.service_id)
  if (!service || !startLocal.value) return
  const start = new Date(startLocal.value)
  if (Number.isNaN(start.getTime())) return
  endLocal.value = toLocalInput(new Date(start.getTime() + service.duration_minutes * 60000))
}

function openNew() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, { patient_id: '', dentist_id: '', service_id: '', reason: '', notes: '' })
  const start = new Date(anchor.value)
  start.setHours(9, 0, 0, 0)
  startLocal.value = toLocalInput(start)
  endLocal.value = toLocalInput(new Date(start.getTime() + 30 * 60000))
  editorOpen.value = true
}

function openEdit(appt: AppointmentRow) {
  editingId.value = appt.id
  formError.value = ''
  Object.assign(form, {
    patient_id: appt.patient_id,
    dentist_id: appt.dentist_id,
    service_id: appt.service_id,
    reason: appt.reason ?? '',
    notes: appt.notes ?? '',
  })
  startLocal.value = toLocalInput(new Date(appt.starts_at))
  endLocal.value = toLocalInput(new Date(appt.ends_at))
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
}

async function save() {
  const clinicId = profile.value?.clinicId
  const actorId = profile.value?.id
  if (!clinicId || !actorId) {
    formError.value = 'Your active clinic session is unavailable. Sign in again and retry.'
    return
  }
  if (!form.patient_id || !form.dentist_id || !form.service_id) {
    formError.value = 'Select a patient, dentist and service.'
    return
  }
  const start = new Date(startLocal.value)
  const end = new Date(endLocal.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    formError.value = 'Enter a valid start time and an end time after it.'
    return
  }
  saving.value = true
  formError.value = ''
  const input: AppointmentInput = {
    patient_id: form.patient_id,
    dentist_id: form.dentist_id,
    service_id: form.service_id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: form.reason?.trim() || null,
    notes: form.notes?.trim() || null,
  }
  try {
    const conflict = await findSchedulingConflict(clinicId, input, editingId.value || undefined)
    if (conflict) {
      formError.value = conflict
      return
    }
    if (editingId.value) await updateAppointment(clinicId, editingId.value, input)
    else await createAppointment(clinicId, actorId, input)
    editorOpen.value = false
    showToast(editingId.value ? 'Appointment rescheduled.' : 'Appointment booked.')
    await load()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not save the appointment.'
  } finally {
    saving.value = false
  }
}

async function changeStatus(appt: AppointmentRow, status: AppointmentStatus) {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  try {
    await setAppointmentStatus(clinicId, appt.id, status)
    showToast(`Marked ${statusLabel(status).toLowerCase()}.`)
    await load()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not update the appointment.')
  }
}
</script>

<style scoped>
.appt-page {
  display: grid;
  gap: 0.5rem;
  margin: 0 auto;
  max-width: 1100px;
  padding: 0.5rem;
}

.appt-tools,
.appt-form {
  display: grid;
  gap: 0.75rem;
}

.appt-form {
  padding: 1rem;
}

.appt-nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: 0.875rem;
}

.date-picker input {
  min-height: 38px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--ion-color-step-250, #c8d0d4);
  border-radius: 8px;
  color: var(--ion-text-color);
  background: var(--ion-background-color);
  font: inherit;
}

.dentist-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  align-items: start;
  gap: 0.5rem;
}

.dentist-column {
  height: fit-content;
  align-self: start;
}

.appt-list {
  display: flex;
  flex-direction: column;
}

.appt-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.7rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--line);
}

.appt-row:first-child {
  padding-top: 0.15rem;
}

.appt-row:last-child {
  padding-bottom: 0.15rem;
  border-bottom: 0;
}

.appt-main {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.appt-copy {
  min-width: 0;
  flex: 1;
}

.appt-copy h2 {
  margin: 0;
  color: var(--clinic-ink);
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.appt-copy p {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.appt-copy ion-chip {
  margin: 0.5rem 0 0;
}

.appt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.appt-actions ion-button {
  margin: 0;
}

.month-calendar {
  overflow: hidden;
  border: 1px solid var(--ion-color-step-150, #dce2e4);
  border-radius: 12px;
  background: var(--ion-background-color);
}

.month-weekdays,
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.month-weekdays {
  padding: 0.6rem 0;
  color: var(--ion-color-medium);
  text-align: center;
  font-size: 0.8rem;
}

.month-day,
.month-blank {
  min-width: 0;
  min-height: 110px;
  border: 0;
  border-top: 1px solid var(--ion-color-step-150, #dce2e4);
  border-right: 1px solid var(--ion-color-step-150, #dce2e4);
  background: var(--ion-background-color);
}

.month-day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.45rem;
  color: var(--ion-text-color);
  text-align: left;
  cursor: pointer;
}

.month-day:hover,
.month-day:focus-visible {
  background: var(--ion-color-light);
  outline: 2px solid var(--clinic-blue);
  outline-offset: -2px;
}

.month-day-today .month-day-number {
  display: grid;
  width: 1.6rem;
  height: 1.6rem;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--clinic-blue);
}

.month-day-count,
.month-more {
  color: var(--clinic-blue);
  font-size: 0.72rem;
  font-weight: 700;
}

.month-event {
  width: 100%;
  overflow: hidden;
  padding: 0.15rem 0.25rem;
  border-radius: 4px;
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary-contrast);
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}

.status-history {
  color: var(--muted);
  font-size: 0.86rem;
}

.status-history p {
  margin: 0.15rem 0;
}

@media (max-width: 600px) {
  .month-day,
  .month-blank {
    min-height: 72px;
  }

  .month-day {
    padding: 0.25rem;
  }

  .month-event {
    display: none;
  }

  .month-day-count,
  .month-more {
    font-size: 0.62rem;
  }

  .date-picker {
    width: 100%;
    margin-left: 0;
  }
}
</style>
