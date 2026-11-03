<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>My Dashboard</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="dash-page">
        <DashHero
          :name="patient?.full_name || profile?.fullName || ''"
          role="Patient"
          :summary="summaryLine"
          :refreshing="loading"
          @refresh="reload"
        />

        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading && !patient" class="state-message" role="status">
          <div class="load-bars" aria-hidden="true">
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
            <ion-skeleton-text animated />
          </div>
          Loading your visits…
        </div>

        <template v-if="patient && !loadError">
          <div class="stat-grid">
            <router-link class="stat" to="appointments">
              <ion-icon :icon="calendarOutline" />
              <span class="stat-value">{{ upcoming.length }}</span>
              <span>Upcoming visits</span>
            </router-link>
            <router-link class="stat" to="payments">
              <ion-icon :icon="cardOutline" />
              <span class="stat-value">{{ peso(balance) }}</span>
              <span>Left to pay</span>
            </router-link>
            <router-link class="stat" to="notifications">
              <ion-icon :icon="notificationsOutline" />
              <span class="stat-value">{{ unread }}</span>
              <span>Unread notices</span>
            </router-link>
          </div>

          <div class="dash-split">
            <section class="dash-panel">
              <h3>Next visit</h3>
              <p v-if="!nextVisit" class="dash-empty">
                Nothing is booked yet. <router-link to="appointments">Choose a time</router-link>.
              </p>
              <template v-else>
                <p class="dash-visit-time">{{ fmt.format(new Date(nextVisit.starts_at)) }}</p>
                <p class="dash-visit-meta">{{ nextVisit.services?.name || 'Appointment' }} · {{ label(nextVisit.status) }}</p>
                <p v-for="visit in laterVisits" :key="visit.id" class="dash-later">
                  <span>{{ shortFmt.format(new Date(visit.starts_at)) }}</span>
                  <span>{{ visit.services?.name || 'Appointment' }}</span>
                </p>
              </template>
            </section>

            <section class="dash-panel">
              <h3>Latest note from the clinic</h3>
              <p v-if="!latest" class="dash-empty">
                No treatment notes yet. <router-link to="treatments">See the care we offer</router-link>.
              </p>
              <template v-else>
                <p class="dash-visit-time">{{ latest.diagnosis }}</p>
                <p class="dash-visit-meta">{{ fmt.format(new Date(latest.recorded_at)) }}</p>
                <p v-if="latest.recommendations" class="dash-visit-meta">{{ latest.recommendations }}</p>
                <p v-if="latest.follow_up_instructions" class="dash-visit-meta">Follow-up: {{ latest.follow_up_instructions }}</p>
              </template>
            </section>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonPage, IonSkeletonText, IonTitle, IonToolbar,
} from '@ionic/vue'
import { calendarOutline, cardOutline, notificationsOutline } from 'ionicons/icons'
import DashHero from '../../components/common/DashHero.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import { useAuth } from '../../composables/useAuth'
import { useMyPatient } from '../../composables/useMyPatient'
import * as portal from '../../services/portal.service'
import { listRecords, type DentalRecord } from '../../services/clinical.service'

const { profile, session } = useAuth()
const appointments = ref<portal.MyAppointment[]>([])
const balance = ref(0)
const unread = ref(0)
const latest = ref<DentalRecord | null>(null)
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const peso = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
const label = (status: string) => status.replaceAll('_', ' ')

const upcoming = computed(() =>
  appointments.value
    .filter((visit) => ['pending', 'confirmed'].includes(visit.status) && new Date(visit.starts_at) > new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
)
const nextVisit = computed(() => upcoming.value[0] ?? null)
const laterVisits = computed(() => upcoming.value.slice(1, 4))
const summaryLine = computed(() => {
  if (!nextVisit.value) return 'You have no upcoming visits. Book one when you are ready.'
  const service = nextVisit.value.services?.name || 'your appointment'
  return `Next up is ${service} on ${fmt.format(new Date(nextVisit.value.starts_at))}.`
})

const { patient, loading, loadError, reload } = useMyPatient(async (person) => {
  const userId = session.value?.user.id ?? ''
  const [appts, invoices, notices, records] = await Promise.all([
    portal.listMyAppointments(person.id),
    portal.listMyInvoices(person.id),
    portal.listMyNotifications(userId),
    listRecords(person.id),
  ])
  appointments.value = appts
  balance.value = invoices.reduce((sum, invoice) => sum + portal.invoiceBalance(invoice), 0)
  unread.value = notices.filter((notice) => !notice.read_at).length
  latest.value = records[0] ?? null
})
</script>

<style scoped>
.state-message { padding: 1.25rem 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
