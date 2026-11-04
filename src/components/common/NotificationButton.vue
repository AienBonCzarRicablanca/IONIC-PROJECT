<template>
  <span v-if="href" class="notify-wrap">
    <ion-button
      class="notify-button"
      :class="{ 'notify-current': current }"
      fill="clear"
      :router-link="href"
      :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'"
    >
      <ion-icon slot="icon-only" :icon="notificationsOutline" />
    </ion-button>
    <span v-if="unread" class="notify-count">{{ unread > 9 ? '9+' : unread }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonIcon } from '@ionic/vue'
import { notificationsOutline } from 'ionicons/icons'
import { useAuth } from '../../composables/useAuth'
import { countUnreadNotifications } from '../../services/portal.service'

const route = useRoute()
const { profile, session } = useAuth()
const unread = ref(0)

const href = computed(() => {
  const role = profile.value?.role
  if (role === 'superadmin') return '/superadmin/notifications'
  if (role === 'admin') return '/admin/notifications'
  if (role === 'dentist') return '/dentist/notifications'
  if (role === 'patient') return '/patient/notifications'
  return ''
})
const current = computed(() => route.path.endsWith('/notifications'))

async function refresh() {
  const userId = session.value?.user.id
  if (!userId || !href.value) {
    unread.value = 0
    return
  }
  unread.value = await countUnreadNotifications(userId)
}

onMounted(() => void refresh())
watch(() => [session.value?.user.id, href.value, route.fullPath], () => void refresh())
</script>

<style scoped>
.notify-wrap {
  position: relative;
  display: inline-flex;
}

.notify-button {
  --color: var(--clinic-ink);
  width: 44px;
  height: 44px;
  margin: 0 4px 0 0;
}

.notify-current {
  --color: var(--clinic-blue);
}

.notify-count {
  position: absolute;
  top: 6px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--ion-color-danger);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 750;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
}
</style>
