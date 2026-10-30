<template>
  <ion-button
    class="notify-button"
    :class="{ 'notify-current': current }"
    fill="clear"
    router-link="/patient/notifications"
    aria-label="Notifications"
  >
    <ion-icon slot="icon-only" :icon="notificationsOutline" />
  </ion-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonIcon } from '@ionic/vue'
import { notificationsOutline } from 'ionicons/icons'

const route = useRoute()
const current = computed(() => route.path.startsWith('/patient/notifications'))
</script>

<style scoped>
.notify-button {
  --color: var(--clinic-ink);
  width: 44px;
  height: 44px;
  margin: 0 4px 0 0;
}

.notify-current {
  --color: var(--clinic-blue);
}
</style>
