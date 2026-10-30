<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Queue Management</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="load">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="queue-page">
        <div v-if="loading && !entries.length" class="state-message" role="status">
          Loading queue...
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">
          {{ loadError }}
        </div>

        <ion-card>
          <ion-card-header><ion-card-title>Check in today's appointments</ion-card-title></ion-card-header>
          <ion-card-content>
            <p v-if="!candidates.length" class="state-message">
              No pending or confirmed appointments left to check in.
            </p>
            <ion-list v-else lines="full">
              <ion-item v-for="appt in candidates" :key="appt.id" :detail="false">
                <UserAvatar
                  slot="start"
                  :name="appt.patients?.full_name ?? 'Patient'"
                  :path="avatars.pathFor(appt.patients?.profile_id)"
                />
                <ion-label>
                  <h2>{{ timeFmt.format(new Date(appt.starts_at)) }} · {{ appt.patients?.full_name }}</h2>
                  <p>{{ appt.services?.name }}</p>
                </ion-label>
                <ion-button slot="end" size="small" :disabled="busy" @click="checkIn(appt.id)">
                  Check in
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <ion-card v-for="column in columns" :key="column.status">
          <ion-card-header>
            <ion-card-title>{{ column.title }} ({{ column.items.length }})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p v-if="!column.items.length" class="state-message">Nobody here.</p>
            <ion-list v-else lines="full">
              <ion-item v-for="entry in column.items" :key="entry.id" :detail="false">
                <UserAvatar
                  slot="start"
                  :name="entry.appointments?.patients?.full_name ?? 'Patient'"
                  :path="avatars.pathFor(entry.appointments?.patients?.profile_id)"
                />
                <ion-chip :color="column.color">#{{ entry.queue_number }}</ion-chip>
                <ion-label class="ion-text-wrap">
                  <h2>{{ entry.appointments?.patients?.full_name ?? 'Patient' }}</h2>
                  <p class="person-line">
                    <UserAvatar
                      size="sm"
                      :name="entry.appointments?.dentists?.profiles?.full_name ?? 'Dentist'"
                      :path="avatars.pathFor(entry.appointments?.dentists?.profile_id)"
                    />
                    {{ entry.appointments?.services?.name }} with
                    {{ entry.appointments?.dentists?.profiles?.full_name ?? 'Dentist' }}
                  </p>
                  <p>Checked in {{ timeFmt.format(new Date(entry.added_at)) }}</p>
                </ion-label>
                <ion-button
                  v-if="entry.status === 'waiting'"
                  slot="end"
                  size="small"
                  :disabled="busy"
                  @click="move(entry, 'in_session')"
                >
                  Start session
                </ion-button>
                <ion-button
                  v-if="entry.status === 'in_session'"
                  slot="end"
                  size="small"
                  color="success"
                  :disabled="busy"
                  @click="move(entry, 'done')"
                >
                  Finish
                </ion-button>
                <ion-button
                  v-if="entry.status === 'waiting'"
                  slot="end"
                  size="small"
                  fill="clear"
                  color="danger"
                  :disabled="busy"
                  @click="remove(entry)"
                >
                  Remove
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

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
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import {
  checkInAppointment,
  type CheckInCandidate,
  listCheckInCandidates,
  listQueue,
  type QueueRow,
  type QueueStatus,
  removeFromQueue,
  setQueueStatus,
} from '../../services/queue.service'

const { profile } = useAuth()
const avatars = useAvatarPaths()
const entries = ref<QueueRow[]>([])
const candidates = ref<CheckInCandidate[]>([])
watch([entries, candidates], () => {
  void avatars.load([
    ...entries.value.map((entry) => entry.appointments?.patients?.profile_id),
    ...entries.value.map((entry) => entry.appointments?.dentists?.profile_id),
    ...candidates.value.map((appointment) => appointment.patients?.profile_id),
  ])
}, { immediate: true })
const loading = ref(false)
const busy = ref(false)
const loadError = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

const columns = computed(() => [
  { status: 'in_session' as const, title: 'In session', color: 'primary' },
  { status: 'waiting' as const, title: 'Waiting', color: 'warning' },
  { status: 'done' as const, title: 'Done', color: 'success' },
].map((column) => ({
  ...column,
  items: entries.value.filter((entry) => entry.status === column.status),
})))

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function todayRange() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = todayRange()
    entries.value = await listQueue(clinicId, from, to)
    candidates.value = await listCheckInCandidates(
      clinicId,
      from,
      to,
      entries.value.map((entry) => entry.appointment_id),
    )
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load the queue.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })

async function run(action: (clinicId: string) => Promise<void>, success: string) {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  busy.value = true
  try {
    await action(clinicId)
    showToast(success)
    await load()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Queue update failed.')
  } finally {
    busy.value = false
  }
}

const checkIn = (appointmentId: string) =>
  run((clinicId) => checkInAppointment(clinicId, appointmentId), 'Patient checked in.')
const move = (entry: QueueRow, status: QueueStatus) =>
  run((clinicId) => setQueueStatus(clinicId, entry, status), 'Queue updated.')
const remove = (entry: QueueRow) =>
  run((clinicId) => removeFromQueue(clinicId, entry.id), 'Removed from queue.')
</script>

<style scoped>
.queue-page {
  display: grid;
  gap: 0.5rem;
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
