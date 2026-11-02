export interface Landmark {
  x: number
  y: number
}

export type BracesArch = 'upper' | 'lower' | 'both'
export type BracketMaterial = 'metal' | 'ceramic' | 'gold'
export type TieShape = 'square' | 'round' | 'heart'
export type TiePattern = 'solid' | 'alternate' | 'rainbow'
export type WireFinish = 'silver' | 'gold' | 'white' | 'black' | 'match'

export interface BracesDesign {
  arch: BracesArch
  material: BracketMaterial
  tie: string
  tieAlt: string
  pattern: TiePattern
  shape: TieShape
  wire: WireFinish
  brackets: 6 | 8 | 10
  scale: number
}

export const DEFAULT_DESIGN: BracesDesign = {
  arch: 'both',
  material: 'metal',
  tie: '#2aa7b8',
  tieAlt: '#f7f4ee',
  pattern: 'solid',
  shape: 'square',
  wire: 'silver',
  brackets: 8,
  scale: 1,
}

export const TIE_COLORS = [
  { id: 'clear', label: 'Clear', value: '#f7f4ee' },
  { id: 'pink', label: 'Pink', value: '#e85a8c' },
  { id: 'red', label: 'Red', value: '#d64545' },
  { id: 'orange', label: 'Orange', value: '#ef8a34' },
  { id: 'yellow', label: 'Yellow', value: '#f2c14e' },
  { id: 'green', label: 'Green', value: '#3cbf7a' },
  { id: 'teal', label: 'Teal', value: '#2aa7b8' },
  { id: 'blue', label: 'Blue', value: '#3b82f6' },
  { id: 'purple', label: 'Purple', value: '#8b5cf6' },
  { id: 'black', label: 'Black', value: '#2a2f36' },
] as const

const RAINBOW = ['#d64545', '#ef8a34', '#f2c14e', '#3cbf7a', '#2aa7b8', '#3b82f6', '#8b5cf6', '#e85a8c']

const UPPER_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
const LOWER_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]

export interface PaintResult {
  tracked: boolean
  mouthOpen: boolean
}

interface Point {
  x: number
  y: number
}

export function paintFrame(
  ctx: CanvasRenderingContext2D,
  video: CanvasImageSource,
  width: number,
  height: number,
  landmarks: Landmark[] | null,
  design: BracesDesign,
  mirror: boolean,
): PaintResult {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  if (mirror) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, width, height)
  ctx.restore()

  if (!landmarks || landmarks.length < 400) return { tracked: false, mouthOpen: false }

  const toPoint = (index: number): Point => {
    const mark = landmarks[index]
    return {
      x: (mirror ? 1 - mark.x : mark.x) * width,
      y: mark.y * height,
    }
  }

  const left = toPoint(61)
  const right = toPoint(291)
  const mouthWidth = Math.hypot(right.x - left.x, right.y - left.y)
  const opening = Math.hypot(toPoint(13).x - toPoint(14).x, toPoint(13).y - toPoint(14).y)
  const open = mouthWidth > 12 && opening / mouthWidth >= 0.11

  if (open) {
    const upper = shiftToward(points(toPoint, UPPER_INNER), points(toPoint, LOWER_INNER), 0.36)
    const lower = shiftToward(points(toPoint, LOWER_INNER), points(toPoint, UPPER_INNER), 0.36)
    const size = mouthWidth * 0.072 * design.scale
    if (design.arch !== 'lower') drawArch(ctx, upper, design, size)
    if (design.arch !== 'upper') drawArch(ctx, lower, design, size * 0.94)
  }

  return { tracked: true, mouthOpen: open }
}

function points(toPoint: (index: number) => Point, indexes: number[]) {
  return indexes.map(toPoint)
}

function shiftToward(from: Point[], toward: Point[], amount: number): Point[] {
  return from.map((point, index) => {
    const target = toward[Math.min(index, toward.length - 1)]
    return {
      x: point.x + (target.x - point.x) * amount,
      y: point.y + (target.y - point.y) * amount,
    }
  })
}

function drawArch(ctx: CanvasRenderingContext2D, curve: Point[], design: BracesDesign, size: number) {
  const wire = wireColor(design)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = wire
  ctx.lineWidth = Math.max(1.5, size * 0.16)
  ctx.shadowColor = 'rgba(18, 40, 48, 0.28)'
  ctx.shadowBlur = size * 0.25
  strokeSmooth(ctx, curve)
  ctx.restore()

  const brackets = resample(curve, design.brackets)
  brackets.forEach((point, index) => {
    const previous = brackets[Math.max(0, index - 1)]
    const next = brackets[Math.min(brackets.length - 1, index + 1)]
    const angle = Math.atan2(next.y - previous.y, next.x - previous.x)
    drawBracket(ctx, point, angle, size, design, tieColor(design, index), wire)
  })
}

function drawBracket(
  ctx: CanvasRenderingContext2D,
  point: Point,
  angle: number,
  size: number,
  design: BracesDesign,
  tie: string,
  wire: string,
) {
  const width = size * 1.22
  const height = size * 0.96
  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.rotate(angle)
  ctx.shadowColor = 'rgba(18, 40, 48, 0.35)'
  ctx.shadowBlur = size * 0.28
  ctx.shadowOffsetY = size * 0.06

  if (design.shape === 'heart') {
    ctx.fillStyle = tie
    traceHeart(ctx, size * 0.72)
    ctx.fill()
  } else if (design.shape === 'round') {
    ctx.fillStyle = tie
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = tie
    roundRect(ctx, -width / 2, -height / 2, width, height, size * 0.16)
    ctx.fill()
  }

  ctx.shadowColor = 'transparent'
  const body = Math.min(width, height) * 0.62
  const fill = bracketFill(ctx, design.material, body)
  roundRect(ctx, -body / 2, -body / 2, body, body, size * 0.1)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = design.material === 'gold' ? '#8a6418' : 'rgba(40, 55, 64, 0.45)'
  ctx.lineWidth = Math.max(1, size * 0.045)
  ctx.stroke()

  ctx.strokeStyle = shade(wire, -28)
  ctx.lineWidth = Math.max(1.25, size * 0.11)
  ctx.beginPath()
  ctx.moveTo(-body * 0.42, 0)
  ctx.lineTo(body * 0.42, 0)
  ctx.stroke()
  ctx.restore()
}

function bracketFill(ctx: CanvasRenderingContext2D, material: BracketMaterial, size: number) {
  const fill = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2)
  if (material === 'ceramic') {
    fill.addColorStop(0, '#ffffff')
    fill.addColorStop(1, '#e6dfd4')
  } else if (material === 'gold') {
    fill.addColorStop(0, '#fff4cc')
    fill.addColorStop(0.48, '#e2b34a')
    fill.addColorStop(1, '#a97820')
  } else {
    fill.addColorStop(0, '#f8fbfc')
    fill.addColorStop(0.42, '#c5ced6')
    fill.addColorStop(1, '#74828d')
  }
  return fill
}

function wireColor(design: BracesDesign) {
  if (design.wire === 'gold') return '#e0b45a'
  if (design.wire === 'white') return '#f4efe6'
  if (design.wire === 'black') return '#2c3136'
  if (design.wire === 'match') return design.tie
  return '#d5dde6'
}

function tieColor(design: BracesDesign, index: number) {
  if (design.pattern === 'rainbow') return RAINBOW[index % RAINBOW.length]
  if (design.pattern === 'alternate' && index % 2 === 1) return design.tieAlt
  return design.tie
}

function strokeSmooth(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length - 1; index += 1) {
    const next = points[index + 1]
    ctx.quadraticCurveTo(points[index].x, points[index].y, (points[index].x + next.x) / 2, (points[index].y + next.y) / 2)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function resample(points: Point[], count: number): Point[] {
  const lengths = [0]
  for (let index = 1; index < points.length; index += 1) {
    lengths.push(lengths[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y))
  }
  const total = lengths[lengths.length - 1] || 1
  return Array.from({ length: count }, (_, index) => {
    const target = total * ((index + 0.5) / count)
    const segment = Math.max(1, lengths.findIndex((length) => length >= target))
    const start = lengths[segment - 1]
    const span = lengths[segment] - start || 1
    const mix = (target - start) / span
    return {
      x: points[segment - 1].x + (points[segment].x - points[segment - 1].x) * mix,
      y: points[segment - 1].y + (points[segment].y - points[segment - 1].y) * mix,
    }
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function traceHeart(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath()
  ctx.moveTo(0, size * 0.35)
  ctx.bezierCurveTo(-size * 1.15, -size * 0.55, -size * 0.35, -size * 1.15, 0, -size * 0.42)
  ctx.bezierCurveTo(size * 0.35, -size * 1.15, size * 1.15, -size * 0.55, 0, size * 0.55)
  ctx.closePath()
}

function shade(hex: string, amount: number) {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex
  const channels = [0, 2, 4].map((start) => {
    const channel = Number.parseInt(value.slice(start, start + 2), 16)
    return Math.max(0, Math.min(255, channel + amount))
  })
  return `rgb(${channels.join(',')})`
}
