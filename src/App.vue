<template>
  <ion-app>
    <ion-router-outlet />
    <PearlChat v-if="showPearl" />
    <div v-if="update" class="app-update" role="alertdialog" aria-modal="true" aria-labelledby="update-title">
      <section>
        <p class="app-update-kicker">Harbor Dental</p>
        <h2 id="update-title">A new version is ready</h2>
        <p>Update to keep using the app. This replaces the version on your phone.</p>
        <p v-if="updateMessage" class="app-update-status">{{ updateMessage }}</p>
        <ion-button expand="block" :disabled="updating" @click="installUpdate">
          {{ updating ? 'Downloading…' : 'Update' }}
        </ion-button>
      </section>
    </div>
  </ion-app>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonButton, IonRouterOutlet } from '@ionic/vue'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import PearlChat from './components/patient/PearlChat.vue'
import { useAuth } from './composables/useAuth'
import { findAppUpdate, installAppUpdate, updateErrorMessage, type AppUpdate } from './services/appUpdate'

const route = useRoute()
const { role } = useAuth()
const showPearl = computed(
  () => role.value === 'patient' && (route.path.startsWith('/patient') || route.path.startsWith('/profile')),
)
const update = ref<AppUpdate | null>(null)
const updating = ref(false)
const updateMessage = ref('')

let appStateHandle: PluginListenerHandle | undefined

async function refreshUpdate() {
  try {
    update.value = await findAppUpdate()
  } catch {
    // A dropped connection must not unlock a build that already needs an update.
  }
}

onMounted(() => {
  void refreshUpdate()
  if (!Capacitor.isNativePlatform()) return
  void CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void refreshUpdate()
  }).then((handle) => {
    appStateHandle = handle
  })
})

onUnmounted(() => {
  void appStateHandle?.remove()
})

async function installUpdate() {
  if (!update.value || updating.value) return
  updating.value = true
  updateMessage.value = ''
  try {
    await installAppUpdate(update.value.url)
    updateMessage.value = 'Confirm the install on the next screen.'
  } catch (error) {
    updateMessage.value = updateErrorMessage(error)
  } finally {
    updating.value = false
  }
}
</script>

<style>
.app-update {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(16 36 43 / 72%);
}

.app-update section {
  width: min(420px, 100%);
  padding: 22px 20px 18px;
  background: var(--surface);
  border-radius: 22px;
  box-shadow: var(--shadow-md);
}

.app-update-kicker {
  margin: 0;
  color: var(--clinic-blue);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-update h2 {
  margin: 6px 0 8px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 500;
  letter-spacing: -0.03em;
}

.app-update p {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.5;
}

.app-update-status {
  color: var(--clinic-ink);
}
</style>
