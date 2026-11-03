<template>
  <header class="dash-hero">
    <div>
      <p class="dash-kicker">{{ dateLabel }} · {{ role }}</p>
      <h2>{{ greeting }}, {{ firstName }}</h2>
      <p class="dash-summary">{{ summary }}</p>
    </div>
    <ion-button fill="outline" size="small" :disabled="refreshing" @click="emit('refresh')">
      <ion-icon slot="start" :icon="refreshOutline" />
      Refresh
    </ion-button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { refreshOutline } from 'ionicons/icons'

const props = defineProps<{
  name: string
  role: string
  summary: string
  refreshing?: boolean
}>()

const emit = defineEmits<{ refresh: [] }>()

const firstName = computed(() => props.name.trim().split(/\s+/)[0] || 'there')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
const dateLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()),
)
</script>
