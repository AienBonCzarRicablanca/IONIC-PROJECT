<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dentist/patients" text="" aria-label="Back" />
        </ion-buttons>
        <ion-title>{{ patient?.full_name ?? 'Patient chart' }}</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="tab" aria-label="Chart section">
          <ion-segment-button value="odontogram"><ion-label>Odontogram</ion-label></ion-segment-button>
          <ion-segment-button value="records"><ion-label>Records</ion-label></ion-segment-button>
          <ion-segment-button value="notes"><ion-label>Notes</ion-label></ion-segment-button>
          <ion-segment-button value="plans"><ion-label>Plans</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="chart-page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading && !patient" class="state-message" role="status">Loading...</div>

        <template v-if="patient">
          <ion-card>
            <ion-card-header><ion-card-title>Patient details</ion-card-title></ion-card-header>
            <ion-card-content>
              <dl class="patient-facts">
                <div><dt>Age</dt><dd>{{ ageLabel(patient.date_of_birth) || '—' }}</dd></div>
                <div><dt>Sex</dt><dd>{{ sexLabel(patient.sex) }}</dd></div>
                <div><dt>Phone</dt><dd>{{ patient.contact_number || '—' }}</dd></div>
                <div><dt>Address</dt><dd>{{ patient.address || '—' }}</dd></div>
                <div><dt>Emergency contact</dt><dd>{{ emergencyContact(patient) }}</dd></div>
                <div><dt>Allergies</dt><dd>{{ patient.allergies || '—' }}</dd></div>
                <div><dt>Medical history</dt><dd>{{ patient.medical_history || '—' }}</dd></div>
              </dl>
            </ion-card-content>
          </ion-card>

          <!-- Odontogram -->
          <section v-if="tab === 'odontogram'" aria-label="Odontogram">
            <ion-segment v-model="dentition" aria-label="Dentition">
              <ion-segment-button value="adult"><ion-label>Adult</ion-label></ion-segment-button>
              <ion-segment-button value="primary"><ion-label>Primary</ion-label></ion-segment-button>
            </ion-segment>

            <div class="legend" aria-label="Legend">
              <span v-for="c in CONDITIONS" :key="c.value" class="legend-item">
                <span class="swatch" :class="`cond-${c.value}`" />{{ c.label }}
              </span>
            </div>

            <OdontogramChart
              :dentition="dentition"
              :teeth="teeth"
              :selected="selectedTooth"
              interactive
              @select="selectTooth"
            />

            <ion-card v-if="selectedTooth !== null">
              <ion-card-header>
                <ion-card-title>Tooth {{ toothLabel(selectedTooth) }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-select v-model="toothCondition" label="Condition" label-placement="stacked" interface="popover">
                  <ion-select-option v-for="c in CONDITIONS" :key="c.value" :value="c.value">
                    {{ c.label }}
                  </ion-select-option>
                </ion-select>
                <ion-textarea v-model="toothNotes" label="Notes" label-placement="stacked" :maxlength="500" />
                <ion-button :disabled="busy" @click="saveSelectedTooth">Save tooth</ion-button>
              </ion-card-content>
            </ion-card>
          </section>

          <!-- Dental records -->
          <section v-if="tab === 'records'" aria-label="Dental records">
            <ion-card>
              <ion-card-header><ion-card-title>New record</ion-card-title></ion-card-header>
              <ion-card-content>
                <ion-input v-model="record.diagnosis" label="Diagnosis *" label-placement="stacked" />
                <ion-textarea v-model="record.procedures_performed" label="Procedure performed" label-placement="stacked" />
                <ion-textarea v-model="record.observations" label="Observations" label-placement="stacked" />
                <ion-textarea v-model="record.recommendations" label="Recommendations" label-placement="stacked" />
                <ion-textarea v-model="record.follow_up_instructions" label="Follow-up instructions" label-placement="stacked" />
                <ion-button :disabled="busy || !record.diagnosis.trim()" @click="saveRecord">Save record</ion-button>
              </ion-card-content>
            </ion-card>
            <p v-if="!records.length" class="state-message">No records yet.</p>
            <ion-card v-for="r in records" :key="r.id">
              <ion-card-header>
                <ion-card-title>{{ r.diagnosis }}</ion-card-title>
                <ion-card-subtitle>{{ dateFmt.format(new Date(r.recorded_at)) }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p v-if="r.procedures_performed"><strong>Procedure:</strong> {{ r.procedures_performed }}</p>
                <p v-if="r.observations"><strong>Observations:</strong> {{ r.observations }}</p>
                <p v-if="r.recommendations"><strong>Recommendations:</strong> {{ r.recommendations }}</p>
                <p v-if="r.follow_up_instructions"><strong>Follow-up:</strong> {{ r.follow_up_instructions }}</p>
              </ion-card-content>
            </ion-card>
          </section>

          <!-- Clinical notes -->
          <section v-if="tab === 'notes'" aria-label="Clinical notes">
            <ion-card>
              <ion-card-header><ion-card-title>New note</ion-card-title></ion-card-header>
              <ion-card-content>
                <ion-textarea v-model="noteText" label="Note *" label-placement="stacked" :auto-grow="true" />
                <ion-checkbox v-model="noteShared">Share with patient</ion-checkbox>
                <div><ion-button :disabled="busy || !noteText.trim()" @click="saveNote">Save note</ion-button></div>
              </ion-card-content>
            </ion-card>
            <p v-if="!notes.length" class="state-message">No notes yet.</p>
            <ion-card v-for="n in notes" :key="n.id">
              <ion-card-header>
                <ion-card-subtitle>
                  {{ dateFmt.format(new Date(n.created_at)) }}
                  <span v-if="n.is_shared_with_patient"> · shared with patient</span>
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>{{ n.content }}</ion-card-content>
            </ion-card>
          </section>

          <!-- Treatment plans -->
          <section v-if="tab === 'plans'" aria-label="Treatment plans">
            <ion-card>
              <ion-card-header><ion-card-title>New treatment plan</ion-card-title></ion-card-header>
              <ion-card-content>
                <ion-input v-model="planTitle" label="Title *" label-placement="stacked" />
                <ion-textarea v-model="planNotes" label="Notes" label-placement="stacked" />
                <ion-button :disabled="busy || !planTitle.trim()" @click="savePlan">Create plan</ion-button>
              </ion-card-content>
            </ion-card>
            <p v-if="!plans.length" class="state-message">No treatment plans yet.</p>
            <ion-card v-for="plan in plans" :key="plan.id">
              <ion-card-header>
                <ion-card-title>{{ plan.title }}</ion-card-title>
                <ion-card-subtitle>
                  {{ STATUS_LABEL[plan.status] }} · {{ completedCount(plan) }}/{{ plan.treatment_plan_items.length }} done
                  · {{ peso(planTotal(plan)) }}
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p v-if="plan.notes">{{ plan.notes }}</p>
                <ion-list lines="full">
                  <ion-item v-for="item in plan.treatment_plan_items" :key="item.id">
                    <ion-label class="ion-text-wrap">
                      <h3>{{ item.description }}</h3>
                      <p>
                        <span v-if="item.tooth_number">Tooth {{ toothLabel(item.tooth_number) }} · </span>{{ peso(item.cost) }}
                      </p>
                    </ion-label>
                    <ion-select
                      slot="end"
                      :value="item.status"
                      aria-label="Item status"
                      interface="popover"
                      @ion-change="changeItem(item.id, $event.detail.value)"
                    >
                      <ion-select-option v-for="(label, key) in STATUS_LABEL" :key="key" :value="key">
                        {{ label }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </ion-list>

                <div class="item-form">
                  <ion-input v-model="itemForms[plan.id].description" label="Procedure" label-placement="stacked" />
                  <ion-input v-model.number="itemForms[plan.id].tooth" type="number" label="Tooth # (optional)" label-placement="stacked" />
                  <ion-input v-model.number="itemForms[plan.id].cost" type="number" label="Cost (PHP)" label-placement="stacked" />
                  <ion-button size="small" :disabled="busy || !itemForms[plan.id].description.trim()" @click="saveItem(plan.id)">
                    Add procedure
                  </ion-button>
                </div>

                <ion-button
                  v-if="plan.status !== 'completed' && plan.status !== 'cancelled'"
                  fill="outline"
                  size="small"
                  :disabled="busy"
                  @click="changePlan(plan.id, 'completed')"
                >
                  Mark plan completed
                </ion-button>
              </ion-card-content>
            </ion-card>
          </section>
        </template>
      </div>

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2600" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import OdontogramChart from '../../components/clinical/OdontogramChart.vue'
import { ageLabel, sexLabel } from '../../utils/patientDetails'
import { useAuth } from '../../composables/useAuth'
import * as clinical from '../../services/clinical.service'
import type { DentalCondition, TreatmentStatus } from '../../services/clinical.service'

const CONDITIONS: { value: DentalCondition; label: string }[] = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'decayed', label: 'Decayed' },
  { value: 'filled', label: 'Filled' },
  { value: 'missing', label: 'Missing' },
  { value: 'crown', label: 'Crown' },
  { value: 'root_canal', label: 'Root canal' },
]
const STATUS_LABEL: Record<TreatmentStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const route = useRoute()
const { profile, session } = useAuth()

const patientId = computed(() => String(route.params.id ?? ''))
const patient = ref<Awaited<ReturnType<typeof clinical.getPatient>>>(null)
const dentistId = ref<string | null>(null)
const tab = ref('odontogram')
const dentition = ref<'adult' | 'primary'>('adult')
const loading = ref(false)
const busy = ref(false)
const loadError = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')

const teeth = ref(new Map<number, clinical.OdontogramEntry>())
const selectedTooth = ref<number | null>(null)
const toothCondition = ref<DentalCondition>('healthy')
const toothNotes = ref('')

const records = ref<clinical.DentalRecord[]>([])
const notes = ref<clinical.ClinicalNote[]>([])
const plans = ref<clinical.TreatmentPlan[]>([])

const emptyRecord = () => ({
  diagnosis: '',
  procedures_performed: '',
  observations: '',
  recommendations: '',
  follow_up_instructions: '',
})
const record = reactive(emptyRecord())
const noteText = ref('')
const noteShared = ref(false)
const planTitle = ref('')
const planNotes = ref('')
const itemForms = reactive<Record<string, { description: string; tooth: number | null; cost: number | null }>>({})

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

function emergencyContact(person: { emergency_contact_name: string | null; emergency_contact_number: string | null }) {
  const details = [person.emergency_contact_name, person.emergency_contact_number].filter(Boolean)
  return details.length ? details.join(' · ') : '—'
}

function toothLabel(n: number) {
  return n > 32 ? String.fromCharCode(65 + (n - 51)) : String(n)
}
const conditionOf = (n: number): DentalCondition => teeth.value.get(n)?.condition ?? 'healthy'
const completedCount = (plan: clinical.TreatmentPlan) =>
  plan.treatment_plan_items.filter((i) => i.status === 'completed').length
const planTotal = (plan: clinical.TreatmentPlan) =>
  plan.treatment_plan_items.filter((i) => i.status !== 'cancelled').reduce((sum, i) => sum + i.cost, 0)

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function selectTooth(n: number) {
  selectedTooth.value = n
  toothCondition.value = conditionOf(n)
  toothNotes.value = teeth.value.get(n)?.notes ?? ''
}

async function loadClinical() {
  const id = patientId.value
  const [odonto, recs, nts, pls] = await Promise.all([
    clinical.listOdontogram(id),
    clinical.listRecords(id),
    clinical.listNotes(id),
    clinical.listPlans(id),
  ])
  teeth.value = new Map(odonto.map((entry) => [entry.tooth_number, entry]))
  records.value = recs
  notes.value = nts
  plans.value = pls
  for (const plan of pls) {
    itemForms[plan.id] ??= { description: '', tooth: null, cost: 0 }
  }
}

async function load() {
  const clinicId = profile.value?.clinicId
  const userId = session.value?.user.id
  if (!clinicId || !userId || !patientId.value) return
  loading.value = true
  loadError.value = ''
  try {
    patient.value = await clinical.getPatient(clinicId, patientId.value)
    if (!patient.value) throw new Error('Patient not found or you do not have access.')
    dentistId.value = await clinical.getMyDentistId(clinicId, userId)
    await loadClinical()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load the chart.'
  } finally {
    loading.value = false
  }
}

watch([() => profile.value?.clinicId, patientId], () => void load(), { immediate: true })

async function run(action: () => Promise<void>, success: string) {
  busy.value = true
  try {
    await action()
    await loadClinical()
    showToast(success)
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not save.')
  } finally {
    busy.value = false
  }
}

function context() {
  const clinicId = profile.value?.clinicId
  const userId = session.value?.user.id
  if (!clinicId || !userId) throw new Error('You are signed out.')
  return { clinicId, userId }
}

function requireDentist() {
  if (!dentistId.value) throw new Error('Only an active dentist account can add clinical entries.')
  return dentistId.value
}

const saveSelectedTooth = () =>
  run(async () => {
    const { clinicId, userId } = context()
    if (selectedTooth.value === null) return
    await clinical.saveTooth(clinicId, patientId.value, userId, selectedTooth.value, toothCondition.value, toothNotes.value)
  }, 'Tooth saved.')

const saveRecord = () =>
  run(async () => {
    const { clinicId } = context()
    await clinical.addRecord(clinicId, patientId.value, requireDentist(), { ...record })
    Object.assign(record, emptyRecord())
  }, 'Record saved.')

const saveNote = () =>
  run(async () => {
    const { clinicId } = context()
    await clinical.addNote(clinicId, patientId.value, requireDentist(), noteText.value, noteShared.value)
    noteText.value = ''
    noteShared.value = false
  }, 'Note saved.')

const savePlan = () =>
  run(async () => {
    const { clinicId } = context()
    await clinical.createPlan(clinicId, patientId.value, requireDentist(), planTitle.value, planNotes.value)
    planTitle.value = ''
    planNotes.value = ''
  }, 'Treatment plan created.')

const saveItem = (planId: string) =>
  run(async () => {
    const { clinicId } = context()
    const form = itemForms[planId]
    const tooth = form.tooth ? Number(form.tooth) : null
    if (tooth !== null && !((tooth >= 1 && tooth <= 32) || (tooth >= 51 && tooth <= 70))) {
      throw new Error('Tooth number must be 1-32 (adult) or 51-70 (primary).')
    }
    await clinical.addPlanItem(clinicId, planId, {
      description: form.description,
      tooth_number: tooth,
      cost: Math.max(0, Number(form.cost) || 0),
    })
    itemForms[planId] = { description: '', tooth: null, cost: 0 }
  }, 'Procedure added.')

const changeItem = (itemId: string, status: TreatmentStatus) =>
  run(async () => {
    await clinical.setItemStatus(context().clinicId, itemId, status)
  }, 'Progress updated.')

const changePlan = (planId: string, status: TreatmentStatus) =>
  run(async () => {
    await clinical.setPlanStatus(context().clinicId, planId, status)
  }, 'Plan updated.')
</script>

<style scoped>
.patient-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin: 0;
}

.patient-facts dt {
  margin-bottom: 2px;
  color: var(--muted);
  font-size: 12px;
}

.patient-facts dd {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .patient-facts {
    grid-template-columns: 1fr;
  }
}

.chart-page {
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0;
}

.legend-item {
  align-items: center;
  display: inline-flex;
  font-size: 0.85rem;
  gap: 0.3rem;
}

.swatch {
  border: 1px solid #5f7d8c;
  border-radius: 3px;
  display: inline-block;
  height: 14px;
  width: 14px;
}

.swatch.cond-healthy { background: #fffdf8; }
.swatch.cond-decayed { background: #f3b4b4; }
.swatch.cond-filled { background: #a9d4f8; }
.swatch.cond-missing { background: #d5dee2; }
.swatch.cond-crown { background: #ffe08a; }
.swatch.cond-root_canal { background: #d7b4e6; }

.item-form {
  border-top: 1px solid #ddd;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
}
</style>
