<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end"><NotificationButton /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div v-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <div v-else-if="loading" class="state-message" role="status">Loading notifications...</div>
        <template v-else>
          <p v-if="actionError" class="state-message error-message" role="alert">{{ actionError }}</p>
          <p v-if="!items.length" class="state-message">No notifications.</p>
          <ion-list v-else lines="full">
            <ion-item
              v-for="n in items"
              :key="n.id"
              button
              :detail="false"
              :disabled="savingId === n.id"
              @click="read(n)"
            >
              <ion-label class="ion-text-wrap">
                <h3 :class="{ unread: !n.read_at }">{{ n.title }}</h3>
                <p>{{ n.message }}</p>
                <p>{{ fmt.format(new Date(n.created_at)) }}</p>
              </ion-label>
              <ion-chip v-if="!n.read_at" slot="end" color="primary">New</ion-chip>
            </ion-item>
          </ion-list>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonButtons, IonChip, IonContent, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import NotificationButton from '../../components/common/NotificationButton.vue'
import { useAuth } from '../../composables/useAuth'
import { useMyPatient } from '../../composables/useMyPatient'
import { listMyNotifications, markNotificationRead, type MyNotification } from '../../services/portal.service'

const { session } = useAuth()
const items = ref<MyNotification[]>([])
const savingId = ref<string | null>(null)
const actionError = ref('')
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const { loading, loadError } = useMyPatient(async () => {
  items.value = await listMyNotifications(session.value?.user.id ?? '')
})

async function read(n: MyNotification) {
  if (n.read_at || savingId.value) return
  actionError.value = ''
  savingId.value = n.id
  try {
    await markNotificationRead(n.id)
    n.read_at = new Date().toISOString()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Could not mark the notification as read.'
  } finally {
    savingId.value = null
  }
}
</script>

<style scoped>
.page { margin: 0 auto; max-width: 800px; padding: 0.5rem; }
.unread { font-weight: 700; }
.state-message { padding: 1rem; text-align: center; }
.error-message { color: var(--ion-color-danger); }
</style>
