<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Treatments</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <header class="intro">
          <h2>Care we offer</h2>
          <p>The same treatments you see on the website. Open one to read what a visit is like.</p>
        </header>

        <div class="catalog">
          <button
            v-for="service in CLINIC_SERVICES"
            :key="service.title"
            type="button"
            class="service-card"
            @click="selected = service"
          >
            <span class="service-photo">
              <img :src="`/assets/images/services/${service.image}`" :alt="service.imageAlt" />
              <span class="service-badge" aria-hidden="true"><ion-icon :icon="service.icon" /></span>
            </span>
            <span class="service-copy">
              <strong>{{ service.title }}</strong>
              <span>{{ service.description }}</span>
              <em>View details</em>
            </span>
          </button>
        </div>

        <section class="history" aria-labelledby="history-heading">
          <div class="history-head">
            <h2 id="history-heading">Your history</h2>
            <p>Visits, plans, and notes your dentist has shared with you.</p>
          </div>

          <div v-if="loadError" class="empty error-message" role="alert">{{ loadError }}</div>
          <div v-else-if="loading" class="empty" role="status">Loading your records…</div>
          <template v-else-if="patient">
            <ion-segment v-model="historyTab" aria-label="Treatment history">
              <ion-segment-button value="visits"><ion-label>Visits</ion-label></ion-segment-button>
              <ion-segment-button value="plans"><ion-label>Plans</ion-label></ion-segment-button>
              <ion-segment-button value="notes"><ion-label>Notes</ion-label></ion-segment-button>
            </ion-segment>

            <div v-if="historyTab === 'visits'" class="history-list">
              <p v-if="!records.length" class="empty">No treatment records yet.</p>
              <article v-for="record in records" :key="record.id" class="record">
                <p class="record-date">{{ fmt.format(new Date(record.recorded_at)) }}</p>
                <h3>{{ record.diagnosis }}</h3>
                <p v-if="record.procedures_performed"><strong>Procedure.</strong> {{ record.procedures_performed }}</p>
                <p v-if="record.recommendations"><strong>Recommendations.</strong> {{ record.recommendations }}</p>
                <p v-if="record.follow_up_instructions"><strong>Follow-up.</strong> {{ record.follow_up_instructions }}</p>
              </article>
            </div>

            <div v-else-if="historyTab === 'plans'" class="history-list">
              <p v-if="!plans.length" class="empty">No treatment plans.</p>
              <article v-for="plan in plans" :key="plan.id" class="record">
                <p class="record-date">{{ plan.status.replaceAll('_', ' ') }}</p>
                <h3>{{ plan.title }}</h3>
                <ul v-if="plan.treatment_plan_items.length">
                  <li v-for="item in plan.treatment_plan_items" :key="item.id">
                    <span>{{ item.description }}</span>
                    <em>{{ item.status.replaceAll('_', ' ') }}</em>
                  </li>
                </ul>
              </article>
            </div>

            <div v-else class="history-list">
              <p v-if="!notes.length" class="empty">No shared notes.</p>
              <article v-for="note in notes" :key="note.id" class="record">
                <p class="record-date">{{ fmt.format(new Date(note.created_at)) }}</p>
                <p>{{ note.content }}</p>
              </article>
            </div>
          </template>
        </section>
      </div>

      <ion-modal :is-open="!!selected" class="detail-modal" @did-dismiss="selected = null">
        <ion-content v-if="selected" class="detail">
          <div class="detail-photo">
            <img :src="`/assets/images/services/${selected.image}`" :alt="selected.imageAlt" />
            <ion-button fill="clear" class="detail-close" aria-label="Close details" @click="selected = null">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </div>
          <div class="detail-body">
            <p class="detail-kicker">Harbor Dental</p>
            <h2>{{ selected.title }}</h2>
            <p class="detail-lead">{{ selected.about }}</p>
            <div class="detail-facts">
              <p><span>Visit</span>{{ selected.visit }}</p>
              <p><span>Comfort</span>{{ selected.comfort }}</p>
            </div>
            <h3>What to expect</h3>
            <ul>
              <li v-for="step in selected.expect" :key="step">{{ step }}</li>
            </ul>
            <ion-button expand="block" router-link="/patient/appointments" @click="selected = null">
              Book a visit
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonLabel, IonMenuButton, IonModal,
  IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import { CLINIC_SERVICES, type ClinicService } from '../../content/clinicServices'
import { useMyPatient } from '../../composables/useMyPatient'
import * as clinical from '../../services/clinical.service'

const records = ref<clinical.DentalRecord[]>([])
const plans = ref<clinical.TreatmentPlan[]>([])
const notes = ref<clinical.ClinicalNote[]>([])
const historyTab = ref<'visits' | 'plans' | 'notes'>('visits')
const selected = ref<ClinicService | null>(null)
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

const { patient, loading, loadError } = useMyPatient(async (p) => {
  const [recordRows, planRows, noteRows] = await Promise.all([
    clinical.listRecords(p.id),
    clinical.listPlans(p.id),
    clinical.listNotes(p.id),
  ])
  records.value = recordRows
  plans.value = planRows
  notes.value = noteRows.filter((note) => note.is_shared_with_patient)
})
</script>

<style scoped>
.page { margin: 0 auto; max-width: 980px; padding: 8px 2px 28px; }
.intro h2, .history-head h2, .detail-body h2 {
  margin: 0;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.03em;
}
.intro h2 { font-size: 1.7rem; }
.intro p, .history-head p { margin: 6px 0 0; color: var(--muted); }
.catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.service-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  text-align: left;
  color: inherit;
  font: inherit;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}
.service-card:hover, .service-card:focus-visible {
  border-color: var(--clinic-blue);
  box-shadow: var(--shadow-md);
}
.service-photo { position: relative; display: block; height: 148px; background: var(--accent-soft); }
.service-photo img, .detail-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.service-badge {
  position: absolute;
  right: 12px;
  bottom: -14px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--clinic-blue);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  font-size: 18px;
}
.service-copy { display: grid; gap: 6px; padding: 22px 14px 14px; }
.service-copy strong { color: var(--clinic-ink); font-size: 1.05rem; }
.service-copy span { color: var(--muted); font-size: 0.86rem; line-height: 1.45; }
.service-copy em { color: var(--clinic-blue); font-style: normal; font-size: 0.78rem; font-weight: 750; }
.history {
  margin-top: 28px;
  padding: 18px 16px 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}
.history-head h2 { font-size: 1.45rem; }
.history ion-segment { margin-top: 14px; }
.history-list { display: grid; gap: 10px; padding: 14px 0 10px; }
.record {
  padding: 14px;
  background: var(--canvas);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
.record-date {
  margin: 0 0 4px;
  color: var(--clinic-blue);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.record h3 { margin: 0 0 8px; color: var(--clinic-ink); font-size: 1.05rem; }
.record p { margin: 6px 0 0; color: var(--muted); }
.record strong { color: var(--clinic-ink); font-weight: 700; }
.record ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
.record li { display: flex; justify-content: space-between; gap: 12px; color: var(--clinic-ink); }
.record em { color: var(--muted); font-style: normal; font-size: 0.86rem; text-transform: capitalize; }
.empty { padding: 18px 4px; text-align: center; color: var(--muted); }
.error-message { color: var(--ion-color-danger); }
.detail-modal {
  --width: min(560px, calc(100% - 24px));
  --height: min(760px, calc(100% - 24px));
  --border-radius: 22px;
}
.detail-photo { position: relative; height: 220px; background: var(--accent-soft); }
.detail-close {
  position: absolute;
  top: 10px;
  right: 10px;
  --background: var(--surface);
  --color: var(--clinic-ink);
  --border-radius: 999px;
  width: 40px;
  height: 40px;
  margin: 0;
}
.detail-body { padding: 18px 18px 22px; }
.detail-kicker {
  margin: 0;
  color: var(--clinic-blue);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.detail-body h2 { margin-top: 4px; font-size: 1.8rem; }
.detail-lead { color: var(--muted); line-height: 1.55; }
.detail-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-facts p {
  margin: 0;
  padding: 12px;
  background: var(--accent-soft);
  border-radius: var(--radius-md);
  color: var(--clinic-ink);
}
.detail-facts span, .detail-body h3 {
  display: block;
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.detail-body h3 { margin: 16px 0 8px; }
.detail-body ul { margin: 0 0 18px; padding-left: 18px; color: var(--clinic-ink); }
.detail-body li + li { margin-top: 6px; }
</style>
