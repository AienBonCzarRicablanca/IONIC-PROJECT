<template>
  <ion-page class="app-shell">
    <ion-split-pane content-id="main-content" when="lg">
      <AppSidebar
        :items="items"
        :name="name"
        :avatar-url="avatarUrl"
        :avatar-error="avatarError"
        :role-label="roleLabel"
        :logging-out="loggingOut"
        @logout="handleLogout"
      />
      <div id="main-content" class="ion-page layout-main">
        <ion-router-outlet class="layout-outlet" />
        <AppBottomNavigation class="layout-bottom-nav" :items="items" />
      </div>
    </ion-split-pane>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { alertController, IonPage, IonRouterOutlet, IonSplitPane } from '@ionic/vue'
import AppBottomNavigation from '../components/common/AppBottomNavigation.vue'
import AppSidebar from '../components/common/AppSidebar.vue'
import { useAuth } from '../composables/useAuth'
import { NAV_ITEMS } from '../config/navigation'
import { getAvatarUrl } from '../services/profile.service'
import { ROLE_LABEL, type UserRole } from '../types'

const props = defineProps<{ role: UserRole }>()
const router = useRouter()
const { profile, logout } = useAuth()
const loggingOut = ref(false)
const avatarUrl = ref<string | null>(null)
const avatarError = ref('')
let avatarRequest = 0

const items = computed(() => NAV_ITEMS[props.role])
const name = computed(() => profile.value?.fullName ?? '')
const roleLabel = computed(() => ROLE_LABEL[props.role])

watch(
  () => profile.value?.avatarPath,
  async (path) => {
    const request = ++avatarRequest
    avatarUrl.value = null
    avatarError.value = ''
    if (!path) return
    try {
      const url = await getAvatarUrl(path)
      if (request === avatarRequest) avatarUrl.value = url
    } catch (error) {
      if (request === avatarRequest) {
        avatarUrl.value = null
        avatarError.value =
          error instanceof Error ? error.message : 'Could not load your profile picture.'
      }
    }
  },
  { immediate: true },
)

async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await logout()
    await router.replace('/login')
  } catch (error) {
    const alert = await alertController.create({
      header: 'Unable to sign out',
      message: error instanceof Error ? error.message : 'Please try again.',
      buttons: ['OK'],
    })
    await alert.present()
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.layout-main {
  display: flex;
  flex-direction: column;
}

ion-split-pane {
  --side-width: 280px;
  --side-max-width: 280px;
  --border: 0;
}

.layout-outlet {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* Side menu replaces the bottom bar on large screens. */
@media (min-width: 992px) {
  .layout-bottom-nav {
    display: none;
  }
}
</style>
