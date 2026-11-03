<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Clinic Dashboard</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="dash-page">
        <DashHero
          :name="profile?.fullName || ''"
          role="Clinic owner"
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
          Loading the clinic…
        </div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <template v-if="summary">
          <div class="dash-facts">
            <router-link class="dash-fact" to="/superadmin/analytics">
              <span>Collected this month</span>
              <strong>{{ peso(summary.revenueThisMonth) }}</strong>
            </router-link>
            <router-link class="dash-fact" to="/superadmin/appointments">
              <span>Still pending</span>
              <strong>{{ summary.pendingAppointments }}</strong>
            </router-link>
          </div>

          <div class="stat-grid">
            <router-link class="stat" to="/superadmin/patients">
              <ion-icon :icon="peopleOutline" />
              <span class="stat-value">{{ summary.totalPatients }}</span>
              <span>Patients</span>
            </router-link>
            <router-link class="stat" to="/superadmin/staff">
              <ion-icon :icon="shieldCheckmarkOutline" />
              <span class="stat-value">{{ summary.activeStaff }}</span>
              <span>Active staff</span>
            </router-link>
            <router-link class="stat" to="/superadmin/appointments">
              <ion-icon :icon="calendarOutline" />
              <span class="stat-value">{{ summary.todayAppointments }}</span>
              <span>Visits today</span>
            </router-link>
            <router-link class="stat" to="/superadmin/billing">
              <ion-icon :icon="cashOutline" />
              <span class="stat-value">{{ peso(summary.outstandingBalance) }}</span>
              <span>Still to collect</span>
            </router-link>
            <router-link class="stat" to="/superadmin/billing">
              <ion-icon :icon="receiptOutline" />
              <span class="stat-value">{{ summary.openInvoices }}</span>
              <span>Open invoices</span>
            </router-link>
            <router-link class="stat" to="/superadmin/inventory">
              <ion-icon :icon="cubeOutline" />
              <span class="stat-value">{{ summary.lowStockCount }}</span>
              <span>Low-stock items</span>
            </router-link>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import {
  calendarOutline, cashOutline, cubeOutline, peopleOutline, receiptOutline, shieldCheckmarkOutline,
} from 'ionicons/icons'
import DashHero from '../../components/common/DashHero.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import { useAuth } from '../../composables/useAuth'
import { getOwnerDashboard, type OwnerDashboardSummary } from '../../services/owner.service'

const { profile } = useAuth()
const summary = ref<OwnerDashboardSummary | null>(null)
const loading = ref(false)
const loadError = ref('')
const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

const summaryLine = computed(() => {
  if (!summary.value) return 'Checking patients, staff, and this month’s collections.'
  return `${peso(summary.value.revenueThisMonth)} collected this month, with ${summary.value.todayAppointments} visits on today’s book.`
})

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    summary.value = await getOwnerDashboard(clinicId)
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
.dash-facts { margin-bottom: 14px; }
.dash-fact { text-decoration: none; }
</style>
