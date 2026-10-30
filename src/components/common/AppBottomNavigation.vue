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
  --background: var(--surface);
  --border: 0;
  height: calc(62px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid var(--line);
}

ion-tab-button {
  --color: var(--muted);
  --color-selected: var(--clinic-blue-deep);
  --padding-top: 6px;
  --padding-bottom: 4px;
  min-width: 0;
  min-height: 56px;
}

ion-tab-button.tab-selected {
  box-shadow: inset 0 3px 0 var(--clinic-teal);
}

ion-icon {
  font-size: 22px;
}

ion-label {
  overflow: hidden;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
