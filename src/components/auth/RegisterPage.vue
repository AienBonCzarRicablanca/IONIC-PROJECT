<template>
  <AuthShell title="Create your account" subtitle="Patient accounts let you book visits and view your records.">
    <div v-if="successMessage" class="auth-banner auth-banner-success" role="status">
      <ion-icon :icon="checkmarkCircleOutline" /><span>{{ successMessage }}</span>
    </div>
    <div v-if="errorMessage" class="auth-banner auth-banner-error" role="alert">
      <ion-icon :icon="alertCircleOutline" /><span>{{ errorMessage }}</span>
    </div>

    <form v-if="!successMessage" class="auth-form" novalidate @submit.prevent="submit">
      <ion-input
        v-model="fullName"
        label="Full name"
        label-placement="stacked"
        fill="outline"
        autocomplete="name"
        @ionInput="errors.fullName = ''"
      />
      <span v-if="errors.fullName" class="auth-field-error">{{ errors.fullName }}</span>

      <ion-input
        v-model="email"
        label="Email"
        label-placement="stacked"
        fill="outline"
        type="email"
        inputmode="email"
        autocomplete="email"
        @ionInput="errors.email = ''"
      />
      <span v-if="errors.email" class="auth-field-error">{{ errors.email }}</span>

      <ion-input
        v-model="password"
        label="Password"
        label-placement="stacked"
        fill="outline"
        type="password"
        autocomplete="new-password"
        helper-text="At least 8 characters with a letter and a number."
        @ionInput="errors.password = ''"
      >
        <ion-input-password-toggle slot="end" />
      </ion-input>
      <span v-if="errors.password" class="auth-field-error">{{ errors.password }}</span>

      <ion-input
        v-model="confirm"
        label="Confirm password"
        label-placement="stacked"
        fill="outline"
        type="password"
        autocomplete="new-password"
        @ionInput="errors.confirm = ''"
      />
      <span v-if="errors.confirm" class="auth-field-error">{{ errors.confirm }}</span>

      <ion-button class="auth-submit" type="submit" expand="block" :disabled="loading">
        <ion-spinner v-if="loading" name="crescent" />
        <span v-else>Create account</span>
      </ion-button>
    </form>

    <template #footer>
      Already have an account? <router-link to="/login">Sign in</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IonButton, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/vue'
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons'
import AuthShell from './AuthShell.vue'
import { useAuth } from '../../composables/useAuth'
import { validateEmail, validatePassword, validateRequired } from '../../utils/validation'

const { register, loading } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const errors = reactive({ fullName: '', email: '', password: '', confirm: '' })

async function submit() {
  errorMessage.value = ''
  errors.fullName = validateRequired(fullName.value, 'Full name')
  errors.email = validateEmail(email.value)
  errors.password = validatePassword(password.value)
  errors.confirm = password.value === confirm.value ? '' : 'Passwords do not match.'
  if (Object.values(errors).some(Boolean)) return

  try {
    await register(email.value.trim(), password.value, fullName.value.trim())
    successMessage.value =
      'Account created. Check your email to confirm your address, then sign in.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unable to create account.'
  }
}
</script>
