<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>My Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="reload">Refresh</ion-button>
          <NotificationButton />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading && !patient" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading...
        </div>

        <template v-if="patient && !loadError">
          <h2 class="greeting">Hello, {{ patient.full_name }}</h2>
          <div class="stat-grid">
            <router-link class="stat" to="appointments">
              <span class="stat-value">{{ upcoming.length }}</span><span>Upcoming appointments</span>
            </router-link>
            <router-link class="stat" to="payments">
              <span class="stat-value">{{ peso(balance) }}</span><span>Outstanding balance</span>
            </router-link>
            <router-link class="stat" to="notifications">
              <span class="stat-value">{{ unread }}</span><span>Unread notices</span>
            </router-link>
          </div>

          <ion-card>
            <ion-card-header><ion-card-title>Next appointment</ion-card-title></ion-card-header>
            <ion-card-content>
              <p v-if="!upcoming.length">No upcoming appointments.
                <router-link to="appointments">Book one</router-link>.</p>
              <p v-else>
                <strong>{{ fmt.format(new Date(upcoming[0].starts_at)) }}</strong><br />
                {{ upcoming[0].services?.name }} · {{ upcoming[0].status }}
              </p>
            </ion-card-content>
          </ion-card>

          <ion-card v-if="latest">
            <ion-card-header><ion-card-title>Latest treatment summary</ion-card-title></ion-card-header>
            <ion-card-content>
              <p><strong>{{ latest.diagnosis }}</strong> · {{ fmt.format(new Date(latest.recorded_at)) }}</p>
              <p v-if="latest.recommendations">Recommendation: {{ latest.recommendations }}</p>
              <p v-if="latest.follow_up_instructions">Follow-up: {{ latest.follow_up_instructions }}</p>
            </ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent,
  IonHeader, IonMenuButton, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import NotificationButton from '../../components/common/NotificationButton.vue'
import { useAuth } from '../../composables/useAuth'
import { useMyPatient } from '../../composables/useMyPatient'
import * as portal from '../../services/portal.service'
import { listRecords, type DentalRecord } from '../../services/clinical.service'

const { session } = useAuth()
const appointments = ref<portal.MyAppointment[]>([])
const balance = ref(0)
const unread = ref(0)
const latest = ref<DentalRecord | null>(null)
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const peso = (v: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v)

const upcoming = computed(() =>
  appointments.value
    .filter((a) => ['pending', 'confirmed'].includes(a.status) && new Date(a.starts_at) > new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
)

const { patient, loading, loadError, reload } = useMyPatient(async (p) => {
  const userId = session.value?.user.id ?? ''
  const [appts, invoices, notices, records] = await Promise.all([
    portal.listMyAppointments(p.id),
    portal.listMyInvoices(p.id),
    portal.listMyNotifications(userId),
    listRecords(p.id),
  ])
  appointments.value = appts
  balance.value = invoices.reduce((sum, i) => sum + portal.invoiceBalance(i), 0)
  unread.value = notices.filter((n) => !n.read_at).length
  latest.value = records[0] ?? null
})
</script>

<style scoped>
.page { margin: 0 auto; max-width: 900px; padding: 4px 2px 12px; }
.state-message { padding: 1.25rem 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
