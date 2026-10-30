<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>My Dental Chart</ion-title>
        <ion-buttons slot="end"><NotificationButton /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading" class="state-message" role="status">Loading...</div>

        <template v-if="patient && !loadError">
          <ion-segment v-model="dentition" aria-label="Dentition">
            <ion-segment-button value="adult"><ion-label>Adult</ion-label></ion-segment-button>
            <ion-segment-button value="primary"><ion-label>Primary</ion-label></ion-segment-button>
          </ion-segment>
          <div class="legend" aria-label="Legend">
            <span v-for="c in CONDITIONS" :key="c.value" class="legend-item">
              <span class="swatch" :class="`cond-${c.value}`" />{{ c.label }}
            </span>
          </div>
          <OdontogramChart :dentition="dentition" :teeth="teeth" />
          <p v-if="!teeth.size" class="state-message">Your dentist has not recorded any tooth conditions yet.</p>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButtons, IonContent, IonHeader, IonLabel, IonMenuButton, IonPage, IonSegment, IonSegmentButton,
  IonTitle, IonToolbar,
} from '@ionic/vue'
import NotificationButton from '../../components/common/NotificationButton.vue'
import OdontogramChart from '../../components/clinical/OdontogramChart.vue'
import { useMyPatient } from '../../composables/useMyPatient'
import { listOdontogram, type DentalCondition, type OdontogramEntry } from '../../services/clinical.service'

const CONDITIONS: { value: DentalCondition; label: string }[] = [
  { value: 'healthy', label: 'Healthy' }, { value: 'decayed', label: 'Decayed' }, { value: 'filled', label: 'Filled' },
  { value: 'missing', label: 'Missing' }, { value: 'crown', label: 'Crown' }, { value: 'root_canal', label: 'Root canal' },
]
const dentition = ref<'adult' | 'primary'>('adult')
const teeth = ref(new Map<number, OdontogramEntry>())

const { patient, loading, loadError } = useMyPatient(async (p) => {
  teeth.value = new Map((await listOdontogram(p.id)).map((e) => [e.tooth_number, e]))
})
</script>

<style scoped>
.page { margin: 0 auto; max-width: 900px; padding: 0.5rem; }
.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0.75rem 0; }
.legend-item { align-items: center; display: inline-flex; font-size: 0.85rem; gap: 0.3rem; }
.swatch { border: 1px solid #5f7d8c; border-radius: 3px; display: inline-block; height: 14px; width: 14px; }
.swatch.cond-healthy { background: #fffdf8; }
.swatch.cond-decayed { background: #f3b4b4; }
.swatch.cond-filled { background: #a9d4f8; }
.swatch.cond-missing { background: #d5dee2; }
.swatch.cond-crown { background: #ffe08a; }
.swatch.cond-root_canal { background: #d7b4e6; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
