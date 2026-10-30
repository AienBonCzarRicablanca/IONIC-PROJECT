<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Front Desk Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="load">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="dash-page">
        <div v-if="loading && !summary" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading dashboard...
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="summary">
          <div class="stat-grid">
            <router-link class="stat" to="appointments">
              <span class="stat-value">{{ summary.todayAppointments }}</span>
              <span>Appointments today</span>
            </router-link>
            <router-link class="stat" to="appointments">
              <span class="stat-value">{{ summary.pendingAppointments }}</span>
              <span>Awaiting confirmation</span>
            </router-link>
            <router-link class="stat" to="queue">
              <span class="stat-value">{{ summary.waitingInQueue }}</span>
              <span>Waiting in queue</span>
            </router-link>
            <router-link class="stat" to="queue">
              <span class="stat-value">{{ summary.inSession }}</span>
              <span>In session</span>
            </router-link>
            <router-link class="stat" to="billing">
              <span class="stat-value">{{ summary.unpaidInvoices }}</span>
              <span>Unpaid invoices</span>
            </router-link>
            <router-link class="stat" to="billing">
              <span class="stat-value">{{ peso(summary.outstandingBalance) }}</span>
              <span>Outstanding balance</span>
            </router-link>
          </div>

          <ion-card v-if="summary.lowStockItems.length" color="warning">
            <ion-card-content role="alert">
              <strong>Low stock:</strong> {{ summary.lowStockItems.join(', ') }}
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Next appointments today</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!summary.upcoming.length" class="state-message">Nothing scheduled.</p>
              <ion-list v-else lines="full">
                <ion-item v-for="appt in summary.upcoming" :key="appt.id" :detail="false">
                  <UserAvatar
                    slot="start"
                    :name="appt.patients?.full_name ?? 'Patient'"
                    :path="avatars.pathFor(appt.patients?.profile_id)"
                  />
                  <ion-label>
                    <h2>{{ timeFmt.format(new Date(appt.starts_at)) }} · {{ appt.patients?.full_name }}</h2>
                    <p>{{ appt.services?.name }}</p>
                  </ion-label>
                  <ion-chip :color="appt.status === 'pending' ? 'warning' : 'primary'">
                    {{ appt.status === 'pending' ? 'Pending' : 'Confirmed' }}
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
import { ref, watch } from 'vue'
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
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import { type DashboardSummary, getDashboardSummary } from '../../services/dashboard.service'

const { profile } = useAuth()
const avatars = useAvatarPaths()
const summary = ref<DashboardSummary | null>(null)
watch(summary, (value) => {
  void avatars.load(value?.upcoming.map((appointment) => appointment.patients?.profile_id) ?? [])
})
const loading = ref(false)
const loadError = ref('')
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    summary.value = await getDashboardSummary(clinicId)
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
  max-width: 1080px;
  padding: 4px 2px 12px;
}

.state-message {
  padding: 1.25rem 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
