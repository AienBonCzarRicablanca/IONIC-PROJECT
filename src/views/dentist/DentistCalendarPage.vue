<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>My Calendar</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="calendar-page">
        <PageAction :icon="refreshOutline" :disabled="loading" @click="load">Refresh</PageAction>
        <ion-card>
          <ion-card-content class="calendar-tools">
            <ion-segment v-model="view" aria-label="Calendar view">
              <ion-segment-button value="day"><ion-label>Day</ion-label></ion-segment-button>
              <ion-segment-button value="week"><ion-label>Week</ion-label></ion-segment-button>
              <ion-segment-button value="month"><ion-label>Month</ion-label></ion-segment-button>
              <ion-segment-button value="planner"><ion-label>Planner</ion-label></ion-segment-button>
            </ion-segment>
            <div class="calendar-nav">
              <ion-button fill="outline" size="small" @click="shift(-1)">Previous</ion-button>
              <ion-button fill="outline" size="small" @click="goToday">Today</ion-button>
              <ion-button fill="outline" size="small" @click="shift(1)">Next</ion-button>
              <strong>{{ rangeLabel }}</strong>
              <label class="date-picker">
                <span>Jump to date</span>
                <input :value="selectedDate" type="date" aria-label="Jump to date" @change="selectDate" />
              </label>
            </div>
            <p class="hint">Only appointments assigned to you are shown.</p>
          </ion-card-content>
        </ion-card>

        <div v-if="loading" class="state-message" role="status">Loading your schedule...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-else>
          <div v-if="view === 'month'" class="month-calendar">
            <div class="weekdays" aria-hidden="true">
              <strong v-for="label in weekdayLabels" :key="label">{{ label }}</strong>
            </div>
            <div class="month-grid">
              <div v-for="blank in monthBlanks" :key="`blank-${blank}`" class="month-blank" aria-hidden="true" />
              <button
                v-for="day in days"
                :key="day.key"
                type="button"
                class="month-day"
                :class="{ today: day.isToday }"
                :aria-label="`${day.label}, ${day.items.length} appointments`"
                @click="openDay(day.date)"
              >
                <span class="day-number">{{ day.date.getDate() }}</span>
                <span v-if="day.items.length" class="day-count">
                  {{ day.items.length }} {{ day.items.length === 1 ? 'appointment' : 'appointments' }}
                </span>
                <span v-for="appointment in day.items.slice(0, 2)" :key="appointment.id" class="month-event">
                  {{ timeFmt.format(new Date(appointment.starts_at)) }} · {{ appointment.patients?.full_name ?? 'Patient' }}
                </span>
                <span v-if="day.items.length > 2" class="day-count">+{{ day.items.length - 2 }} more</span>
              </button>
            </div>
          </div>

          <ion-card v-for="day in days" v-else :key="day.key">
            <ion-card-header><ion-card-title>{{ day.label }}</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!day.items.length" class="state-message">No appointments.</p>
              <ion-list v-else lines="full">
                <ion-item
                  v-for="appointment in day.items"
                  :key="appointment.id"
                  button
                  :detail="true"
                  :router-link="`/dentist/patients/${appointment.patient_id}`"
                >
                  <UserAvatar
                    slot="start"
                    :name="appointment.patients?.full_name ?? 'Patient'"
                    :path="avatars.pathFor(appointment.patients?.profile_id)"
                  />
                  <ion-label class="ion-text-wrap">
                    <h2>{{ timeRange(appointment) }} · {{ appointment.patients?.full_name ?? 'Patient' }}</h2>
                    <p>{{ appointment.services?.name ?? 'Service' }}</p>
                    <p v-if="appointment.reason">{{ appointment.reason }}</p>
                  </ion-label>
                  <ion-chip :color="STATUS_COLORS[appointment.status]">
                    {{ appointment.status.replace('_', ' ') }}
                  </ion-chip>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { refreshOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import { getMyDentistId } from '../../services/clinical.service'
import {
  listAppointments,
  STATUS_COLORS,
  type AppointmentRow,
} from '../../services/appointment.service'

const { profile } = useAuth()
const view = ref<'day' | 'week' | 'month' | 'planner'>('week')
const anchor = ref(startOfDay(new Date()))
const appointments = ref<AppointmentRow[]>([])
const avatars = useAvatarPaths()
watch(appointments, (rows) => {
  void avatars.load(rows.map((appointment) => appointment.patients?.profile_id))
}, { immediate: true })
const loading = ref(false)
const loadError = ref('')
let requestId = 0

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

function localDateInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfWeek(date: Date) {
  const start = startOfDay(date)
  start.setDate(start.getDate() - start.getDay())
  return start
}

const range = computed(() => {
  const from =
    view.value === 'month'
      ? new Date(anchor.value.getFullYear(), anchor.value.getMonth(), 1)
      : view.value === 'week' || view.value === 'planner'
        ? startOfWeek(anchor.value)
        : startOfDay(anchor.value)
  const to = new Date(from)
  if (view.value === 'month') to.setMonth(to.getMonth() + 1)
  else to.setDate(to.getDate() + (view.value === 'week' || view.value === 'planner' ? 7 : 1))
  return { from, to }
})

const rangeLabel = computed(() => {
  if (view.value === 'month') {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(range.value.from)
  }
  const last = new Date(range.value.to)
  last.setDate(last.getDate() - 1)
  return view.value === 'day'
    ? dateFmt.format(range.value.from)
    : `${dateFmt.format(range.value.from)} – ${dateFmt.format(last)}`
})

const selectedDate = computed(() => localDateInput(anchor.value))
const monthBlanks = computed(() => range.value.from.getDay())

const days = computed(() => {
  const result: { key: string; label: string; date: Date; items: AppointmentRow[]; isToday: boolean }[] = []
  for (let date = new Date(range.value.from); date < range.value.to; date.setDate(date.getDate() + 1)) {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    result.push({
      key: localDateInput(start),
      label: dateFmt.format(start),
      date: start,
      isToday: localDateInput(start) === localDateInput(new Date()),
      items: appointments.value.filter((appointment) => {
        const startsAt = new Date(appointment.starts_at)
        return startsAt >= start && startsAt < end
      }),
    })
  }
  return result
})

function timeRange(appointment: AppointmentRow) {
  return `${timeFmt.format(new Date(appointment.starts_at))} – ${timeFmt.format(new Date(appointment.ends_at))}`
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

function shift(direction: number) {
  const date = new Date(anchor.value)
  if (view.value === 'month') {
    date.setDate(1)
    date.setMonth(date.getMonth() + direction)
  } else {
    date.setDate(date.getDate() + direction * (view.value === 'week' || view.value === 'planner' ? 7 : 1))
  }
  anchor.value = date
}

function goToday() {
  anchor.value = startOfDay(new Date())
}

async function load() {
  const request = ++requestId
  const clinicId = profile.value?.clinicId
  const profileId = profile.value?.id
  if (!clinicId || !profileId) return
  loading.value = true
  loadError.value = ''
  try {
    const linkedDentistId = await getMyDentistId(clinicId, profileId)
    if (!linkedDentistId) throw new Error('No active dentist record is linked to this account.')
    const rows = await listAppointments(
      clinicId,
      range.value.from.toISOString(),
      range.value.to.toISOString(),
      linkedDentistId,
    )
    if (request !== requestId) return
    appointments.value = rows
  } catch (error) {
    if (request === requestId) {
      loadError.value = error instanceof Error ? error.message : 'Could not load your schedule.'
    }
  } finally {
    if (request === requestId) loading.value = false
  }
}

watch(
  () => [profile.value?.clinicId, profile.value?.id, view.value, anchor.value] as const,
  () => void load(),
  { immediate: true },
)
</script>

<style scoped>
.calendar-page {
  display: grid;
  gap: 0.5rem;
  margin: 0 auto;
  max-width: 1100px;
  padding: 0.5rem;
}

.calendar-tools {
  display: grid;
  gap: 0.75rem;
}

.calendar-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
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

.hint,
.state-message {
  color: var(--ion-color-medium);
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}

.month-calendar {
  overflow: hidden;
  border: 1px solid var(--ion-color-step-150, #dce2e4);
  border-radius: 12px;
  background: var(--ion-background-color);
}

.weekdays,
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.weekdays {
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

.today .day-number {
  display: grid;
  width: 1.6rem;
  height: 1.6rem;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--clinic-blue);
}

.day-count {
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

@media (max-width: 600px) {
  .date-picker {
    width: 100%;
    margin-left: 0;
  }

  .month-day,
  .month-blank {
    min-height: 72px;
  }

  .month-event {
    display: none;
  }
}
</style>
