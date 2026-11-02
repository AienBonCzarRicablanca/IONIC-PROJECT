<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Dentist Dashboard</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="dash-page">
        <PageAction :icon="refreshOutline" :disabled="loading" @click="load">Refresh</PageAction>
        <div v-if="loading && !loaded" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading...
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="loaded">
          <ion-card>
            <ion-card-header><ion-card-title>Current queue</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!queue.length" class="state-message">Nobody waiting for you.</p>
              <ion-list v-else lines="full">
                <ion-item v-for="entry in queue" :key="entry.id" :detail="false">
                  <UserAvatar
                    slot="start"
                    :name="entry.appointments?.patients?.full_name ?? 'Patient'"
                    :path="avatars.pathFor(entry.appointments?.patients?.profile_id)"
                  />
                  <ion-chip :color="entry.status === 'in_session' ? 'primary' : 'warning'">
                    #{{ entry.queue_number }}
                  </ion-chip>
                  <ion-label>
                    <h2>{{ entry.appointments?.patients?.full_name ?? 'Patient' }}</h2>
                    <p>{{ entry.status === 'in_session' ? 'In session' : 'Waiting' }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Today's appointments</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!today.length" class="state-message">No appointments today.</p>
              <ion-list v-else lines="full">
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
                    <p>{{ appt.services?.name }}</p>
                  </ion-label>
                  <ion-chip>{{ appt.status }}</ion-chip>
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
import { ref, watch } from 'vue'
import {
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
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { refreshOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
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
.dash-page {
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
