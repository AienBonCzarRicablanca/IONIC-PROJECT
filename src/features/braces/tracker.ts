import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark } from './render'

let landmarker: FaceLandmarker | null = null
let loading: Promise<FaceLandmarker> | null = null
let lastStamp = 0

export function loadFaceTracker() {
  if (landmarker) return Promise.resolve(landmarker)
  if (!loading) {
    loading = createTracker().catch((error: unknown) => {
      loading = null
      throw error
    })
  }
  return loading
}

export function nextVideoTimestamp(now: number) {
  lastStamp = Math.max(lastStamp + 1, Math.round(now))
  return lastStamp
}

export function smoothLandmarks(previous: Landmark[] | null, next: Landmark[] | null) {
  if (!next) return null
  if (!previous || previous.length !== next.length) return next.map(({ x, y }) => ({ x, y }))
  const alpha = 0.62
  return next.map((point, index) => ({
    x: previous[index].x + (point.x - previous[index].x) * alpha,
    y: previous[index].y + (point.y - previous[index].y) * alpha,
  }))
}

async function createTracker() {
  const vision = await import('@mediapipe/tasks-vision')
  const origin = window.location.origin
  const fileset = {
    wasmLoaderPath: `${origin}/mediapipe/vision_wasm_nosimd_internal.js`,
    wasmBinaryPath: `${origin}/mediapipe/vision_wasm_nosimd_internal.wasm`,
  }
  const modelAssetPath = `${origin}/models/face_landmarker.task`
  const options = {
    baseOptions: { modelAssetPath, delegate: 'GPU' as const },
    runningMode: 'VIDEO' as const,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  }
  try {
    landmarker = await vision.FaceLandmarker.createFromOptions(fileset, options)
  } catch {
    landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath, delegate: 'CPU' },
    })
  }
  return landmarker
}
