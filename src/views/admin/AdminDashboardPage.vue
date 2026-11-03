<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Front Desk Dashboard</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="dash-page">
        <DashHero
          :name="profile?.fullName || ''"
          role="Front desk"
          :summary="summaryLine"
          :refreshing="loading"
          @refresh="load"
        />

        <div v-if="loading && !summary" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading the floor…
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="summary">
          <p v-if="summary.lowStockItems.length" class="dash-alert" role="alert">
            Low stock: {{ summary.lowStockItems.join(', ') }}.
            <router-link to="inventory">Review inventory</router-link>
          </p>

          <div class="stat-grid">
            <router-link class="stat" to="appointments">
              <ion-icon :icon="calendarOutline" />
              <span class="stat-value">{{ summary.todayAppointments }}</span>
              <span>Visits today</span>
            </router-link>
            <router-link class="stat" to="appointments">
              <ion-icon :icon="hourglassOutline" />
              <span class="stat-value">{{ summary.pendingAppointments }}</span>
              <span>Need confirmation</span>
            </router-link>
            <router-link class="stat" to="queue">
              <ion-icon :icon="listOutline" />
              <span class="stat-value">{{ summary.waitingInQueue }}</span>
              <span>Waiting now</span>
            </router-link>
            <router-link class="stat" to="queue">
              <ion-icon :icon="medkitOutline" />
              <span class="stat-value">{{ summary.inSession }}</span>
              <span>In the chair</span>
            </router-link>
            <router-link class="stat" to="billing">
              <ion-icon :icon="receiptOutline" />
              <span class="stat-value">{{ summary.unpaidInvoices }}</span>
              <span>Unpaid invoices</span>
            </router-link>
            <router-link class="stat" to="billing">
              <ion-icon :icon="cashOutline" />
              <span class="stat-value">{{ peso(summary.outstandingBalance) }}</span>
              <span>Still to collect</span>
            </router-link>
          </div>

          <section class="dash-panel">
            <h3>Today's schedule</h3>
            <p v-if="!summary.upcoming.length" class="dash-empty">
              No confirmed or pending visits left today.
              <router-link to="appointments">Open the calendar</router-link>.
            </p>
            <ion-list v-else lines="none">
              <ion-item v-for="appt in summary.upcoming" :key="appt.id" :detail="false">
                <UserAvatar
                  slot="start"
                  :name="appt.patients?.full_name ?? 'Patient'"
                  :path="avatars.pathFor(appt.patients?.profile_id)"
                />
                <ion-label>
                  <h2>{{ timeFmt.format(new Date(appt.starts_at)) }} · {{ appt.patients?.full_name }}</h2>
                  <p>{{ appt.services?.name || 'Appointment' }}</p>
                </ion-label>
                <ion-chip :color="appt.status === 'pending' ? 'warning' : 'primary'">
                  {{ appt.status === 'pending' ? 'Pending' : 'Confirmed' }}
                </ion-chip>
              </ion-item>
            </ion-list>
          </section>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButtons, IonChip, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonMenuButton, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import {
  calendarOutline, cashOutline, hourglassOutline, listOutline, medkitOutline, receiptOutline,
} from 'ionicons/icons'
import DashHero from '../../components/common/DashHero.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
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
const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

const summaryLine = computed(() => {
  if (!summary.value) return 'Checking today’s appointments, queue, and billing.'
  const floor = summary.value
  return `${floor.todayAppointments} visits today, ${floor.pendingAppointments} still need confirmation, and ${floor.waitingInQueue} ${floor.waitingInQueue === 1 ? 'person is' : 'people are'} waiting.`
})

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
.state-message { padding: 1.25rem 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
