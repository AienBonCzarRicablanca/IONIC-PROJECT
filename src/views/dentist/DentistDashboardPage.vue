<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Dentist Dashboard</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="dash-page">
        <DashHero
          :name="profile?.fullName || ''"
          role="Dentist"
          :summary="summaryLine"
          :refreshing="loading"
          @refresh="load"
        />

        <div v-if="loading && !loaded" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading your day…
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="loaded">
          <div class="stat-grid">
            <router-link class="stat" to="/dentist/calendar">
              <ion-icon :icon="calendarNumberOutline" />
              <span class="stat-value">{{ today.length }}</span>
              <span>Visits today</span>
            </router-link>
            <router-link class="stat" to="/dentist/patients">
              <ion-icon :icon="hourglassOutline" />
              <span class="stat-value">{{ waiting }}</span>
              <span>Waiting</span>
            </router-link>
            <router-link class="stat" to="/dentist/patients">
              <ion-icon :icon="medkitOutline" />
              <span class="stat-value">{{ inSession }}</span>
              <span>In session</span>
            </router-link>
          </div>

          <div class="dash-split">
            <section class="dash-panel">
              <h3>Up next</h3>
              <p v-if="!nextUp" class="dash-empty">Nobody is waiting for you right now.</p>
              <div v-else class="person-line">
                <UserAvatar
                  :name="nextUp.appointments?.patients?.full_name ?? 'Patient'"
                  :path="avatars.pathFor(nextUp.appointments?.patients?.profile_id)"
                />
                <div>
                  <p class="dash-visit-time">{{ nextUp.appointments?.patients?.full_name ?? 'Patient' }}</p>
                  <p class="dash-visit-meta">
                    Queue #{{ nextUp.queue_number }} · {{ nextUp.status === 'in_session' ? 'In the chair' : 'Waiting' }}
                  </p>
                </div>
              </div>
              <p v-if="queue.length > 1" class="dash-visit-meta">{{ queue.length - 1 }} more in your queue.</p>
            </section>

            <section class="dash-panel">
              <h3>Today</h3>
              <p v-if="!today.length" class="dash-empty">
                No appointments on your calendar.
                <router-link to="/dentist/calendar">Open the calendar</router-link>.
              </p>
              <ion-list v-else lines="none">
                <ion-item
                  v-for="appt in today"
                  :key="appt.id"
                  button
                  :detail="true"
                  :router-link="`/dentist/patients/${appt.patient_id}`"
                >
                  <UserAvatar
                    slot="start"
                    :name="appt.patients?.full_name ?? 'Patient'"
                    :path="avatars.pathFor(appt.patients?.profile_id)"
                  />
                  <ion-label>
                    <h2>{{ timeFmt.format(new Date(appt.starts_at)) }} · {{ appt.patients?.full_name }}</h2>
                    <p>{{ appt.services?.name || 'Appointment' }} · {{ appt.status.replaceAll('_', ' ') }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </section>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonMenuButton, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import { calendarNumberOutline, hourglassOutline, medkitOutline } from 'ionicons/icons'
import DashHero from '../../components/common/DashHero.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import { getMyDentistId, listMyToday } from '../../services/clinical.service'

type Today = Awaited<ReturnType<typeof listMyToday>>

const { profile, session } = useAuth()
const today = ref<Today['appointments']>([])
const queue = ref<Today['queue']>([])
const avatars = useAvatarPaths()
watch([today, queue], () => {
  void avatars.load([
    ...today.value.map((appointment) => appointment.patients?.profile_id),
    ...queue.value.map((entry) => entry.appointments?.patients?.profile_id),
  ])
})
const loading = ref(false)
const loaded = ref(false)
const loadError = ref('')
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

const waiting = computed(() => queue.value.filter((entry) => entry.status !== 'in_session').length)
const inSession = computed(() => queue.value.filter((entry) => entry.status === 'in_session').length)
const nextUp = computed(() => queue.value.find((entry) => entry.status === 'in_session') ?? queue.value[0] ?? null)
const summaryLine = computed(() => {
  if (!loaded.value) return 'Checking your queue and today’s appointments.'
  if (!today.value.length && !queue.value.length) return 'Your chair is clear today.'
  return `${today.value.length} visits on your list, with ${waiting.value} waiting and ${inSession.value} already in session.`
})

async function load() {
  const clinicId = profile.value?.clinicId
  const userId = session.value?.user.id
  if (!clinicId || !userId) return
  loading.value = true
  loadError.value = ''
  try {
    const dentistId = await getMyDentistId(clinicId, userId)
    if (!dentistId) throw new Error('No active dentist record is linked to this account.')
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    const result = await listMyToday(clinicId, dentistId, from.toISOString(), to.toISOString())
    today.value = result.appointments
    queue.value = result.queue
    loaded.value = true
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load the dashboard.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })
</script>

<style scoped>
.state-message { padding: 1.25rem 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
