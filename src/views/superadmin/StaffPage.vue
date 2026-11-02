<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Staff Management</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="staff-page">
        <PageAction :icon="refreshOutline" :disabled="loading" @click="load">Refresh</PageAction>
        <ion-card>
          <ion-card-content>
            New staff register at <strong>/register</strong> and confirm their email. They appear
            below as Patient; assign them the Admin or Dentist role here.
          </ion-card-content>
        </ion-card>

        <ion-segment v-model="filter" aria-label="Filter accounts">
          <ion-segment-button value="staff"><ion-label>Staff</ion-label></ion-segment-button>
          <ion-segment-button value="patient"><ion-label>Registered patients</ion-label></ion-segment-button>
        </ion-segment>
        <ion-searchbar v-model="search" aria-label="Search accounts" placeholder="Search name or email" />

        <div v-if="loading" class="state-message" role="status">Loading accounts...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">{{ loadError }}</div>
        <p v-else-if="!visible.length" class="state-message">No accounts found.</p>
        <ion-list v-else lines="full">
          <ion-item v-for="account in visible" :key="account.user_id" :detail="false">
            <UserAvatar
              slot="start"
              :name="account.full_name || account.email"
              :path="avatars.pathFor(account.user_id)"
            />
            <ion-label class="ion-text-wrap">
              <h2>{{ account.full_name || account.email }}</h2>
              <p>{{ account.email }}</p>
            </ion-label>
            <ion-chip :color="account.is_active ? 'success' : 'medium'">
              {{ roleLabel(account.role) }}{{ account.is_active ? '' : ' (inactive)' }}
            </ion-chip>
            <ion-button
              v-if="account.role !== 'superadmin' && account.user_id !== profile?.id"
              slot="end"
              size="small"
              fill="clear"
              @click="openEditor(account)"
            >
              Change role
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <ion-modal :is-open="Boolean(editing)" @did-dismiss="editing = null">
        <ion-header>
          <ion-toolbar>
            <ion-title>Change role</ion-title>
            <ion-buttons slot="end"><ion-button :disabled="saving" @click="editing = null">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="form" @submit.prevent="save">
            <p><strong>{{ editing?.full_name || editing?.email }}</strong><br />{{ editing?.email }}</p>
            <ion-select v-model="newRole" label="Role" label-placement="stacked" fill="outline" interface="popover">
              <ion-select-option value="admin">Admin (front desk)</ion-select-option>
              <ion-select-option value="dentist">Dentist</ion-select-option>
              <ion-select-option value="patient">Patient</ion-select-option>
            </ion-select>
            <ion-toggle v-model="isActive">Account active</ion-toggle>
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">Save</ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2600" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
} from '@ionic/vue'
import { refreshOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { useAuth } from '../../composables/useAuth'
import { useAvatarPaths } from '../../composables/useAvatarPaths'
import { type AppRole, type ClinicAccount, listAccounts, setStaffRole } from '../../services/staff.service'

const { profile } = useAuth()
const avatars = useAvatarPaths()
const accounts = ref<ClinicAccount[]>([])
const filter = ref<'staff' | 'patient'>('staff')
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const formError = ref('')
const editing = ref<ClinicAccount | null>(null)
const newRole = ref<AppRole>('admin')
const isActive = ref(true)
const toastOpen = ref(false)
const toastMessage = ref('')

const roleLabel = (role: string) => (role === 'superadmin' ? 'Owner' : role.charAt(0).toUpperCase() + role.slice(1))

const visible = computed(() => {
  const term = search.value.trim().toLowerCase()
  return accounts.value.filter((account) => {
    const isPatient = account.role === 'patient'
    if (filter.value === 'staff' ? isPatient : !isPatient) return false
    return !term || `${account.full_name} ${account.email}`.toLowerCase().includes(term)
  })
})

watch(visible, (rows) => void avatars.load(rows.map((account) => account.user_id)), { immediate: true })

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    accounts.value = await listAccounts()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load accounts.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openEditor(account: ClinicAccount) {
  editing.value = account
  newRole.value = account.role === 'superadmin' ? 'admin' : account.role
  isActive.value = account.is_active
  formError.value = ''
}

async function save() {
  if (!editing.value) return
  saving.value = true
  formError.value = ''
  try {
    await setStaffRole(editing.value.user_id, newRole.value, isActive.value)
    editing.value = null
    toastMessage.value = 'Account updated. The user may need to sign in again.'
    toastOpen.value = true
    await load()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not update the account.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.staff-page {
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.form {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
