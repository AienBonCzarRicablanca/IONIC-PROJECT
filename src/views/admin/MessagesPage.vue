<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Messages</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading" @click="load">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loading" class="state-message" role="status">Loading messages...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="!messages.length" class="state-message">No website messages yet.</div>
        <ion-list v-else lines="full">
          <ion-item v-for="note in messages" :key="note.id" :detail="false">
            <ion-label class="ion-text-wrap">
              <h2>{{ note.sender_name }}</h2>
              <p>{{ note.sender_email }} · {{ when(note.created_at) }}</p>
              <p>{{ note.message }}</p>
            </ion-label>
            <ion-chip v-if="note.read_at" color="medium">Read</ion-chip>
            <ion-button v-else slot="end" fill="clear" size="small" :disabled="busyId === note.id" @click="markRead(note.id)">
              Mark read
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../../composables/useAuth'
import {
  listContactMessages,
  markContactMessageRead,
  type ContactMessage,
} from '../../services/contact.service'

const { profile } = useAuth()
const messages = ref<ContactMessage[]>([])
const loading = ref(false)
const loadError = ref('')
const busyId = ref('')

function when(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    messages.value = await listContactMessages(clinicId)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load messages.'
  } finally {
    loading.value = false
  }
}

async function markRead(id: string) {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  busyId.value = id
  try {
    await markContactMessageRead(clinicId, id)
    await load()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not update the message.'
  } finally {
    busyId.value = ''
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })
</script>

<style scoped>
.page {
  margin: 0 auto;
  max-width: 860px;
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
