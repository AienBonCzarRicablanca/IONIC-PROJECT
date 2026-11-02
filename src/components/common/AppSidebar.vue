<template>
  <ion-menu content-id="main-content" menu-id="app-menu" type="overlay" class="app-sidebar">
    <ion-header class="sidebar-header">
      <ion-toolbar>
        <router-link to="/" class="sidebar-brand">
          <img class="sidebar-brand-mark" :src="'/logo.png'" alt="" />
          <strong>harbor<span> dental</span></strong>
        </router-link>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="sidebar-profile">
        <ion-menu-toggle :auto-hide="false">
          <router-link
            to="/profile"
            class="sidebar-user"
            :class="{ 'sidebar-user-active': isActive('/profile') }"
            :aria-current="isActive('/profile') ? 'page' : undefined"
          >
            <ion-avatar>
              <img v-if="avatarUrl" :src="avatarUrl" alt="" />
              <span v-else>{{ initials }}</span>
            </ion-avatar>
            <div>
              <strong>{{ name }}</strong>
              <small>{{ roleLabel }}</small>
              <small v-if="avatarError" class="sidebar-avatar-error" role="alert">{{ avatarError }}</small>
            </div>
          </router-link>
        </ion-menu-toggle>
      </div>
      <ion-list lines="none" class="sidebar-list">
        <ion-menu-toggle v-for="item in items" :key="item.path" :auto-hide="false">
          <ion-item
            button
            :detail="false"
            :router-link="item.path"
            router-direction="root"
            :class="{ 'sidebar-active': isActive(item.path) }"
            :aria-current="isActive(item.path) ? 'page' : undefined"
          >
            <ion-icon slot="start" :icon="item.icon" aria-hidden="true" />
            <ion-label>{{ item.label }}</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>

    <ion-footer>
      <ion-button
        fill="outline"
        expand="block"
        class="sidebar-logout"
        :disabled="loggingOut"
        @click="emit('logout')"
      >
        <ion-spinner v-if="loggingOut" slot="start" name="crescent" />
        <ion-icon v-else slot="start" :icon="logOutOutline" />
        {{ loggingOut ? 'Signing out...' : 'Sign out' }}
      </ion-button>
    </ion-footer>
  </ion-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonSpinner,
  IonToolbar,
} from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'
import type { NavItem } from '../../types'

const props = defineProps<{
  items: NavItem[]
  name: string
  avatarUrl: string | null
  avatarError: string
  roleLabel: string
  loggingOut: boolean
}>()

const emit = defineEmits<{ logout: [] }>()
const route = useRoute()

const initials = computed(
  () =>
    props.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?',
)

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<style scoped>
.app-sidebar {
  --background: var(--sidebar);
  --width: 280px;
  border-inline-end: 1px solid var(--line);
}

.app-sidebar ion-toolbar {
  --background: var(--sidebar);
  --border-width: 0 0 1px;
  --border-color: var(--line);
  --min-height: 72px;
}

.app-sidebar ion-content {
  --background: var(--sidebar);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 16px;
  color: var(--clinic-ink);
  letter-spacing: -0.04em;
  text-decoration: none;
}

.sidebar-brand strong {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 500;
}

.sidebar-brand strong span {
  color: var(--clinic-blue);
}

.sidebar-brand-mark {
  width: 36px;
  height: 36px;
  display: block;
  border-radius: 10px;
  object-fit: cover;
}

.sidebar-list {
  padding: 10px 12px 14px;
  background: transparent;
}

.sidebar-list ion-item {
  --border-radius: 12px;
  --min-height: 46px;
  --background: transparent;
  --color: var(--clinic-ink);
  --padding-start: 12px;
  --inner-padding-end: 12px;
  margin-bottom: 4px;
  font-size: 0.94rem;
  font-weight: 600;
}

.sidebar-list ion-icon {
  color: var(--muted);
  font-size: 20px;
}

.sidebar-list ion-item.sidebar-active {
  --background: var(--accent-soft);
  --color: var(--clinic-blue-deep);
  box-shadow: inset 3px 0 0 var(--clinic-teal);
}

.sidebar-list ion-item.sidebar-active ion-icon {
  color: var(--clinic-blue);
}

.sidebar-header {
  box-shadow: none;
}

.sidebar-profile {
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--line);
  background: var(--sidebar);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 12px 10px;
  padding: 10px;
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.sidebar-user:hover,
.sidebar-user:focus-visible {
  background: var(--accent-soft);
  outline: none;
}

.sidebar-user-active {
  background: var(--accent-soft);
}

.sidebar-user ion-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--clinic-blue);
  font-size: 13px;
  font-weight: 700;
}

.sidebar-user ion-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-user > div {
  min-width: 0;
  display: grid;
}

.sidebar-user strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-user small {
  color: var(--muted);
  font-size: 11px;
}

.sidebar-user .sidebar-avatar-error {
  color: var(--ion-color-danger);
}

.app-sidebar ion-footer {
  --background: var(--sidebar);
  background: var(--sidebar);
}

.sidebar-logout {
  --border-radius: 12px;
  --border-color: var(--line-strong);
  --color: var(--clinic-ink);
  margin: 14px 14px calc(14px + env(safe-area-inset-bottom));
  font-weight: 650;
}
</style>
