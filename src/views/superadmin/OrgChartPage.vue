<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Organization</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="org-page">
        <p>
          This chart appears on the public About page. Select a person to change the name, role,
          picture, and short description. Drag a portrait to move it, or add a branch to the left,
          right, or below.
        </p>
        <OrgChart editable :clinic-id="profile?.clinicId" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import OrgChart from '../../components/landing/OrgChart.vue'
import { useAuth } from '../../composables/useAuth'

const { profile } = useAuth()
</script>

<style scoped>
.org-page {
  width: min(1160px, calc(100% - 24px));
  margin: 0 auto;
  padding: 12px 0 32px;
}

.org-page > p {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
</style>
