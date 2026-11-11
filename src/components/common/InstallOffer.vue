<template>
  <aside v-if="visible" class="install-offer">
    <p>
      <strong>{{ title }}</strong>
      {{ message }}
    </p>
    <div>
      <a v-if="kind === 'open' || kind === 'android'" :href="openUrl" @click="rememberOpen">Open the app</a>
      <a v-else-if="downloadUrl" :href="downloadUrl">Download app</a>
      <a v-if="showDownload" class="download-link" :href="downloadUrl">Download</a>
      <button type="button" @click="dismiss">Not now</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { harborAppIntentUrl, isHarborAppInstalled, LATEST_APK_URL } from '../../services/appUpdate'

const DISMISS_KEY = 'harbor-install-dismissed'
const INSTALLED_KEY = 'harbor-app-on-device'
const visible = ref(false)
const offerDownload = ref(false)
const kind = ref<'android' | 'ios' | 'open' | null>(null)

const showDownload = computed(() => kind.value === 'android' && offerDownload.value)
const downloadUrl = computed(() => (showDownload.value ? LATEST_APK_URL : ''))
const openUrl = computed(() => harborAppIntentUrl(window.location.href))
const title = computed(() => {
  if (kind.value === 'open' || kind.value === 'android') return 'Continue in the app'
  return 'Add it to your Home Screen.'
})
const message = computed(() => {
  if (kind.value === 'open') return 'Harbor Dental is already on this phone.'
  if (kind.value === 'android' && offerDownload.value)
    return 'The app did not open. You can download the latest build instead.'
  if (kind.value === 'android') return 'Open Harbor Dental if it is already on this phone.'
  return 'On iPhone, tap Share, then Add to Home Screen. It opens like an app.'
})

onMounted(async () => {
  if (Capacitor.isNativePlatform()) return
  if (sessionStorage.getItem(DISMISS_KEY) === '1') return
  const ua = navigator.userAgent
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  if (standalone) return
  if (/Android/i.test(ua)) {
    const installed = localStorage.getItem(INSTALLED_KEY) === '1' || (await isHarborAppInstalled())
    kind.value = installed ? 'open' : 'android'
  }
  else if (/iPhone|iPad|iPod/i.test(ua)) kind.value = 'ios'
  visible.value = kind.value !== null
})

function rememberOpen() {
  const markInstalled = () => {
    if (document.visibilityState === 'hidden') localStorage.setItem(INSTALLED_KEY, '1')
  }
  document.addEventListener('visibilitychange', markInstalled)
  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markInstalled)
    if (document.visibilityState === 'visible' && localStorage.getItem(INSTALLED_KEY) !== '1') {
      offerDownload.value = true
    }
  }, 1600)
}

function dismiss() {
  sessionStorage.setItem(DISMISS_KEY, '1')
  visible.value = false
}
</script>

<style scoped>
.install-offer {
  position: fixed;
  z-index: 40;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #d7e6e3;
  border-radius: 18px;
  box-shadow: 0 14px 32px rgb(18 72 80 / 14%);
}

.install-offer p {
  margin: 0;
  color: #5d757c;
  font-size: 13px;
  line-height: 1.45;
}

.install-offer strong {
  display: block;
  color: #14343c;
  font-size: 14px;
}

.install-offer div {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.install-offer a,
.install-offer button {
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.install-offer a {
  padding: 8px 12px;
  color: #fff;
  background: #0e7c74;
}

.install-offer a.download-link {
  padding: 8px 4px;
  color: #5d757c;
  background: transparent;
  font-weight: 600;
}

.install-offer button {
  padding: 8px 10px;
  color: #14343c;
  background: transparent;
}

html.ion-palette-dark .install-offer {
  background: #173034;
  border-color: #2c4548;
  box-shadow: none;
}

html.ion-palette-dark .install-offer p {
  color: #9eb0b4;
}

html.ion-palette-dark .install-offer strong,
html.ion-palette-dark .install-offer button,
html.ion-palette-dark .install-offer a.download-link {
  color: #e7f1f0;
}

@media (max-width: 640px) {
  .install-offer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
