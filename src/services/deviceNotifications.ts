import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PluginListenerHandle } from '@capacitor/core'
import { alertController } from '@ionic/vue'
import { listMyNotifications } from './portal.service'

const CHANNEL_ID = 'harbor-notices'
const SINCE_KEY = 'harbor-notify-since'
const SHOWN_KEY = 'harbor-notify-shown'
const LATER_KEY = 'harbor-notify-later'

let openLatest: (path: string) => void = () => {}
let listening = false
let prompting = false

function noticesPath(role: string | undefined) {
  if (role === 'superadmin') return '/superadmin/notifications'
  if (role === 'admin') return '/admin/notifications'
  if (role === 'dentist') return '/dentist/notifications'
  if (role === 'patient') return '/patient/notifications'
  return ''
}

function numericId(id: string) {
  let hash = 0
  for (const char of id) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0
  return (hash % 2147483646) + 1
}

function loadShown() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHOWN_KEY) ?? '[]') as unknown
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function saveShown(ids: Set<string>) {
  localStorage.setItem(SHOWN_KEY, JSON.stringify([...ids].slice(-100)))
}

async function ensureChannel() {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Clinic notices',
    description: 'Appointments and messages from Harbor Dental',
    importance: 4,
    visibility: 1,
  })
}

async function askFirst() {
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  if (current.display === 'denied') return false
  if (sessionStorage.getItem(LATER_KEY) === '1' || prompting) return false
  prompting = true
  try {
    const alert = await alertController.create({
      header: 'Allow phone notifications?',
      message: 'Harbor Dental can alert this device when the clinic sends a notice. Your phone will ask for permission next.',
      buttons: [
        { text: 'Not now', role: 'cancel' },
        { text: 'Allow', role: 'confirm' },
      ],
    })
    await alert.present()
    const choice = await alert.onDidDismiss()
    if (choice.role !== 'confirm') {
      sessionStorage.setItem(LATER_KEY, '1')
      return false
    }
    const next = await LocalNotifications.requestPermissions()
    return next.display === 'granted'
  } finally {
    prompting = false
  }
}

async function publishNew(userId: string, path: string) {
  const since = localStorage.getItem(SINCE_KEY)
  if (!since) return
  let items: Awaited<ReturnType<typeof listMyNotifications>>
  try {
    items = await listMyNotifications(userId)
  } catch {
    return
  }
  const shown = loadShown()
  const fresh = items.filter((item) => !item.read_at && item.created_at > since && !shown.has(item.id))
  if (!fresh.length) return
  await LocalNotifications.schedule({
    notifications: fresh.map((item) => ({
      id: numericId(item.id),
      title: item.title,
      body: item.message,
      channelId: CHANNEL_ID,
      foreground: true,
      isExactNotification: false,
      extra: { path },
    })),
  })
  for (const item of fresh) shown.add(item.id)
  saveShown(shown)
}

export function watchDeviceNotifications(userId: string, role: string | undefined, openPath: (path: string) => void) {
  const path = noticesPath(role)
  if (!Capacitor.isNativePlatform() || !path) return () => {}
  openLatest = openPath
  let stopped = false
  let timer = 0
  let resumeHandle: PluginListenerHandle | undefined

  if (!listening) {
    listening = true
    void LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const target = event.notification.extra?.path
      if (typeof target === 'string') openLatest(target)
    })
  }

  const sync = () => {
    if (!stopped) void publishNew(userId, path).catch(() => {})
  }

  void (async () => {
    const allowed = await askFirst()
    if (stopped || !allowed) return
    if (!localStorage.getItem(SINCE_KEY)) localStorage.setItem(SINCE_KEY, new Date().toISOString())
    await ensureChannel().catch(() => {})
    if (stopped) return
    sync()
    timer = window.setInterval(sync, 60000)
    resumeHandle = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) sync()
    })
    if (stopped) void resumeHandle.remove()
  })()

  return () => {
    stopped = true
    window.clearInterval(timer)
    void resumeHandle?.remove()
  }
}
