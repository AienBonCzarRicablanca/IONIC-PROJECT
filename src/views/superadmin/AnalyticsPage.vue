<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Revenue Analytics</ion-title>
        <ion-buttons slot="end"><ion-button :disabled="loading" @click="load">Refresh</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loading" class="state-message" role="status">Loading analytics...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>

        <ion-card v-if="points.length">
          <ion-card-header><ion-card-title>Confirmed revenue (last 6 months)</ion-card-title></ion-card-header>
          <ion-card-content>
            <div class="chart" aria-label="Revenue chart">
              <div v-for="point in points" :key="point.month" class="bar-wrap">
                <span class="bar-value">{{ peso(point.revenue) }}</span>
                <div class="bar" :style="{ height: `${Math.max(18, (point.revenue / max) * 100)}%` }" />
                <span class="month-label">{{ point.month }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <template v-if="operational">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Appointment outcomes (last 6 months)</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="outcome-grid">
                <div v-for="outcome in operational.appointmentOutcomes" :key="outcome.status" class="outcome">
                  <strong>{{ outcome.count }}</strong>
                  <span>{{ label(outcome.status) }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Most requested services</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-list v-if="operational.servicePopularity.length" lines="full">
                <ion-item v-for="service in operational.servicePopularity" :key="service.name">
                  <ion-label>{{ service.name }}</ion-label>
                  <ion-note slot="end">{{ service.appointments }} appointments</ion-note>
                </ion-item>
              </ion-list>
              <p v-else class="empty-message">No eligible appointments in this period.</p>
              <p class="help-text">Cancelled and no-show appointments are excluded.</p>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Dentist activity</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-list v-if="operational.dentistStatistics.length" lines="full">
                <ion-item v-for="dentist in operational.dentistStatistics" :key="dentist.id">
                  <ion-label>
                    <h3>{{ dentist.name }}</h3>
                    <p>{{ dentist.completedAppointments }} completed · {{ dentist.noShowAppointments }} no-show</p>
                  </ion-label>
                  <ion-note slot="end">{{ dentist.appointments }} total</ion-note>
                </ion-item>
              </ion-list>
              <p v-else class="empty-message">No appointments in this period.</p>
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
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../../composables/useAuth'
import {
  getOwnerOperationalAnalytics,
  getRevenueAnalytics,
  type AppointmentStatus,
  type OwnerOperationalAnalytics,
  type RevenuePoint,
} from '../../services/owner.service'

const { profile } = useAuth()
const points = ref<RevenuePoint[]>([])
const operational = ref<OwnerOperationalAnalytics | null>(null)
const loading = ref(false)
const loadError = ref('')

const max = computed(() => Math.max(1, ...points.value.map((p) => p.revenue)))
const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
const label = (status: AppointmentStatus) => status.replace('_', ' ')

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    const [revenue, operations] = await Promise.all([
      getRevenueAnalytics(clinicId),
      getOwnerOperationalAnalytics(clinicId),
    ])
    points.value = revenue
    operational.value = operations
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load analytics.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })
</script>

<style scoped>
.page { margin: 0 auto; max-width: 1000px; padding: 0.5rem; }
.chart { align-items: end; display: flex; gap: 0.75rem; height: 220px; margin-top: 0.5rem; }
.bar-wrap { align-items: center; display: flex; flex: 1; flex-direction: column; gap: 0.35rem; height: 100%; justify-content: end; }
.bar { background: linear-gradient(180deg, var(--ion-color-primary), #5db7d4); border-radius: 8px 8px 0 0; width: 100%; min-height: 18px; }
.bar-value { font-size: 0.7rem; }
.month-label { font-size: 0.72rem; }
.outcome-grid { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
.outcome { background: var(--ion-color-light); border-radius: 10px; display: grid; gap: 0.25rem; padding: 0.8rem; text-align: center; text-transform: capitalize; }
.outcome strong { font-size: 1.4rem; }
.help-text, .empty-message { color: var(--ion-color-medium); margin: 0.75rem 0 0; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
