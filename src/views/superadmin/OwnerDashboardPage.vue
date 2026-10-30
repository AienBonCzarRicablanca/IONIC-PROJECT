<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Clinic Dashboard</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="loading" @click="load">Refresh</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
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
            <router-link class="stat" to="/superadmin/patients">
              <span class="stat-value">{{ summary.totalPatients }}</span><span>Total patients</span>
            </router-link>
            <router-link class="stat" to="/superadmin/staff">
              <span class="stat-value">{{ summary.activeStaff }}</span><span>Active staff</span>
            </router-link>
            <router-link class="stat" to="/superadmin/appointments">
              <span class="stat-value">{{ summary.todayAppointments }}</span><span>Appointments today</span>
            </router-link>
            <router-link class="stat" to="/superadmin/billing">
              <span class="stat-value">{{ peso(summary.outstandingBalance) }}</span><span>Outstanding balance</span>
            </router-link>
            <router-link class="stat" to="/superadmin/billing">
              <span class="stat-value">{{ summary.openInvoices }}</span><span>Open invoices</span>
            </router-link>
            <router-link class="stat" to="/superadmin/inventory">
              <span class="stat-value">{{ summary.lowStockCount }}</span><span>Low-stock items</span>
            </router-link>
          </div>

          <ion-card>
            <ion-card-header><ion-card-title>Key operations</ion-card-title></ion-card-header>
            <ion-card-content>
              <p><strong>Pending appointments:</strong> {{ summary.pendingAppointments }}</p>
              <p><strong>Revenue this month:</strong> {{ peso(summary.revenueThisMonth) }}</p>
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
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../../composables/useAuth'
import { getOwnerDashboard, type OwnerDashboardSummary } from '../../services/owner.service'

const { profile } = useAuth()
const summary = ref<OwnerDashboardSummary | null>(null)
const loading = ref(false)
const loadError = ref('')
const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

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
.page { margin: 0 auto; max-width: 1080px; padding: 4px 2px 12px; }
.state-message { padding: 1.25rem 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
