<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Treatment History</ion-title>
        <ion-buttons slot="end"><NotificationButton /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading" class="state-message" role="status">Loading...</div>

        <template v-if="patient && !loadError">
          <h3 class="section">Visits and recommendations</h3>
          <p v-if="!records.length" class="state-message">No treatment records yet.</p>
          <ion-card v-for="r in records" :key="r.id">
            <ion-card-header>
              <ion-card-title>{{ r.diagnosis }}</ion-card-title>
              <ion-card-subtitle>{{ fmt.format(new Date(r.recorded_at)) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p v-if="r.procedures_performed"><strong>Procedure:</strong> {{ r.procedures_performed }}</p>
              <p v-if="r.recommendations"><strong>Recommendations:</strong> {{ r.recommendations }}</p>
              <p v-if="r.follow_up_instructions"><strong>Follow-up:</strong> {{ r.follow_up_instructions }}</p>
            </ion-card-content>
          </ion-card>

          <h3 class="section">Treatment plans</h3>
          <p v-if="!plans.length" class="state-message">No treatment plans.</p>
          <ion-card v-for="plan in plans" :key="plan.id">
            <ion-card-header>
              <ion-card-title>{{ plan.title }}</ion-card-title>
              <ion-card-subtitle>{{ plan.status.replace('_', ' ') }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="full">
                <ion-item v-for="item in plan.treatment_plan_items" :key="item.id">
                  <ion-label class="ion-text-wrap">
                    <h3>{{ item.description }}</h3>
                    <p>{{ item.status.replace('_', ' ') }}</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <h3 class="section">Notes from your dentist</h3>
          <p v-if="!notes.length" class="state-message">No shared notes.</p>
          <ion-card v-for="n in notes" :key="n.id">
            <ion-card-header><ion-card-subtitle>{{ fmt.format(new Date(n.created_at)) }}</ion-card-subtitle></ion-card-header>
            <ion-card-content>{{ n.content }}</ion-card-content>
          </ion-card>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent,
  IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar,
} from '@ionic/vue'
import NotificationButton from '../../components/common/NotificationButton.vue'
import { useMyPatient } from '../../composables/useMyPatient'
import * as clinical from '../../services/clinical.service'

const records = ref<clinical.DentalRecord[]>([])
const plans = ref<clinical.TreatmentPlan[]>([])
const notes = ref<clinical.ClinicalNote[]>([])
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

const { patient, loading, loadError } = useMyPatient(async (p) => {
  const [r, pl, n] = await Promise.all([
    clinical.listRecords(p.id),
    clinical.listPlans(p.id),
    clinical.listNotes(p.id),
  ])
  records.value = r
  plans.value = pl
  notes.value = n.filter((note) => note.is_shared_with_patient)
})
</script>

<style scoped>
.page { margin: 0 auto; max-width: 800px; padding: 0.5rem; }
.section { margin: 1rem 0.5rem 0; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
