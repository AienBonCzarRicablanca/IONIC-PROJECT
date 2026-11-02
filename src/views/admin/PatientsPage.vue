<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Patient Management</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="patients-content">
      <div class="patients-page">
        <PageAction :icon="personAddOutline" @click="openNewPatient">Add patient</PageAction>
        <ion-card class="patient-tools">
          <ion-card-content>
            <ion-searchbar
              v-model="search"
              aria-label="Search patients by name"
              placeholder="Search patient names"
              :debounce="250"
            />
            <ion-segment v-model="sourceFilter" aria-label="Filter patients">
              <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
              <ion-segment-button value="portal"><ion-label>Portal</ion-label></ion-segment-button>
              <ion-segment-button value="walk-in"><ion-label>Walk-in</ion-label></ion-segment-button>
            </ion-segment>
            <p class="result-count">{{ filteredPatients.length }} patients on this page</p>
          </ion-card-content>
        </ion-card>

        <div class="patients-grid">
          <ion-card class="patient-list-card">
            <ion-card-header>
              <ion-card-title>Patients</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div v-if="loading" class="state-message" role="status">Loading patients...</div>
              <div v-else-if="loadError" class="state-message error-message" role="alert">
                {{ loadError }}
              </div>
              <div v-else-if="!filteredPatients.length" class="state-message">
                No patients match this search.
              </div>
              <ion-list v-else lines="full">
                <ion-item
                  v-for="patient in filteredPatients"
                  :key="patient.id"
                  button
                  :detail="false"
                  :class="{ 'selected-patient': selectedPatient?.id === patient.id }"
                  @click="selectPatient(patient)"
                >
                  <UserAvatar
                    slot="start"
                    :name="patient.full_name"
                    :path="avatars.pathFor(patient.profile_id)"
                  />
                  <ion-label>
                    <h2>{{ patient.full_name }}</h2>
                    <p>{{ listMeta(patient) }}</p>
                  </ion-label>
                  <ion-chip v-if="patient.profile_id" color="primary">Portal</ion-chip>
                  <ion-chip v-else color="medium">Walk-in</ion-chip>
                </ion-item>
              </ion-list>
              <div class="pagination">
                <ion-button fill="clear" :disabled="page === 0 || loading" @click="changePage(-1)">
                  Previous
                </ion-button>
                <span>Page {{ page + 1 }} of {{ totalPages }}</span>
                <ion-button
                  fill="clear"
                  :disabled="page + 1 >= totalPages || loading"
                  @click="changePage(1)"
                >
                  Next
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="patient-details-card">
            <ion-card-header>
              <div class="detail-heading">
                <UserAvatar
                  v-if="selectedPatient"
                  :name="selectedPatient.full_name"
                  :path="avatars.pathFor(selectedPatient.profile_id)"
                />
                <div>
                  <ion-card-subtitle>Patient profile</ion-card-subtitle>
                  <ion-card-title>{{ selectedPatient?.full_name || 'Select a patient' }}</ion-card-title>
                </div>
                <ion-button
                  v-if="selectedPatient"
                  fill="outline"
                  @click="openEditPatient"
                >
                  Edit
                </ion-button>
              </div>
            </ion-card-header>
            <ion-card-content>
              <template v-if="selectedPatient">
                <dl class="profile-grid">
                  <div><dt>Date of birth</dt><dd>{{ birthSummary(selectedPatient.date_of_birth) }}</dd></div>
                  <div><dt>Sex</dt><dd>{{ sexLabel(selectedPatient.sex) }}</dd></div>
                  <div><dt>Phone</dt><dd>{{ selectedPatient.contact_number || '—' }}</dd></div>
                  <div><dt>Email</dt><dd>{{ selectedPatient.email || '—' }}</dd></div>
                  <div><dt>Address</dt><dd>{{ selectedPatient.address || '—' }}</dd></div>
                  <div>
                    <dt>Emergency contact</dt>
                    <dd>{{ emergencyContact(selectedPatient) }}</dd>
                  </div>
                  <div><dt>Medical history</dt><dd>{{ selectedPatient.medical_history || '—' }}</dd></div>
                  <div><dt>Allergies</dt><dd>{{ selectedPatient.allergies || '—' }}</dd></div>
                </dl>

                <div class="history-section">
                  <h3>Appointment history</h3>
                  <p v-if="historyLoading">Loading history...</p>
                  <p v-else-if="historyError" class="error-message" role="alert">{{ historyError }}</p>
                  <p v-else-if="!history?.appointments.length">No appointments recorded.</p>
                  <ion-list v-else lines="inset">
                    <ion-item v-for="appointment in history.appointments" :key="appointment.id">
                      <ion-label>
                        <h4>{{ displayDateTime(appointment.starts_at) }}</h4>
                        <p>{{ appointment.status.replaceAll('_', ' ') }}{{ appointment.reason ? ` · ${appointment.reason}` : '' }}</p>
                      </ion-label>
                    </ion-item>
                  </ion-list>
                </div>

                <div class="history-section">
                  <h3>Treatment history</h3>
                  <p v-if="historyLoading">Loading history...</p>
                  <p v-else-if="historyError" class="error-message" role="alert">{{ historyError }}</p>
                  <p v-else-if="!history?.records.length">No treatment records recorded.</p>
                  <ion-list v-else lines="inset">
                    <ion-item v-for="record in history.records" :key="record.id">
                      <ion-label>
                        <h4>{{ displayDateTime(record.recorded_at) }} · {{ record.diagnosis }}</h4>
                        <p>{{ record.procedures_performed || 'No procedure details' }}</p>
                      </ion-label>
                    </ion-item>
                  </ion-list>
                </div>
              </template>
              <div v-else class="state-message">Choose a patient to view profile and history.</div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <ion-modal :is-open="isEditorOpen" @did-dismiss="closeEditor">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingId ? 'Edit patient' : 'Register patient' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :disabled="saving" @click="closeEditor">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="patient-form" @submit.prevent="savePatient">
            <ion-input
              v-model="form.full_name"
              label="Full name"
              label-placement="stacked"
              fill="outline"
              :maxlength="160"
              required
            />
            <ion-input
              v-model="form.date_of_birth"
              label="Date of birth"
              label-placement="stacked"
              fill="outline"
              type="date"
            />
            <p v-if="formAge" class="field-hint">Age: {{ formAge }}</p>
            <ion-select
              v-model="form.sex"
              label="Sex"
              label-placement="stacked"
              fill="outline"
              interface="popover"
              placeholder="Not specified"
            >
              <ion-select-option value="">Not specified</ion-select-option>
              <ion-select-option value="female">Female</ion-select-option>
              <ion-select-option value="male">Male</ion-select-option>
              <ion-select-option value="other">Other</ion-select-option>
            </ion-select>
            <ion-input
              v-model="form.contact_number"
              label="Contact number"
              label-placement="stacked"
              fill="outline"
              type="tel"
              autocomplete="tel"
            />
            <ion-input
              v-model="form.email"
              label="Email"
              label-placement="stacked"
              fill="outline"
              type="email"
              autocomplete="email"
            />
            <ion-textarea
              v-model="form.address"
              label="Address"
              label-placement="stacked"
              fill="outline"
              :auto-grow="true"
              :maxlength="300"
              required
            />
            <div class="form-row">
              <ion-input
                v-model="form.emergency_contact_name"
                label="Emergency contact name"
                label-placement="stacked"
                fill="outline"
              />
              <ion-input
                v-model="form.emergency_contact_number"
                label="Emergency contact number"
                label-placement="stacked"
                fill="outline"
                type="tel"
              />
            </div>
            <ion-textarea
              v-model="form.medical_history"
              label="Medical history"
              label-placement="stacked"
              fill="outline"
              :auto-grow="true"
            />
            <ion-textarea
              v-model="form.allergies"
              label="Allergies (optional)"
              label-placement="stacked"
              fill="outline"
              :auto-grow="true"
              :maxlength="2000"
            />
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">
              <ion-spinner v-if="saving" name="crescent" />
              <span v-else>{{ editingId ? 'Save changes' : 'Register patient' }}</span>
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :duration="2600"
        @did-dismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { personAddOutline } from 'ionicons/icons'
import PageAction from '../../components/common/PageAction.vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import {
  createPatient,
  getPatientHistory,
  listPatients,
  type Patient,
  type PatientInput,
  updatePatient,
} from '../../services/patient.service'
import { ageLabel, birthSummary, isPatientSex, sexLabel } from '../../utils/patientDetails'

type PatientHistory = Awaited<ReturnType<typeof getPatientHistory>>
type SourceFilter = 'all' | 'portal' | 'walk-in'

const { profile } = useAuth()
const today = new Date().toISOString().slice(0, 10)
const patients = ref<Patient[]>([])
const selectedPatient = ref<Patient | null>(null)
const history = ref<PatientHistory | null>(null)
const search = ref('')
const sourceFilter = ref<SourceFilter>('all')
const page = ref(0)
const totalCount = ref(0)
const loading = ref(false)
const historyLoading = ref(false)
const saving = ref(false)
const loadError = ref('')
const historyError = ref('')
const formError = ref('')
const isEditorOpen = ref(false)
const editingId = ref<string | null>(null)
const toastOpen = ref(false)
const toastMessage = ref('')

const emptyForm = (): PatientInput => ({
  full_name: '',
  date_of_birth: null,
  contact_number: null,
  email: null,
  address: null,
  emergency_contact_name: null,
  emergency_contact_number: null,
  medical_history: null,
  allergies: null,
  sex: '',
})

const form = reactive<PatientInput>(emptyForm())
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / 25)))
const filteredPatients = computed(() =>
  patients.value.filter((patient) => {
    if (sourceFilter.value === 'portal') return patient.profile_id !== null
    if (sourceFilter.value === 'walk-in') return patient.profile_id === null
    return true
  }),
)
const avatars = useAvatarPaths()
watch(filteredPatients, (rows) => void avatars.load(rows.map((patient) => patient.profile_id)), {
  immediate: true,
})

watch(search, () => {
  page.value = 0
  void loadPatients()
})

watch(
  () => profile.value?.clinicId,
  () => {
    void loadPatients()
  },
  { immediate: true },
)

async function loadPatients() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return

  loading.value = true
  loadError.value = ''
  try {
    const result = await listPatients(clinicId, search.value, page.value)
    patients.value = result.patients
    totalCount.value = result.count
    if (selectedPatient.value) {
      const refreshed = result.patients.find((patient) => patient.id === selectedPatient.value?.id)
      if (refreshed) selectedPatient.value = refreshed
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load patients.'
  } finally {
    loading.value = false
  }
}

async function selectPatient(patient: Patient) {
  selectedPatient.value = patient
  history.value = null
  historyError.value = ''
  historyLoading.value = true
  try {
    history.value = await getPatientHistory(patient.clinic_id, patient.id)
  } catch (error) {
    historyError.value = error instanceof Error ? error.message : 'Unable to load patient history.'
  } finally {
    historyLoading.value = false
  }
}

function changePage(direction: number) {
  page.value += direction
  void loadPatients()
}

function openNewPatient() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, emptyForm())
  isEditorOpen.value = true
}

function openEditPatient() {
  if (!selectedPatient.value) return
  const patient = selectedPatient.value
  editingId.value = patient.id
  formError.value = ''
  Object.assign(form, {
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth,
    contact_number: patient.contact_number,
    email: patient.email,
    address: patient.address,
    emergency_contact_name: patient.emergency_contact_name,
    emergency_contact_number: patient.emergency_contact_number,
    medical_history: patient.medical_history,
    allergies: patient.allergies,
    sex: patient.sex ?? '',
  })
  isEditorOpen.value = true
}

function closeEditor() {
  if (saving.value) return
  isEditorOpen.value = false
}

function normalizedForm(): PatientInput {
  const value = (input: string | null) => input?.trim() || null
  return {
    full_name: form.full_name.trim(),
    date_of_birth: value(form.date_of_birth),
    contact_number: value(form.contact_number),
    email: value(form.email)?.toLowerCase() ?? null,
    address: value(form.address),
    emergency_contact_name: value(form.emergency_contact_name),
    emergency_contact_number: value(form.emergency_contact_number),
    medical_history: value(form.medical_history),
    allergies: value(form.allergies),
    sex: isPatientSex(form.sex) ? form.sex : null,
  }
}

const formAge = computed(() => ageLabel(form.date_of_birth))

function listMeta(patient: Patient) {
  const details = [ageLabel(patient.date_of_birth), isPatientSex(patient.sex) ? sexLabel(patient.sex) : null]
    .filter(Boolean)
    .join(' · ')
  const contact = patient.contact_number || patient.email
  if (details && contact) return `${details} · ${contact}`
  return details || contact || 'No contact details'
}

function validate(input: PatientInput) {
  if (!input.full_name) return 'Full name is required.'
  if (input.full_name.length > 160) return 'Full name must be 160 characters or fewer.'
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return 'Enter a valid email address.'
  }
  if (input.date_of_birth && input.date_of_birth > today) {
    return 'Date of birth cannot be in the future.'
  }
  if (!input.address) return 'Address is required.'
  if (input.address.length > 300) return 'Address must be 300 characters or fewer.'
  return ''
}

async function savePatient() {
  formError.value = ''
  const input = normalizedForm()
  const validationError = validate(input)
  if (validationError) {
    formError.value = validationError
    return
  }

  const clinicId = profile.value?.clinicId
  const actorId = profile.value?.id
  if (!clinicId || !actorId) {
    formError.value = 'Your active clinic session is unavailable. Sign in again and retry.'
    return
  }

  saving.value = true
  try {
    const saved = editingId.value
      ? await updatePatient(clinicId, editingId.value, input)
      : await createPatient(clinicId, actorId, input)
    isEditorOpen.value = false
    selectedPatient.value = saved
    await loadPatients()
    await selectPatient(saved)
    toastMessage.value = editingId.value ? 'Patient profile updated.' : 'Patient registered.'
    toastOpen.value = true
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to save patient.'
  } finally {
    saving.value = false
  }
}

function displayDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00`),
  )
}

function displayDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function emergencyContact(patient: Patient) {
  const details = [patient.emergency_contact_name, patient.emergency_contact_number].filter(Boolean)
  return details.length ? details.join(' · ') : '—'
}
</script>

<style scoped>
.patients-content {
  --background: var(--canvas);
}

.patients-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 12px 16px 28px;
}

.patient-tools ion-card-content {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(250px, 420px) auto;
  align-items: center;
  gap: 12px;
}

.patient-tools ion-searchbar {
  padding: 0;
}

.result-count {
  margin: 0;
  color: var(--ion-color-medium);
  text-align: right;
}

.patients-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(400px, 1.4fr);
  align-items: start;
  gap: 16px;
}

.patient-list-card,
.patient-details-card {
  margin: 0;
}

.selected-patient {
  --background: var(--accent-soft);
}

.patient-details-card ion-card-header {
  padding-bottom: 8px;
}

.detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.profile-grid div {
  min-width: 0;
}

.field-hint {
  margin: -4px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.profile-grid dt {
  margin-bottom: 4px;
  color: var(--ion-color-medium);
  font-size: 12px;
}

.profile-grid dd {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.history-section {
  margin-top: 24px;
}

.history-section h3 {
  margin-bottom: 8px;
  color: var(--clinic-ink);
  font-size: 16px;
}

.state-message {
  padding: 16px 8px;
  color: var(--ion-color-medium);
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--ion-color-medium);
  font-size: 13px;
}

.patient-form {
  display: grid;
  gap: 16px;
  max-width: 760px;
  margin: 0 auto;
  padding: 20px 16px 32px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 760px) {
  .patient-tools ion-card-content {
    grid-template-columns: 1fr;
  }

  .result-count {
    text-align: left;
  }

  .patients-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .patients-page {
    padding: 8px 10px 20px;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .detail-heading {
    align-items: flex-start;
  }
}
</style>
