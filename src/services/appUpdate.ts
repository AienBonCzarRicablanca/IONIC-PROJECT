import { Capacitor, registerPlugin } from '@capacitor/core'
import { App } from '@capacitor/app'

const REPO = 'AienBonCzarRicablanca/IONIC-PROJECT'

export const LATEST_APK_URL = `https://github.com/${REPO}/releases/latest/download/harbor-dental.apk`

export const ANDROID_PACKAGE = 'com.harbordental.clinic'

export function harborAppIntentUrl(fallback: string) {
  const fallbackUrl = encodeURIComponent(fallback)
  return `intent://open#Intent;scheme=${ANDROID_PACKAGE};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallbackUrl};end`
}

export async function isHarborAppInstalled() {
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ id?: string; platform?: string }>>
  }
  if (typeof nav.getInstalledRelatedApps !== 'function') return false
  try {
    const related = await nav.getInstalledRelatedApps()
    return related.some((app) => (!app.platform || app.platform === 'play') && app.id === ANDROID_PACKAGE)
  } catch {
    return false
  }
}

interface ApkUpdaterPlugin {
  downloadAndInstall(options: { url: string }): Promise<void>
}

const ApkUpdater = registerPlugin<ApkUpdaterPlugin>('ApkUpdater')

export interface AppUpdate {
  versionCode: number
  url: string
}

export async function findAppUpdate(): Promise<AppUpdate | null> {
  if (!Capacitor.isNativePlatform()) return null
  const info = await App.getInfo()
  const installed = Number(info.build) || 0
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) return null
  const release = (await response.json()) as {
    tag_name?: string
    assets?: { name?: string; browser_download_url?: string }[]
  }
  const versionCode = Number(String(release.tag_name ?? '').replace(/^v/i, ''))
  if (!Number.isFinite(versionCode) || versionCode <= installed) return null
  const asset = release.assets?.find((item) => item.name === 'harbor-dental.apk')
  if (!asset?.browser_download_url) return null
  return { versionCode, url: asset.browser_download_url }
}

export async function installAppUpdate(url: string) {
  await ApkUpdater.downloadAndInstall({ url })
}

export function updateErrorMessage(error: unknown) {
  const message =
    error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  if (message.includes('INSTALL_PERMISSION')) {
    return 'Allow Harbor Dental to install updates in Settings, then tap Update again.'
  }
  return 'The update could not be downloaded. Check your connection and try again.'
}
