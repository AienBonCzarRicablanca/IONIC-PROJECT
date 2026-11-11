<template>
  <ion-page class="app-shell">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/" text="" aria-label="Back" />
        </ion-buttons>
        <ion-title>My Profile</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
        <ion-buttons slot="end">
          <ion-button
            v-if="editing"
            class="header-action header-action-quiet"
            fill="outline"
            size="small"
            :disabled="saving"
            @click="cancelEdit"
          >
            Cancel
          </ion-button>
          <ion-button
            v-else
            class="header-action header-action-solid"
            size="small"
            fill="solid"
            :disabled="!hydrated"
            @click="startEdit"
          >
            <ion-icon slot="start" :icon="createOutline" aria-hidden="true" />
            Edit
          </ion-button>
        </ion-buttons>
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
          <ion-card-content class="identity">
            <ion-avatar class="profile-avatar">
              <img v-if="shownAvatar" :src="shownAvatar" alt="Your profile picture" />
              <span v-else>{{ initials }}</span>
            </ion-avatar>
            <div class="identity-copy">
              <h2>{{ fullName.trim() || 'Your profile' }}</h2>
              <p>{{ roleLabel }}</p>
              <template v-if="editing">
                <p class="hint">JPG, PNG, or WebP · maximum 2 MB</p>
                <input
                  ref="fileInput"
                  class="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="selectAvatar"
                />
                <ion-button fill="outline" size="small" :disabled="saving" @click="fileInput?.click()">
                  <ion-icon slot="start" :icon="imageOutline" aria-hidden="true" />
                  {{ pendingAvatar ? 'Picture selected' : 'Choose picture' }}
                </ion-button>
                <p v-if="avatarError" class="error-message" role="alert">{{ avatarError }}</p>
              </template>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Personal information</ion-card-title></ion-card-header>
          <ion-card-content>
            <div v-if="!editing" class="facts">
              <div class="fact">
                <span>Full name</span>
                <strong :class="{ empty: !fullName.trim() }">{{ fullName.trim() || 'Not added' }}</strong>
              </div>
              <div class="fact">
                <span>Contact number</span>
                <strong :class="{ empty: !contactNumber.trim() }">{{ contactNumber.trim() || 'Not added' }}</strong>
              </div>
            </div>
            <div v-else class="profile-form">
              <ion-input
                v-model="fullName"
                label="Full name"
                label-placement="stacked"
                fill="outline"
                :maxlength="160"
                autocomplete="name"
              />
              <PhContactInput v-model="contactNumber" label="Contact number" />
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="profile?.role === 'patient'">
          <ion-card-header><ion-card-title>About you</ion-card-title></ion-card-header>
          <ion-card-content>
            <p v-if="aboutError && aboutMissing" class="error-message" role="alert">{{ aboutError }}</p>
            <p v-else-if="aboutMissing" class="hint">Your clinic record is not ready for these details yet.</p>
            <div v-else-if="!editing" class="facts">
              <div class="fact">
                <span>Date of birth</span>
                <strong :class="{ empty: !dateOfBirth }">{{ birthSummary(dateOfBirth) === '—' ? 'Not added' : birthSummary(dateOfBirth) }}</strong>
              </div>
              <div class="fact">
                <span>Sex</span>
                <strong :class="{ empty: !isPatientSex(sex) }">{{ isPatientSex(sex) ? sexLabel(sex) : 'Not added' }}</strong>
              </div>
              <div class="fact">
                <span>Address</span>
                <strong :class="{ empty: !address.trim() }">{{ address.trim() || 'Not added' }}</strong>
              </div>
              <div class="fact">
                <span>Allergies</span>
                <strong :class="{ empty: !allergies.trim() }">{{ allergies.trim() || 'None listed' }}</strong>
              </div>
              <div class="fact">
                <span>Medical history</span>
                <strong :class="{ empty: !medicalHistory.trim() }">{{ medicalHistory.trim() || 'None listed' }}</strong>
              </div>
              <div class="fact">
                <span>Emergency contact</span>
                <strong :class="{ empty: !emergencyLine }">{{ emergencyLine || 'Not added' }}</strong>
              </div>
            </div>
            <div v-else class="profile-form">
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
              <PhContactInput v-model="emergencyNumber" label="Emergency contact number" />
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Email address</ion-card-title></ion-card-header>
          <ion-card-content>
            <div v-if="!editing" class="facts">
              <div class="fact">
                <span>Email</span>
                <strong>{{ email || 'Not added' }}</strong>
              </div>
            </div>
            <div v-else class="profile-form">
              <ion-input
                v-model="email"
                label="Email"
                label-placement="stacked"
                fill="outline"
                type="email"
                autocomplete="email"
              />
              <p class="hint">Supabase may require confirming the new address before it takes effect.</p>
            </div>
            <p v-if="emailMessage" class="success-message" role="status">{{ emailMessage }}</p>
          </ion-card-content>
        </ion-card>

        <div v-if="editing" class="save-bar">
          <p v-if="saveError" class="error-message" role="alert">{{ saveError }}</p>
          <ion-button expand="block" :disabled="saving" @click="saveAll">
            <ion-spinner v-if="saving" name="crescent" />
            <span v-else>Save changes</span>
          </ion-button>
        </div>

        <button type="button" class="password-launch" @click="openPassword">
          <span class="password-icon" aria-hidden="true">
            <ion-icon :icon="keyOutline" />
          </span>
          <span class="password-copy">
            <strong>Change password</strong>
            <small>Update the password you use to sign in</small>
          </span>
          <ion-icon :icon="chevronForwardOutline" aria-hidden="true" />
        </button>
      </div>

      <ion-modal class="password-modal" :is-open="passwordOpen" @didDismiss="closePassword">
        <div class="password-sheet">
          <template v-if="passwordStep === 'form'">
            <h2>Change password</h2>
            <p>Choose a new password with at least 8 characters.</p>
            <form class="profile-form" @submit.prevent="askPasswordConfirm">
              <ion-input
                v-model="newPassword"
                label="New password"
                label-placement="stacked"
                fill="outline"
                type="password"
                autocomplete="new-password"
              />
              <ion-input
                v-model="confirmPassword"
                label="Confirm new password"
                label-placement="stacked"
                fill="outline"
                type="password"
                autocomplete="new-password"
              />
              <p v-if="passwordError" class="error-message" role="alert">{{ passwordError }}</p>
              <div class="sheet-actions">
                <ion-button fill="clear" type="button" @click="passwordOpen = false">Cancel</ion-button>
                <ion-button type="submit">Continue</ion-button>
              </div>
            </form>
          </template>
          <template v-else>
            <h2>Change your password?</h2>
            <p>Are you sure you want to replace your current password? You will use the new one the next time you sign in.</p>
            <p v-if="passwordError" class="error-message" role="alert">{{ passwordError }}</p>
            <div class="sheet-actions">
              <ion-button fill="outline" type="button" :disabled="passwordSaving" @click="passwordStep = 'form'">
                Go back
              </ion-button>
              <ion-button type="button" :disabled="passwordSaving" @click="commitPassword">
                <ion-spinner v-if="passwordSaving" name="crescent" />
                <span v-else>Yes, change it</span>
              </ion-button>
            </div>
          </template>
        </div>
      </ion-modal>

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="3000" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { chevronForwardOutline, createOutline, imageOutline, keyOutline } from 'ionicons/icons'
import HeaderTools from '../components/common/HeaderTools.vue'
import PhContactInput from '../components/common/PhContactInput.vue'
import { useAuth } from '../composables/useAuth'
import {
  AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  changePassword,
  getAvatarUrl,
  getMyPatientDetails,
  requestEmailChange,
  updateMyPatientDetails,
  updateProfileDetails,
  uploadAvatar,
} from '../services/profile.service'
import { ROLE_LABEL } from '../types'
import { isPatientProfileComplete } from '../utils/profileCompletion'
import { ageLabel, birthSummary, isPatientSex, sexLabel } from '../utils/patientDetails'

type Draft = {
  fullName: string
  contactNumber: string
  email: string
  dateOfBirth: string
  sex: string
  address: string
  allergies: string
  medicalHistory: string
  emergencyName: string
  emergencyNumber: string
}

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
const aboutError = ref('')
const aboutAge = computed(() => ageLabel(dateOfBirth.value))
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const avatarUrl = ref<string | null>(null)
const avatarPreview = ref<string | null>(null)
const pendingAvatar = ref<File | null>(null)
const shownAvatar = computed(() => avatarPreview.value || avatarUrl.value)
const editing = ref(false)
const hydrated = ref(false)
const saving = ref(false)
const passwordSaving = ref(false)
const passwordOpen = ref(false)
const passwordStep = ref<'form' | 'confirm'>('form')
const avatarError = ref('')
const saveError = ref('')
const emailMessage = ref('')
const passwordError = ref('')
const toastOpen = ref(false)
const toastMessage = ref('')
const baseline = ref<Draft | null>(null)
const requiresProfileCompletion = computed(
  () => route.query.completeProfile === '1' && profile.value?.role === 'patient',
)
const completionRedirect = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/patient/dashboard'
  return redirect.startsWith('/patient/') ? redirect : '/patient/dashboard'
})
const roleLabel = computed(() => (profile.value ? ROLE_LABEL[profile.value.role] : ''))
const emergencyLine = computed(() =>
  [emergencyName.value.trim(), emergencyNumber.value.trim()].filter(Boolean).join(' · '),
)
const initials = computed(() =>
  fullName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?',
)

watch(requiresProfileCompletion, (needed) => {
  if (needed) editing.value = true
}, { immediate: true })

watch(
  () => profile.value,
  async (value) => {
    if (!value || (editing.value && hydrated.value)) return
    hydrated.value = true
    await applyProfile(value.id, value.fullName, value.contactNumber, value.email, value.avatarPath, value.role)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
})

function currentDraft(): Draft {
  return {
    fullName: fullName.value,
    contactNumber: contactNumber.value,
    email: email.value,
    dateOfBirth: dateOfBirth.value,
    sex: sex.value,
    address: address.value,
    allergies: allergies.value,
    medicalHistory: medicalHistory.value,
    emergencyName: emergencyName.value,
    emergencyNumber: emergencyNumber.value,
  }
}

function rememberBaseline() {
  baseline.value = currentDraft()
}

function restoreBaseline() {
  const saved = baseline.value
  if (!saved) return
  fullName.value = saved.fullName
  contactNumber.value = saved.contactNumber
  email.value = saved.email
  dateOfBirth.value = saved.dateOfBirth
  sex.value = saved.sex
  address.value = saved.address
  allergies.value = saved.allergies
  medicalHistory.value = saved.medicalHistory
  emergencyName.value = saved.emergencyName
  emergencyNumber.value = saved.emergencyNumber
}

async function applyProfile(
  userId: string,
  name: string,
  contact: string | null,
  nextEmail: string,
  avatarPath: string | null,
  role: string,
) {
  fullName.value = name
  contactNumber.value = contact ?? ''
  email.value = nextEmail
  await refreshAvatar(avatarPath)
  if (role === 'patient') await loadAbout(userId)
  else aboutMissing.value = true
  rememberBaseline()
}

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

function startEdit() {
  if (!hydrated.value) return
  saveError.value = ''
  avatarError.value = ''
  emailMessage.value = ''
  rememberBaseline()
  editing.value = true
}

function clearPendingAvatar() {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = null
  pendingAvatar.value = null
}

function cancelEdit() {
  restoreBaseline()
  clearPendingAvatar()
  saveError.value = ''
  avatarError.value = ''
  editing.value = false
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

function selectAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  avatarError.value = ''
  if (!file) return
  if (!AVATAR_TYPES.includes(file.type)) {
    avatarError.value = 'Choose a JPG, PNG, or WebP image.'
    return
  }
  if (file.size < 1 || file.size > MAX_AVATAR_BYTES) {
    avatarError.value = 'Profile pictures must be smaller than 2 MB.'
    return
  }
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  pendingAvatar.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function saveAll() {
  saveError.value = ''
  emailMessage.value = ''
  if (!fullName.value.trim()) {
    saveError.value = 'Enter your full name.'
    return
  }
  if (profile.value?.role === 'patient' && !contactNumber.value.trim()) {
    saveError.value = 'Enter your contact number to continue.'
    return
  }
  const saveAbout = profile.value?.role === 'patient' && !aboutMissing.value
  if (saveAbout && !address.value.trim()) {
    saveError.value = 'Address is required.'
    return
  }
  if (saveAbout && dateOfBirth.value && dateOfBirth.value > new Date().toISOString().slice(0, 10)) {
    saveError.value = 'Date of birth cannot be in the future.'
    return
  }
  const nextEmail = email.value.trim().toLowerCase()
  if (!nextEmail.includes('@') || !nextEmail.includes('.')) {
    saveError.value = 'Enter a valid email address.'
    return
  }

  saving.value = true
  try {
    await updateProfileDetails(fullName.value, contactNumber.value)
    if (saveAbout) {
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
    }
    let avatarNote = ''
    if (pendingAvatar.value && profile.value) {
      const result = await uploadAvatar(profile.value.id, pendingAvatar.value, profile.value.avatarPath)
      avatarNote = result.cleanupWarning ?? ''
      clearPendingAvatar()
    }
    const emailChanged = nextEmail !== (profile.value?.email ?? '').trim().toLowerCase()
    if (emailChanged) await requestEmailChange(nextEmail)
    await refreshProfile()
    if (requiresProfileCompletion.value && isPatientProfileComplete(profile.value)) {
      await router.replace(completionRedirect.value)
      return
    }
    const current = profile.value
    if (current) {
      await applyProfile(current.id, current.fullName, current.contactNumber, current.email, current.avatarPath, current.role)
    }
    editing.value = false
    if (emailChanged) {
      emailMessage.value = 'Check your new email address for a confirmation link.'
      showToast('Saved. Confirm the new email from your inbox.')
    } else {
      showToast(avatarNote || 'Profile saved.')
    }
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Could not save your profile.'
  } finally {
    saving.value = false
  }
}

function openPassword() {
  passwordError.value = ''
  passwordStep.value = 'form'
  passwordOpen.value = true
}

function closePassword() {
  passwordOpen.value = false
  passwordStep.value = 'form'
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
}

function askPasswordConfirm() {
  passwordError.value = ''
  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'The passwords do not match.'
    return
  }
  passwordStep.value = 'confirm'
}

async function commitPassword() {
  passwordError.value = ''
  passwordSaving.value = true
  try {
    await changePassword(newPassword.value)
    passwordOpen.value = false
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
  padding: 4px 2px 28px;
}

.header-action {
  --border-radius: 999px;
  --padding-start: 10px;
  --padding-end: 12px;
  min-height: 34px;
  margin-inline-end: 6px;
  font-size: 0.82rem;
  letter-spacing: -0.01em;
  text-transform: none;
}

.header-action-solid {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --color: #fff;
}

.header-action-quiet {
  --background: transparent;
  --border-width: 1px;
  --border-style: solid;
  --border-color: var(--line-strong);
  --color: var(--clinic-ink);
}

.identity {
  display: flex;
  align-items: center;
  gap: 16px;
}

.identity-copy {
  min-width: 0;
}

.identity-copy h2 {
  margin: 0;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 500;
  letter-spacing: -0.03em;
}

.identity-copy p {
  margin: 2px 0 0;
}

.profile-avatar {
  width: 84px;
  height: 84px;
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

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-form {
  display: grid;
  gap: 1rem;
}

.facts {
  display: grid;
}

.fact {
  display: grid;
  gap: 3px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

.fact:first-child {
  padding-top: 0;
}

.fact:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.fact span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fact strong {
  color: var(--clinic-ink);
  font-weight: 560;
  white-space: pre-wrap;
}

.fact strong.empty {
  color: var(--muted);
  font-weight: 500;
}

.hint,
.identity-copy .hint {
  color: var(--muted);
  font-size: 0.84rem;
}

.file-input {
  display: none;
}

.save-bar {
  display: grid;
  gap: 8px;
}

.error-message {
  margin: 0;
  color: var(--ion-color-danger);
}

.success-message {
  margin: 10px 0 0;
  color: var(--ion-color-success);
}

.password-launch {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  color: var(--clinic-ink);
  text-align: left;
  cursor: pointer;
}

.password-launch:hover,
.password-launch:focus-visible {
  border-color: var(--clinic-blue);
  outline: none;
}

.password-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--clinic-blue);
  font-size: 1.15rem;
}

.password-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.password-copy strong {
  font-size: 0.98rem;
}

.password-copy small {
  color: var(--muted);
  font-size: 0.82rem;
}

.password-launch > ion-icon:last-child {
  margin-left: auto;
  color: var(--muted);
  font-size: 1.1rem;
}

.password-modal {
  --width: min(440px, calc(100% - 28px));
  --height: auto;
  --border-radius: 18px;
  --box-shadow: var(--shadow-md);
}

.password-sheet {
  padding: 22px 20px 18px;
  background: var(--surface);
  color: var(--clinic-ink);
}

.password-sheet h2 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 500;
  letter-spacing: -0.03em;
}

.password-sheet > p {
  margin: 0 0 16px;
  color: var(--muted);
}

.sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.sheet-actions ion-button {
  text-transform: none;
}
</style>
