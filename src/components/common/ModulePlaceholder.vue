<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" class="menu-button-wrap">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="placeholder-content">
      <div class="placeholder-wrap">
        <ion-card class="welcome-card">
          <ion-card-header>
            <ion-card-subtitle>{{ roleLabel }}</ion-card-subtitle>
            <ion-card-title>Hello, {{ firstName }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            You are signed in and your access to this area was verified against your account role.
          </ion-card-content>
        </ion-card>

        <ion-card class="module-card">
          <ion-card-content>
            <ion-chip color="medium">Not built yet</ion-chip>
            <h2>{{ title }}</h2>
            <p>
              This page is a navigation placeholder. The real feature will be implemented in
              <strong>{{ sprint }}</strong>.
            </p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import HeaderTools from './HeaderTools.vue'
import { useAuth } from '../../composables/useAuth'
import { ROLE_LABEL } from '../../types'

const route = useRoute()
const { profile } = useAuth()

const title = computed(() => String(route.meta.title ?? 'Page'))
const sprint = computed(() => String(route.meta.sprint ?? 'a later sprint'))
const firstName = computed(() => profile.value?.fullName.split(' ')[0] ?? 'there')
const roleLabel = computed(() => (profile.value ? ROLE_LABEL[profile.value.role] : ''))
</script>

<style scoped>
.placeholder-content {
  --background: var(--canvas);
}

.placeholder-wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 4px;
}

.module-card h2 {
  margin: 8px 0 6px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-weight: 500;
}

.module-card p {
  margin: 0;
  line-height: 1.6;
}

.welcome-card ion-card-title {
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-weight: 500;
}
</style>
