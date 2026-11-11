<template>
  <div class="ph-contact">
    <ion-input
      ref="field"
      :value="shown"
      :label="label"
      label-placement="stacked"
      fill="outline"
      type="tel"
      inputmode="numeric"
      autocomplete="tel"
      :placeholder="placeholder"
      :required="required"
      @ionInput="onInput"
    />
    <p v-if="warning" class="ph-limit" role="alert">{{ warning }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { IonInput } from '@ionic/vue'

const LIMIT = 'Philippine contact numbers stop at 11 digits.'

const model = defineModel<string | null>({ default: '' })

defineProps<{
  label: string
  placeholder?: string
  required?: boolean
}>()

const field = ref<{ $el: HTMLElement & { getInputElement: () => Promise<HTMLInputElement> } } | null>(null)
const warning = ref('')
let native: HTMLInputElement | null = null

const shown = computed(() => digits(model.value).slice(0, 11))

watch(
  model,
  (value) => {
    if (value == null || value === '') return
    const only = digits(value)
    const next = only.slice(0, 11)
    if (only.length > 11) warning.value = LIMIT
    if (next !== value) model.value = next
  },
  { immediate: true },
)

onMounted(() => {
  void bindKeys()
})

onUnmounted(() => {
  native?.removeEventListener('keydown', onKey)
})

async function bindKeys() {
  native = (await field.value?.$el.getInputElement()) ?? null
  native?.addEventListener('keydown', onKey)
}

function onKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  if (event.key.length !== 1 || !/\d/.test(event.key)) return
  if (digits(model.value).length < 11) return
  const input = event.target as HTMLInputElement
  if ((input.selectionStart ?? 0) !== (input.selectionEnd ?? 0)) return
  event.preventDefault()
  warning.value = LIMIT
}

function onInput(event: CustomEvent) {
  const host = event.target as HTMLElement & { value?: string | null }
  const raw = String(host.value ?? '')
  const only = digits(raw)
  const next = only.slice(0, 11)
  if (only.length > 11) warning.value = LIMIT
  else if (next.length < 11) warning.value = ''
  if (host.value !== next) host.value = next
  model.value = next
}

function digits(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '')
}
</script>

<style scoped>
.ph-contact {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.ph-limit {
  margin: 0;
  color: var(--ion-color-warning-shade, #8a5a00);
  font-size: 13px;
  line-height: 1.4;
}
</style>
