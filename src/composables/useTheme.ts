import { computed, ref } from 'vue'
import { contrastOutline, moonOutline, sunnyOutline } from 'ionicons/icons'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'harbor-theme'
const preference = ref<ThemePreference>('system')
const isDark = ref(false)
let listening = false

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function applyTheme(next: ThemePreference = preference.value) {
  preference.value = next
  const dark = next === 'dark' || (next === 'system' && systemPrefersDark())
  isDark.value = dark
  document.documentElement.classList.toggle('ion-palette-dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function initTheme() {
  applyTheme(readStoredPreference())
  if (listening) return
  listening = true
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (preference.value === 'system') applyTheme('system')
  })
}

export function useTheme() {
  const label = computed(() => {
    if (preference.value === 'dark') return 'Dark'
    if (preference.value === 'light') return 'Light'
    return 'Device'
  })
  const icon = computed(() => {
    if (preference.value === 'dark') return moonOutline
    if (preference.value === 'light') return sunnyOutline
    return contrastOutline
  })

  function setPreference(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  function cycle() {
    const order: ThemePreference[] = ['system', 'dark', 'light']
    const next = order[(order.indexOf(preference.value) + 1) % order.length]
    setPreference(next)
  }

  return { preference, isDark, label, icon, setPreference, cycle }
}
