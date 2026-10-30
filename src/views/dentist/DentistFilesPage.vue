<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Digital X-Rays</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="files-page">
        <ion-card>
          <ion-card-content>
            <ion-select
              v-model="patientId"
              label="Patient"
              label-placement="stacked"
              placeholder="Select a patient"
              interface="popover"
            >
              <ion-select-option v-for="p in patients" :key="p.id" :value="p.id">
                {{ p.full_name }}
              </ion-select-option>
            </ion-select>

            <div v-if="patientId" class="upload">
              <label for="xray-file">Upload X-ray or document (JPG, PNG, WebP, PDF, max 20 MB)</label>
              <input
                id="xray-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                :disabled="uploading"
                @change="onFile"
              />
              <ion-progress-bar v-if="uploading" type="indeterminate" />
            </div>
          </ion-card-content>
        </ion-card>

        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <p v-else-if="patientId && !files.length && !loading" class="state-message">No files yet.</p>

        <ion-card v-if="files.length">
          <ion-card-content>
            <ion-list lines="full">
              <ion-item v-for="file in files" :key="file.id" :detail="false">
                <ion-label class="ion-text-wrap">
                  <h3>{{ file.original_name }}</h3>
                  <p>{{ dateFmt.format(new Date(file.created_at)) }} · {{ sizeLabel(file.size_bytes) }}</p>
                </ion-label>
                <ion-button slot="end" size="small" :disabled="busy" @click="preview(file)">View</ion-button>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="previewUrl">
          <ion-card-header>
            <ion-card-title>{{ previewName }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <img v-if="previewIsImage" :src="previewUrl" :alt="`X-ray: ${previewName}`" class="preview" />
            <iframe v-else :src="previewUrl" :title="previewName" class="preview-pdf" />
            <ion-button fill="clear" @click="closePreview">Close</ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2600" @did-dismiss="toastOpen = false" />
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
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../../composables/useAuth'
import { listAssignedPatients } from '../../services/clinical.service'
import { getSignedUrl, listFiles, type PatientFile, uploadFile, validateFile } from '../../services/files.service'

const { profile, session } = useAuth()
const patients = ref<Awaited<ReturnType<typeof listAssignedPatients>>>([])
const patientId = ref('')
const files = ref<PatientFile[]>([])
const loading = ref(false)
const busy = ref(false)
const uploading = ref(false)
const loadError = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')
const previewUrl = ref('')
const previewName = ref('')
const previewIsImage = ref(true)
const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const sizeLabel = (bytes: number) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function closePreview() {
  previewUrl.value = ''
}

async function loadPatients() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  try {
    patients.value = await listAssignedPatients(clinicId, '')
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load patients.'
  }
}

async function loadFiles() {
  closePreview()
  files.value = []
  if (!patientId.value) return
  loading.value = true
  loadError.value = ''
  try {
    files.value = await listFiles(patientId.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load files.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void loadPatients(), { immediate: true })
watch(patientId, () => void loadFiles())

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const clinicId = profile.value?.clinicId
  const userId = session.value?.user.id
  if (!file || !clinicId || !userId || !patientId.value) return

  const invalid = validateFile(file)
  if (invalid) {
    showToast(invalid)
    return
  }
  uploading.value = true
  try {
    await uploadFile(clinicId, patientId.value, userId, file)
    showToast('File uploaded.')
    await loadFiles()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Upload failed.')
  } finally {
    uploading.value = false
  }
}

async function preview(file: PatientFile) {
  busy.value = true
  try {
    previewUrl.value = await getSignedUrl(file.storage_path)
    previewName.value = file.original_name
    previewIsImage.value = file.mime_type.startsWith('image/')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not open the file.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.files-page {
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.upload {
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview {
  max-width: 100%;
}

.preview-pdf {
  border: 0;
  height: 70vh;
  width: 100%;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
