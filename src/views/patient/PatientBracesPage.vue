<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>Try on braces</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <p class="lead">
          The camera follows your smile and places the braces on your teeth as you move. Nothing is uploaded.
        </p>

        <div class="stage-wrap">
          <div class="stage">
            <video ref="videoRef" playsinline autoplay muted />
            <canvas ref="canvasRef" />
            <p v-if="errorMessage" class="stage-note" role="alert">{{ errorMessage }}</p>
            <p v-else-if="!ready" class="stage-note" role="status">{{ status }}</p>
          </div>
          <p v-if="ready" class="status" role="status">{{ status }}</p>
          <div class="stage-actions">
            <ion-button fill="outline" :disabled="!ready" @click="flipCamera">
              <ion-icon slot="start" :icon="cameraReverseOutline" />
              Flip camera
            </ion-button>
            <ion-button :disabled="!ready || saving" @click="savePhoto">
              <ion-icon slot="start" :icon="downloadOutline" />
              Save photo
            </ion-button>
          </div>
          <ion-button v-if="errorMessage" expand="block" @click="start">Try the camera again</ion-button>
        </div>

        <section class="panel" aria-label="Braces design">
          <h2>Arch</h2>
          <div class="choices">
            <button v-for="option in arches" :key="option.id" type="button" :class="{ selected: design.arch === option.id }" @click="design.arch = option.id">
              {{ option.label }}
            </button>
          </div>

          <h2>Brackets</h2>
          <div class="choices">
            <button v-for="option in materials" :key="option.id" type="button" :class="{ selected: design.material === option.id }" @click="design.material = option.id">
              {{ option.label }}
            </button>
          </div>
          <div class="choices">
            <button v-for="count in bracketCounts" :key="count" type="button" :class="{ selected: design.brackets === count }" @click="design.brackets = count">
              {{ count }} brackets
            </button>
          </div>
          <label class="slider">
            Bracket size
            <input v-model.number="design.scale" type="range" min="0.7" max="1.45" step="0.05" />
          </label>

          <h2>Ties</h2>
          <div class="choices">
            <button v-for="option in shapes" :key="option.id" type="button" :class="{ selected: design.shape === option.id }" @click="design.shape = option.id">
              {{ option.label }}
            </button>
          </div>
          <div class="choices">
            <button v-for="option in patterns" :key="option.id" type="button" :class="{ selected: design.pattern === option.id }" @click="design.pattern = option.id">
              {{ option.label }}
            </button>
          </div>
          <div class="swatches" role="listbox" aria-label="Tie color">
            <button
              v-for="color in TIE_COLORS"
              :key="color.id"
              type="button"
              role="option"
              :aria-selected="design.tie === color.value"
              :aria-label="color.label"
              :class="{ selected: design.tie === color.value }"
              :style="{ background: color.value }"
              @click="design.tie = color.value"
            />
          </div>
          <div v-if="design.pattern === 'alternate'" class="swatches" role="listbox" aria-label="Second tie color">
            <button
              v-for="color in TIE_COLORS"
              :key="`alt-${color.id}`"
              type="button"
              role="option"
              :aria-selected="design.tieAlt === color.value"
              :aria-label="`Second ${color.label}`"
              :class="{ selected: design.tieAlt === color.value }"
              :style="{ background: color.value }"
              @click="design.tieAlt = color.value"
            />
          </div>

          <h2>Wire</h2>
          <div class="choices">
            <button v-for="option in wires" :key="option.id" type="button" :class="{ selected: design.wire === option.id }" @click="design.wire = option.id">
              {{ option.label }}
            </button>
          </div>
        </section>

        <p class="note">This is a preview of how braces can look. Your dentist chooses the real treatment.</p>
      </div>

      <ion-modal :is-open="previewOpen" css-class="photo-modal" @did-dismiss="closePreview">
        <ion-header>
          <ion-toolbar>
            <ion-title>Your photo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closePreview">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="photo-content">
          <img v-if="previewUrl" :src="previewUrl" alt="Braces try-on photo" />
          <p>Press and hold the photo to save it to your device.</p>
        </ion-content>
      </ion-modal>
      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2800" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonMenuButton, IonModal,
  IonPage, IonTitle, IonToast, IonToolbar, onIonViewWillEnter, onIonViewWillLeave,
} from '@ionic/vue'
import { cameraReverseOutline, downloadOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import {
  DEFAULT_DESIGN, TIE_COLORS, paintFrame,
  type BracesArch, type BracesDesign, type BracketMaterial, type Landmark, type TiePattern, type TieShape, type WireFinish,
} from '../../features/braces/render'
import { loadFaceTracker, nextVideoTimestamp, smoothLandmarks } from '../../features/braces/tracker'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'

const arches: { id: BracesArch; label: string }[] = [
  { id: 'upper', label: 'Upper' },
  { id: 'lower', label: 'Lower' },
  { id: 'both', label: 'Both' },
]
const materials: { id: BracketMaterial; label: string }[] = [
  { id: 'metal', label: 'Metal' },
  { id: 'ceramic', label: 'Ceramic' },
  { id: 'gold', label: 'Gold' },
]
const shapes: { id: TieShape; label: string }[] = [
  { id: 'square', label: 'Square ties' },
  { id: 'round', label: 'Round ties' },
  { id: 'heart', label: 'Heart ties' },
]
const patterns: { id: TiePattern; label: string }[] = [
  { id: 'solid', label: 'One color' },
  { id: 'alternate', label: 'Two colors' },
  { id: 'rainbow', label: 'Rainbow' },
]
const wires: { id: WireFinish; label: string }[] = [
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'match', label: 'Match ties' },
]
const bracketCounts = [6, 8, 10] as const

const design = reactive<BracesDesign>({ ...DEFAULT_DESIGN })
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const status = ref('Starting the camera…')
const errorMessage = ref('')
const ready = ref(false)
const saving = ref(false)
const toastOpen = ref(false)
const toastMessage = ref('')
const previewOpen = ref(false)
const previewUrl = ref('')
const facingMode = ref<'user' | 'environment'>('user')

let stream: MediaStream | null = null
let tracker: FaceLandmarker | null = null
let frame = 0
let generation = 0
let smoothed: Landmark[] | null = null
let misses = 0

onIonViewWillEnter(() => { void start() })
onIonViewWillLeave(() => stop())
onUnmounted(() => stop())

async function start() {
  const token = ++generation
  releaseCamera()
  errorMessage.value = ''
  ready.value = false
  status.value = 'Starting the camera…'
  if (!navigator.mediaDevices?.getUserMedia) {
    errorMessage.value = 'This browser cannot open the camera. Use the installed app or a current browser.'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
  } catch {
    if (token !== generation) return
    errorMessage.value = 'Camera access is needed for the live try-on. Allow the camera, then try again.'
    return
  }
  if (token !== generation) {
    releaseCamera()
    return
  }
  const video = videoRef.value
  if (!video) return
  video.srcObject = stream
  await video.play()
  status.value = 'Preparing the smile tracker…'
  try {
    tracker = await loadFaceTracker()
  } catch {
    if (token !== generation) return
    errorMessage.value = 'The smile tracker could not start. Reopen this page and try again.'
    return
  }
  if (token !== generation) return
  ready.value = true
  status.value = 'Look at the camera and smile a little.'
  misses = 0
  smoothed = null
  frame = requestAnimationFrame(loop)
}

function loop(now: number) {
  if (!tracker) return
  frame = requestAnimationFrame(loop)
  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas?.getContext('2d')
  if (!video || !canvas || !context || video.readyState < 2) return
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }
  let detected: Landmark[] | null = null
  try {
    detected = tracker.detectForVideo(video, nextVideoTimestamp(now)).faceLandmarks[0] ?? null
  } catch {
    detected = null
  }
  if (detected) {
    misses = 0
    smoothed = smoothLandmarks(smoothed, detected)
  } else if (misses < 4) {
    misses += 1
  } else {
    smoothed = null
  }
  const painted = paintFrame(
    context,
    video,
    canvas.width,
    canvas.height,
    smoothed,
    design,
    facingMode.value === 'user',
  )
  if (!painted.tracked) status.value = 'Center your face in the frame.'
  else if (!painted.mouthOpen) status.value = 'Open into a gentle smile so the braces can sit on your teeth.'
  else status.value = 'Braces are following your smile.'
}

async function flipCamera() {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  await start()
}

async function savePhoto() {
  const canvas = canvasRef.value
  if (!canvas || !ready.value || saving.value) return
  saving.value = true
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('The photo could not be created.')
    const file = new File([blob], `harbor-braces-${Date.now()}.png`, { type: 'image/png' })
    const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
    if (canShare && (Capacitor.isNativePlatform() || window.matchMedia('(pointer: coarse)').matches)) {
      await navigator.share({ files: [file], title: 'Harbor Dental braces preview' })
      showToast('Choose where to save your photo.')
      return
    }
    downloadBlob(blob, file.name)
    showToast('Photo downloaded.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    openPreview(canvas)
    showToast('Press and hold the photo to save it.')
  } finally {
    saving.value = false
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function openPreview(canvas: HTMLCanvasElement) {
  if (previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = canvas.toDataURL('image/png')
  previewOpen.value = true
}

function closePreview() {
  previewOpen.value = false
}

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

function releaseCamera() {
  cancelAnimationFrame(frame)
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  if (videoRef.value) videoRef.value.srcObject = null
  smoothed = null
  ready.value = false
}

function stop() {
  generation += 1
  releaseCamera()
}
</script>

<style scoped>
.page { margin: 0 auto; max-width: 760px; padding: 4px 2px 24px; }
.lead, .note, .status { color: var(--muted); }
.lead { margin: 2px 0 12px; }
.stage-wrap { position: sticky; top: 0; z-index: 2; padding-bottom: 8px; background: var(--canvas); }
.stage {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  max-height: 68vh;
  background: #10242b;
  border-radius: var(--radius-lg);
}
video { display: none; }
canvas, .stage-note {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
canvas { object-fit: cover; }
.stage-note {
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  text-align: center;
  color: white;
}
.status { margin: 10px 2px; min-height: 1.3em; }
.stage-actions { display: flex; gap: 8px; margin-top: 8px; }
.stage-actions ion-button { flex: 1; }
.panel {
  display: grid;
  gap: 10px;
  margin-top: 8px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}
.panel h2 {
  margin: 8px 0 0;
  color: var(--clinic-ink);
  font-size: 0.95rem;
}
.choices, .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.choices button, .swatches button {
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--clinic-ink);
  border-radius: 999px;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 650;
}
.choices button.selected {
  color: white;
  background: var(--clinic-blue);
  border-color: var(--clinic-blue);
}
.swatches button {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
}
.swatches button.selected { outline: 3px solid var(--clinic-blue); outline-offset: 2px; }
.slider { display: grid; gap: 6px; color: var(--clinic-ink); font-weight: 650; }
.slider input { width: 100%; accent-color: var(--clinic-blue); }
.note { margin: 14px 2px 0; font-size: 0.92rem; }

@media (max-width: 800px) {
  .page { padding-bottom: calc(84px + env(safe-area-inset-bottom)); }
  .lead { display: none; }
  .stage {
    aspect-ratio: 4 / 3;
    max-height: 42vh;
  }
  .status { margin: 6px 2px 2px; }
  .stage-actions { margin-top: 6px; }
  .panel { margin-top: 4px; padding: 12px; }
}
.photo-content { --padding-start: 16px; --padding-end: 16px; --padding-top: 16px; }
.photo-content img { display: block; width: min(100%, 420px); margin: 0 auto 12px; border-radius: var(--radius-lg); }
.photo-content p { text-align: center; color: var(--muted); }
</style>
