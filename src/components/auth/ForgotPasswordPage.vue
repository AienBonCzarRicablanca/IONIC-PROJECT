<template>
  <AuthShell title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
    <div v-if="successMessage" class="auth-banner auth-banner-success" role="status">
      <ion-icon :icon="checkmarkCircleOutline" /><span>{{ successMessage }}</span>
    </div>
    <div v-if="errorMessage" class="auth-banner auth-banner-error" role="alert">
      <ion-icon :icon="alertCircleOutline" /><span>{{ errorMessage }}</span>
    </div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <ion-input
        v-model="email"
        label="Email"
        label-placement="stacked"
        fill="outline"
        type="email"
        inputmode="email"
        autocomplete="email"
        @ionInput="emailError = ''"
      />
      <span v-if="emailError" class="auth-field-error">{{ emailError }}</span>

      <ion-button class="auth-submit" type="submit" expand="block" :disabled="submitting">
        <ion-spinner v-if="submitting" name="crescent" />
        <span v-else>Send reset link</span>
      </ion-button>
    </form>

    <template #footer>
      Remembered it? <router-link to="/login">Back to sign in</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonIcon, IonInput, IonSpinner } from '@ionic/vue'
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons'
import AuthShell from './AuthShell.vue'
import { requestPasswordReset } from '../../services/auth.service'
import { validateEmail } from '../../utils/validation'

const email = ref('')
const emailError = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const submitting = ref(false)

async function submit() {
  errorMessage.value = ''
  successMessage.value = ''
  emailError.value = validateEmail(email.value)
  if (emailError.value) return

  submitting.value = true
  try {
    await requestPasswordReset(email.value.trim())
    // Same message whether or not the account exists, to avoid revealing registered emails.
    successMessage.value = 'If that email is registered, a reset link is on its way.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unable to send reset link.'
  } finally {
    submitting.value = false
  }
}
</script>
