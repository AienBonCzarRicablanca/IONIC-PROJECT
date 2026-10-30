<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Audit Logs</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loading" class="state-message" role="status">Loading logs...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="logs.length === 0" class="state-message">No audit log entries yet.</div>

        <ion-list v-else lines="full">
          <ion-item v-for="log in logs" :key="log.id" :detail="false">
            <ion-label class="ion-text-wrap">
              <h3>{{ log.action }} · {{ log.entity_table }}</h3>
              <p>{{ log.profiles?.full_name ?? 'System' }} · {{ prettyDate(log.created_at) }}</p>
              <p v-if="log.entity_id">Record ID: {{ log.entity_id }}</p>
              <p v-if="Object.keys(log.metadata ?? {}).length">Metadata: {{ JSON.stringify(log.metadata) }}</p>
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
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../../composables/useAuth'
import { listAuditLogs, type AuditLogRow } from '../../services/owner.service'

const { profile } = useAuth()
const logs = ref<AuditLogRow[]>([])
const loading = ref(false)
const loadError = ref('')
const prettyDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    logs.value = await listAuditLogs(clinicId, 50)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load the audit logs.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })
</script>

<style scoped>
.page { margin: 0 auto; max-width: 1000px; padding: 0.5rem; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
