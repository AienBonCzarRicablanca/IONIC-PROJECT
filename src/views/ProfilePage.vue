<template>
  <ion-page class="app-shell">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" text="" aria-label="Back" />
        </ion-buttons>
        <ion-title>My Profile</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="profile-page">
        <ion-card v-if="requiresProfileCompletion" color="warning">
          <ion-card-content>
            Please complete your personal information first. This is required before you can book
            appointments and access important patient transactions.
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Profile picture</ion-card-title></ion-card-header>
          <ion-card-content class="avatar-editor">
            <ion-avatar class="profile-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Your profile picture" />
              <span v-else>{{ initials }}</span>
            </ion-avatar>
            <div class="avatar-actions">
              <p>JPG, PNG, or WebP · maximum 2 MB</p>
              <input
                ref="fileInput"
                class="file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="selectAvatar"
              />
              <ion-button fill="outline" :disabled="avatarSaving" @click="fileInput?.click()">
                {{ avatarSaving ? 'Uploading...' : 'Choose picture' }}
              </ion-button>
              <p v-if="avatarError" class="error-message" role="alert">{{ avatarError }}</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Personal information</ion-card-title></ion-card-header>
          <ion-card-content>
            <form class="profile-form" @submit.prevent="saveDetails">
              <ion-input
                v-model="fullName"
                label="Full name"
                label-placement="stacked"
                fill="outline"
                :maxlength="160"
                autocomplete="name"
                required
              />
              <ion-input
                v-model="contactNumber"
                label="Contact number"
                label-placement="stacked"
                fill="outline"
                :maxlength="40"
                type="tel"
                autocomplete="tel"
              />
              <p v-if="detailsError" class="error-message" role="alert">{{ detailsError }}</p>
              <ion-button expand="block" type="submit" :disabled="detailsSaving">
                {{ detailsSaving ? 'Saving...' : 'Save personal information' }}
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="profile?.role === 'patient'">
          <ion-card-header><ion-card-title>About you</ion-card-title></ion-card-header>
          <ion-card-content>
            <p v-if="aboutError && aboutMissing" class="error-message" role="alert">{{ aboutError }}</p>
            <p v-else-if="aboutMissing" class="hint">Your clinic record is not ready for these details yet.</p>
            <form v-else class="profile-form" @submit.prevent="saveAbout">
              <ion-input
                v-model="dateOfBirth"
                label="Date of birth"
                label-placement="stacked"
                fill="outline"
                type="date"
              />
              <p v-if="aboutAge" class="hint">Age: {{ aboutAge }}</p>
              <ion-select
                v-model="sex"
                label="Sex"
                label-placement="stacked"
                fill="outline"
                interface="popover"
                placeholder="Not specified"
              >
                <ion-select-option value="">Not specified</ion-select-option>
                <ion-select-option value="female">Female</ion-select-option>
                <ion-select-option value="male">Male</ion-select-option>
                <ion-select-option value="other">Other</ion-select-option>
              </ion-select>
              <ion-textarea
                v-model="address"
                label="Address"
                label-placement="stacked"
                fill="outline"
                :auto-grow="true"
                :maxlength="300"
                required
              />
              <ion-textarea
                v-model="allergies"
                label="Allergies (optional)"
                label-placement="stacked"
                fill="outline"
                :auto-grow="true"
                :maxlength="2000"
              />
              <ion-textarea
                v-model="medicalHistory"
                label="Medical history"
                label-placement="stacked"
                fill="outline"
                :auto-grow="true"
                :maxlength="2000"
              />
              <ion-input
                v-model="emergencyName"
                label="Emergency contact name"
                label-placement="stacked"
                fill="outline"
                :maxlength="160"
              />
              <ion-input
                v-model="emergencyNumber"
                label="Emergency contact number"
                label-placement="stacked"
                fill="outline"
                type="tel"
                :maxlength="40"
              />
              <p v-if="aboutError" class="error-message" role="alert">{{ aboutError }}</p>
              <ion-button expand="block" type="submit" :disabled="aboutSaving">
                {{ aboutSaving ? 'Saving...' : 'Save details' }}
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Email address</ion-card-title></ion-card-header>
          <ion-card-content>
            <form class="profile-form" @submit.prevent="saveEmail">
              <ion-input
                v-model="email"
                label="Email"
                label-placement="stacked"
                fill="outline"
                type="email"
                autocomplete="email"
                required
              />
              <p v-if="emailError" class="error-message" role="alert">{{ emailError }}</p>
              <p v-if="emailMessage" class="success-message" role="status">{{ emailMessage }}</p>
              <ion-button expand="block" type="submit" :disabled="emailSaving">
                {{ emailSaving ? 'Requesting change...' : 'Update email' }}
              </ion-button>
              <p class="hint">Supabase may require confirming the new address before it takes effect.</p>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Change password</ion-card-title></ion-card-header>
          <ion-card-content>
            <form class="profile-form" @submit.prevent="savePassword">
              <ion-input
                v-model="newPassword"
                label="New password"
                label-placement="stacked"
                fill="outline"
                type="password"
                autocomplete="new-password"
                required
              />
              <ion-input
                v-model="confirmPassword"
                label="Confirm new password"
                label-placement="stacked"
                fill="outline"
                type="password"
                autocomplete="new-password"
                required
              />
              <p v-if="passwordError" class="error-message" role="alert">{{ passwordError }}</p>
              <ion-button expand="block" type="submit" :disabled="passwordSaving">
                {{ passwordSaving ? 'Updating...' : 'Update password' }}
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="3000" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { useAuth } from '../composables/useAuth'
import {
  changePassword,
  getAvatarUrl,
  getMyPatientDetails,
  requestEmailChange,
  updateMyPatientDetails,
  updateProfileDetails,
  uploadAvatar,
} from '../services/profile.service'
import { isPatientProfileComplete } from '../utils/profileCompletion'
import { ageLabel, isPatientSex } from '../utils/patientDetails'

const { profile, refreshProfile } = useAuth()
const route = useRoute()
const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const fullName = ref('')
const contactNumber = ref('')
const dateOfBirth = ref('')
const sex = ref('')
const address = ref('')
const allergies = ref('')
const medicalHistory = ref('')
const emergencyName = ref('')
const emergencyNumber = ref('')
const aboutMissing = ref(false)
const aboutSaving = ref(false)
const aboutError = ref('')
const aboutAge = computed(() => ageLabel(dateOfBirth.value))
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const avatarUrl = ref<string | null>(null)
const avatarSaving = ref(false)
const detailsSaving = ref(false)
const emailSaving = ref(false)
const passwordSaving = ref(false)
const avatarError = ref('')
const detailsError = ref('')
const emailError = ref('')
const passwordError = ref('')
const emailMessage = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')
const requiresProfileCompletion = computed(
  () => route.query.completeProfile === '1' && profile.value?.role === 'patient',
)
const completionRedirect = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/patient/dashboard'
  return redirect.startsWith('/patient/') ? redirect : '/patient/dashboard'
})

const initials = computed(() =>
  fullName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?',
)

watch(
  () => profile.value,
  (value) => {
    if (!value) return
    fullName.value = value.fullName
    contactNumber.value = value.contactNumber ?? ''
    email.value = value.email
    void refreshAvatar(value.avatarPath)
    if (value.role === 'patient') void loadAbout(value.id)
  },
  { immediate: true },
)

async function loadAbout(userId: string) {
  aboutError.value = ''
  try {
    const details = await getMyPatientDetails(userId)
    aboutMissing.value = !details
    if (!details) return
    dateOfBirth.value = details.dateOfBirth ?? ''
    sex.value = details.sex ?? ''
    address.value = details.address ?? ''
    allergies.value = details.allergies ?? ''
    medicalHistory.value = details.medicalHistory ?? ''
    emergencyName.value = details.emergencyContactName ?? ''
    emergencyNumber.value = details.emergencyContactNumber ?? ''
  } catch (error) {
    aboutMissing.value = true
    aboutError.value = error instanceof Error ? error.message : 'Could not load your details.'
  }
}

async function saveAbout() {
  if (!address.value.trim()) {
    aboutError.value = 'Address is required.'
    return
  }
  if (dateOfBirth.value && dateOfBirth.value > new Date().toISOString().slice(0, 10)) {
    aboutError.value = 'Date of birth cannot be in the future.'
    return
  }
  aboutSaving.value = true
  aboutError.value = ''
  try {
    const blank = (value: string) => value.trim() || null
    await updateMyPatientDetails({
      dateOfBirth: blank(dateOfBirth.value),
      sex: isPatientSex(sex.value) ? sex.value : null,
      address: blank(address.value),
      allergies: blank(allergies.value),
      medicalHistory: blank(medicalHistory.value),
      emergencyContactName: blank(emergencyName.value),
      emergencyContactNumber: blank(emergencyNumber.value),
    })
    showToast('Your details were saved.')
  } catch (error) {
    aboutError.value = error instanceof Error ? error.message : 'Could not save your details.'
  } finally {
    aboutSaving.value = false
  }
}

async function refreshAvatar(path: string | null) {
  try {
    avatarUrl.value = await getAvatarUrl(path)
  } catch (error) {
    avatarUrl.value = null
    avatarError.value = error instanceof Error ? error.message : 'Could not load the profile picture.'
  }
}

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

async function selectAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !profile.value) return
  avatarSaving.value = true
  avatarError.value = ''
  try {
    const result = await uploadAvatar(profile.value.id, file, profile.value.avatarPath)
    await refreshProfile()
    await refreshAvatar(result.path)
    showToast(result.cleanupWarning ?? 'Profile picture updated.')
  } catch (error) {
    avatarError.value = error instanceof Error ? error.message : 'Could not update the profile picture.'
  } finally {
    avatarSaving.value = false
  }
}

async function saveDetails() {
  if (!fullName.value.trim()) {
    detailsError.value = 'Enter your full name.'
    return
  }
  if (profile.value?.role === 'patient' && !contactNumber.value.trim()) {
    detailsError.value = 'Enter your contact number to continue.'
    return
  }
  detailsSaving.value = true
  detailsError.value = ''
  try {
    await updateProfileDetails(fullName.value, contactNumber.value)
    await refreshProfile()
    if (requiresProfileCompletion.value && isPatientProfileComplete(profile.value)) {
      await router.replace(completionRedirect.value)
      return
    }
    showToast('Personal information updated.')
  } catch (error) {
    detailsError.value = error instanceof Error ? error.message : 'Could not update your profile.'
  } finally {
    detailsSaving.value = false
  }
}

async function saveEmail() {
  emailSaving.value = true
  emailError.value = ''
  emailMessage.value = ''
  try {
    await requestEmailChange(email.value)
    emailMessage.value = 'Check your new email address for a confirmation link.'
  } catch (error) {
    emailError.value = error instanceof Error ? error.message : 'Could not request an email change.'
  } finally {
    emailSaving.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'The passwords do not match.'
    return
  }
  passwordSaving.value = true
  try {
    await changePassword(newPassword.value)
    newPassword.value = ''
    confirmPassword.value = ''
    showToast('Password updated.')
  } catch (error) {
    passwordError.value = error instanceof Error ? error.message : 'Could not update your password.'
  } finally {
    passwordSaving.value = false
  }
}
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 14px;
  margin: 0 auto;
  max-width: 720px;
  padding: 4px 2px 20px;
}

.profile-form {
  display: grid;
  gap: 1rem;
}

.avatar-editor {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 88px;
  height: 88px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: white;
  background: var(--clinic-blue);
  border: 3px solid var(--accent-soft);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 500;
}

.avatar-actions {
  min-width: 0;
}

.avatar-actions p,
.hint {
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

.file-input {
  display: none;
}

.error-message {
  color: var(--ion-color-danger);
}

.success-message {
  color: var(--ion-color-success);
}
</style>
