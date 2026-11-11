<template>
  <ion-tab-bar class="app-bottom-nav" slot="bottom" aria-label="Primary navigation">
    <ion-tab-button
      v-for="item in visibleItems"
      :key="item.path"
      :tab="item.path"
      :selected="isActive(item.path)"
      @click="router.push(item.path)"
    >
      <ion-icon :icon="item.icon" aria-hidden="true" />
      <ion-label>{{ item.label }}</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/vue'
import type { NavItem } from '../../types'

const props = defineProps<{ items: NavItem[] }>()
const route = useRoute()
const router = useRouter()

// The remaining pages are reachable from the side menu.
const visibleItems = computed(() => props.items.slice(0, 5))

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<style scoped>
.app-bottom-nav {
  --background: color-mix(in srgb, var(--surface) 88%, transparent);
  --border: 0;
  height: calc(74px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid color-mix(in srgb, var(--line) 65%, transparent);
  backdrop-filter: blur(12px);
}

ion-tab-button {
  --color: var(--muted);
  --color-selected: var(--clinic-blue);
  --padding-top: 6px;
  --padding-bottom: 4px;
  min-width: 0;
  min-height: 64px;
}

ion-icon {
  width: 34px;
  height: 34px;
  padding: 6px;
  border-radius: 999px;
  font-size: 20px;
}

ion-tab-button.tab-selected ion-icon {
  color: #fff;
  background: #287f91;
}

ion-label {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 2px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.15;
  white-space: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
