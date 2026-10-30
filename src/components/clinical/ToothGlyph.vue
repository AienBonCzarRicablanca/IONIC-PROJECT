<template>
  <svg class="glyph" viewBox="0 0 60 100" aria-hidden="true">
    <g :transform="transform">
      <path class="root" :d="shape.roots" />
      <path class="crown" :d="shape.crown" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  kind: 'molar' | 'premolar' | 'canine' | 'central' | 'incisor'
  upper: boolean
  mirror: boolean
}>()

const SHAPES = {
  incisor: {
    roots: 'M24 58C22 40 18 18 26 4C32 0 40 8 38 24C36 42 35 54 32 58C29 61 26 61 24 58Z',
    crown: 'M14 50C10 60 10 78 16 90C21 98 26 100 30 100C34 100 39 98 44 90C50 78 50 60 46 50C40 44 20 44 14 50Z',
  },
  central: {
    roots: 'M24 60C22 42 18 16 27 4C33 0 41 8 39 26C37 44 36 56 33 60C30 63 26 63 24 60Z',
    crown: 'M8 50C4 62 6 80 14 92C20 99 26 100 30 100C34 100 40 99 46 92C54 80 56 62 52 50C44 42 16 42 8 50Z',
  },
  canine: {
    roots: 'M25 62C23 42 18 16 28 3C35 0 43 10 40 32C38 48 37 58 34 62C31 65 27 65 25 62Z',
    crown: 'M12 54C9 64 16 84 30 99C44 84 51 64 48 54C41 48 19 48 12 54Z',
  },
  premolar: {
    roots:
      'M15 48C13 34 11 16 17 8C21 4 24 14 23 28C22 40 21 48 18 50C16 50 15 49 15 48Z M35 50C34 36 35 16 41 8C45 5 48 14 46 30C45 42 44 50 41 50C38 50 36 50 35 50Z',
    crown:
      'M8 46C5 56 6 70 13 80C17 87 21 84 25 76L30 69L35 76C39 84 43 87 47 80C54 70 55 56 52 46C44 39 16 39 8 46Z',
  },
  molar: {
    roots:
      'M9 46C7 32 5 16 11 7C15 3 18 13 17 27C16 38 15 46 12 48Z M26 48C25 32 26 14 30 6C34 2 37 12 36 28C35 40 34 48 31 48Z M43 48C42 34 44 16 49 8C53 5 55 16 53 32C52 42 51 48 48 48Z',
    crown:
      'M3 44C1 56 2 70 9 80C13 87 17 84 20 76L26 66L32 78C35 87 39 88 43 80L47 72L52 80C56 87 59 78 58 68C60 56 58 46 55 44C45 35 14 35 3 44Z',
  },
} as const

const shape = computed(() => SHAPES[props.kind])

const transform = computed(() => {
  if (props.upper && props.mirror) return 'translate(60 0) scale(-1 1)'
  if (!props.upper && !props.mirror) return 'translate(0 100) scale(1 -1)'
  if (!props.upper && props.mirror) return 'translate(60 100) scale(-1 -1)'
  return undefined
})
</script>

<style scoped>
.glyph {
  display: block;
  width: var(--tooth-width, 34px);
  height: 74px;
}

.root,
.crown {
  stroke: var(--tooth-stroke, #5f7d8c);
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.root {
  fill: var(--root-fill, #f4f7f8);
}

.crown {
  fill: var(--crown-fill, #fffdf8);
}

:global(.cond-decayed) {
  --crown-fill: #f3b4b4;
}

:global(.cond-filled) {
  --crown-fill: #a9d4f8;
}

:global(.cond-crown) {
  --crown-fill: #ffe08a;
  --root-fill: #f8f1dc;
}

:global(.cond-root_canal) {
  --crown-fill: #ead7f3;
  --root-fill: #d7b4e6;
}

:global(.cond-missing) {
  --crown-fill: transparent;
  --root-fill: transparent;
  --tooth-stroke: #9aadb6;
}

:global(.cond-missing) .root,
:global(.cond-missing) .crown {
  stroke-dasharray: 3 2;
}
</style>
