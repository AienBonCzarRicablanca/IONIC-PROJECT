<template>
  <aside v-if="visible" class="install-offer">
    <p>
      <strong>{{ title }}</strong>
      {{ message }}
    </p>
    <div>
      <a v-if="downloadUrl" :href="downloadUrl">Download app</a>
      <button type="button" @click="dismiss">Not now</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { LATEST_APK_URL } from '../../services/appUpdate'

const DISMISS_KEY = 'harbor-install-dismissed'
const visible = ref(false)
const kind = ref<'android' | 'ios' | null>(null)

const downloadUrl = computed(() => (kind.value === 'android' ? LATEST_APK_URL : ''))
const title = computed(() => (kind.value === 'android' ? 'Get the Android app.' : 'Add it to your Home Screen.'))
const message = computed(() =>
  kind.value === 'android'
    ? 'This downloads the latest Harbor Dental build. After it is installed, the app still offers updates.'
    : 'On iPhone, tap Share, then Add to Home Screen. It opens like an app.',
)

onMounted(() => {
  if (Capacitor.isNativePlatform()) return
  if (sessionStorage.getItem(DISMISS_KEY) === '1') return
  const ua = navigator.userAgent
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  if (standalone) return
  if (/Android/i.test(ua)) kind.value = 'android'
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

@media (max-width: 640px) {
  .install-offer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
