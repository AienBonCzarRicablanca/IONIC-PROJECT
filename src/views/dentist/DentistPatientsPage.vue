<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Assigned Patients</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="list-page">
        <ion-searchbar
          v-model="search"
          :debounce="300"
          placeholder="Search by name"
          @ion-input="load"
        />
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading" class="state-message" role="status">Loading...</div>
        <p v-else-if="!patients.length" class="state-message">
          No patients yet. Patients appear here once they have an appointment with you.
        </p>
        <ion-list v-else lines="full">
          <ion-item
            v-for="patient in patients"
            :key="patient.id"
            button
            :detail="true"
            :router-link="`/dentist/patients/${patient.id}`"
          >
            <UserAvatar
              slot="start"
              :name="patient.full_name"
              :path="avatars.pathFor(patient.profile_id)"
            />
            <ion-label>
              <h2>{{ patient.full_name }}</h2>
              <p>{{ patient.contact_number ?? patient.email ?? '' }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import { listAssignedPatients } from '../../services/clinical.service'

const { profile } = useAuth()
const avatars = useAvatarPaths()
const patients = ref<Awaited<ReturnType<typeof listAssignedPatients>>>([])
const search = ref('')
const loading = ref(false)
const loadError = ref('')

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    patients.value = await listAssignedPatients(clinicId, search.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load patients.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })
watch(patients, (rows) => void avatars.load(rows.map((patient) => patient.profile_id)), { immediate: true })
</script>

<style scoped>
.list-page {
  margin: 0 auto;
  max-width: 800px;
  padding: 0.5rem;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
