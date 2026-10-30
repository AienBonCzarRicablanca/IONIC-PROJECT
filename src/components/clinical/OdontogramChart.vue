<template>
  <div class="odonto-scroll">
    <div class="odonto" role="group" aria-label="Dental chart">
      <div
        v-for="(pair, index) in columns"
        :key="pair.upper"
        class="column"
        :class="{ split: index === midline }"
      >
        <component
          :is="interactive ? 'button' : 'div'"
          :type="interactive ? 'button' : undefined"
          class="hit"
          :class="hitClass(pair.upper)"
          :aria-label="ariaLabel(pair.upper)"
          :aria-pressed="interactive ? selected === pair.upper : undefined"
          @click="choose(pair.upper)"
        >
          <span class="num">{{ label(pair.upper) }}</span>
          <ToothGlyph :kind="kindOf(pair.upper)" :upper="true" :mirror="index >= midline" />
          <OcclusalMark />
        </component>

        <component
          :is="interactive ? 'button' : 'div'"
          :type="interactive ? 'button' : undefined"
          class="hit"
          :class="hitClass(pair.lower)"
          :aria-label="ariaLabel(pair.lower)"
          :aria-pressed="interactive ? selected === pair.lower : undefined"
          @click="choose(pair.lower)"
        >
          <OcclusalMark />
          <ToothGlyph :kind="kindOf(pair.lower)" :upper="false" :mirror="index >= midline" />
          <span class="num">{{ label(pair.lower) }}</span>
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DentalCondition } from '../../services/clinical.service'
import OcclusalMark from './OcclusalMark.vue'
import ToothGlyph from './ToothGlyph.vue'

type Dentition = 'adult' | 'primary'
type Kind = 'molar' | 'premolar' | 'canine' | 'central' | 'incisor'

const props = withDefaults(
  defineProps<{
    dentition: Dentition
    teeth: Map<number, { condition: DentalCondition }>
    selected?: number | null
    interactive?: boolean
  }>(),
  { selected: null, interactive: false },
)

const emit = defineEmits<{ select: [tooth: number] }>()

const columns = computed(() => {
  if (props.dentition === 'adult') {
    return Array.from({ length: 16 }, (_, index) => ({
      upper: index + 1,
      lower: 32 - index,
    }))
  }
  return Array.from({ length: 10 }, (_, index) => ({
    upper: 51 + index,
    lower: 70 - index,
  }))
})

const midline = computed(() => (props.dentition === 'adult' ? 8 : 5))

function fromPatientsRight(tooth: number) {
  if (tooth <= 16) return tooth
  if (tooth <= 32) return 33 - tooth
  if (tooth <= 60) return tooth - 50
  return 71 - tooth
}

function kindOf(tooth: number): Kind {
  const place = fromPatientsRight(tooth)
  const primary = tooth > 32
  if (primary) {
    if ([1, 2, 9, 10].includes(place)) return 'molar'
    if ([3, 8].includes(place)) return 'canine'
    if ([5, 6].includes(place)) return 'central'
    return 'incisor'
  }
  if ([1, 2, 3, 14, 15, 16].includes(place)) return 'molar'
  if ([4, 5, 12, 13].includes(place)) return 'premolar'
  if ([6, 11].includes(place)) return 'canine'
  if ([8, 9].includes(place)) return 'central'
  return 'incisor'
}

function label(tooth: number) {
  return tooth > 32 ? String.fromCharCode(65 + (tooth - 51)) : String(tooth)
}

function conditionOf(tooth: number): DentalCondition {
  return props.teeth.get(tooth)?.condition ?? 'healthy'
}

function hitClass(tooth: number) {
  return [`cond-${conditionOf(tooth)}`, `kind-${kindOf(tooth)}`, { selected: props.selected === tooth }]
}

function ariaLabel(tooth: number) {
  const condition = conditionOf(tooth).replace('_', ' ')
  return `Tooth ${label(tooth)}, ${condition}`
}

function choose(tooth: number) {
  if (props.interactive) emit('select', tooth)
}
</script>

<style scoped>
.odonto-scroll {
  overflow-x: auto;
  margin: 8px 0 14px;
  padding-bottom: 4px;
}

.odonto {
  display: flex;
  justify-content: center;
  gap: 3px;
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
  padding: 14px 12px 10px;
  background: #f6fafa;
  border: 1px solid #d5e4e6;
  border-radius: 18px;
}

.column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.column.split {
  margin-left: 16px;
}

.hit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin: 0;
  padding: 3px 1px;
  color: #6d848c;
  background: transparent;
  border: 0;
  border-radius: 12px;
  font: inherit;
}

button.hit {
  cursor: pointer;
}

button.hit:hover {
  background: rgb(40 127 145 / 8%);
}

.hit.selected {
  background: #e5f3f1;
  box-shadow: inset 0 0 0 2px #287f91;
}

.hit:focus-visible {
  outline: 2px solid #287f91;
  outline-offset: 2px;
}

.num {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
}

.hit.selected .num {
  color: #1c5966;
}

.kind-molar {
  --tooth-width: 46px;
}

.kind-premolar {
  --tooth-width: 36px;
}

.kind-canine {
  --tooth-width: 34px;
}

.kind-central {
  --tooth-width: 34px;
}

.kind-incisor {
  --tooth-width: 28px;
}
</style>
