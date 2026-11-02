<template>
  <ion-button
    v-if="header"
    class="theme-header"
    fill="clear"
    :aria-label="ariaLabel"
    @click="cycle"
  >
    <ion-icon slot="icon-only" :icon="icon" />
  </ion-button>
  <button
    v-else
    type="button"
    class="theme-switch"
    :class="{ 'theme-switch-icon': iconOnly }"
    :aria-label="ariaLabel"
    @click="cycle"
  >
    <ion-icon :icon="icon" aria-hidden="true" />
    <span v-if="!iconOnly">{{ label }} theme</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { useTheme } from '../../composables/useTheme'

defineProps<{
  iconOnly?: boolean
  header?: boolean
}>()

const { label, icon, cycle } = useTheme()
const ariaLabel = computed(() => `${label.value} theme. Activate to change the color theme.`)
</script>

<style scoped>
.theme-header {
  --color: var(--clinic-ink);
  width: 44px;
  height: 44px;
  margin: 0;
}

.theme-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% - 28px);
  min-height: 44px;
  margin: 0 14px 8px;
  padding: 0 12px;
  color: var(--clinic-ink);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 12px;
  font: inherit;
  font-size: 0.94rem;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

.theme-switch ion-icon {
  color: var(--clinic-blue);
  font-size: 20px;
}

.theme-switch-icon {
  width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0;
  justify-content: center;
  border-radius: 12px;
}

.theme-switch:focus-visible {
  outline: 2px solid var(--clinic-blue);
  outline-offset: 2px;
}
</style>
