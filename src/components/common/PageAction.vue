<template>
  <div class="page-action">
    <ion-button size="small" :disabled="disabled" @click="emit('click')">
      <ion-icon slot="start" :icon="icon" aria-hidden="true" />
      <slot />
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'

defineProps<{
  icon: string
  disabled?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.page-action {
  display: flex;
  justify-content: flex-end;
}

.page-action ion-button {
  --border-radius: 999px;
  --padding-start: 12px;
  --padding-end: 14px;
  margin: 0;
  min-height: 36px;
  font-size: 0.86rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  text-transform: none;
}

.page-action ion-icon {
  font-size: 1.05rem;
}
</style>
