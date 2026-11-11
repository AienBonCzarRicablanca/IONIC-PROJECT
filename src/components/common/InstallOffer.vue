<template>
  <aside v-if="visible" class="install-offer">
    <p>
      <strong>{{ title }}</strong>
      {{ message }}
    </p>
    <div>
      <a v-if="kind === 'open'" :href="openUrl">Open the app</a>
      <a v-else-if="downloadUrl" :href="downloadUrl">Download app</a>
      <button type="button" @click="dismiss">Not now</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { harborAppIntentUrl, isHarborAppInstalled, LATEST_APK_URL } from '../../services/appUpdate'

const DISMISS_KEY = 'harbor-install-dismissed'
const visible = ref(false)
const kind = ref<'android' | 'ios' | 'open' | null>(null)

const downloadUrl = computed(() => (kind.value === 'android' ? LATEST_APK_URL : ''))
const openUrl = computed(() => harborAppIntentUrl(window.location.href))
const title = computed(() => {
  if (kind.value === 'open') return 'Harbor Dental is already installed.'
  if (kind.value === 'android') return 'Get the Android app.'
  return 'Add it to your Home Screen.'
})
const message = computed(() => {
  if (kind.value === 'open') return 'Open the app on this phone instead of staying in the browser?'
  if (kind.value === 'android')
    return 'This downloads the latest Harbor Dental build. After it is installed, the app still offers updates.'
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
  if (/Android/i.test(ua)) kind.value = (await isHarborAppInstalled()) ? 'open' : 'android'
  else if (/iPhone|iPad|iPod/i.test(ua)) kind.value = 'ios'
  visible.value = kind.value !== null
})

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
html.ion-palette-dark .install-offer button {
  color: #e7f1f0;
}

@media (max-width: 640px) {
  .install-offer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
