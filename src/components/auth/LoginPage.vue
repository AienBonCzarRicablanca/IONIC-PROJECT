<template>
  <AuthShell title="Welcome back" subtitle="Sign in to manage appointments, records, and care.">
    <template #toolbar-start>
      <router-link to="/" class="auth-back">Back to website</router-link>
    </template>
    <div v-if="notice" class="auth-banner auth-banner-success" role="status">
      <ion-icon :icon="checkmarkCircleOutline" /><span>{{ notice }}</span>
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
        placeholder="you@example.com"
        @ionInput="errors.email = ''"
      />
      <span v-if="errors.email" class="auth-field-error">{{ errors.email }}</span>

      <ion-input
        v-model="password"
        label="Password"
        label-placement="stacked"
        fill="outline"
        type="password"
        autocomplete="current-password"
        @ionInput="errors.password = ''"
      >
        <ion-input-password-toggle slot="end" />
      </ion-input>
      <span v-if="errors.password" class="auth-field-error">{{ errors.password }}</span>

      <TermsAgreement v-model="agreed" :error="errors.terms" />

      <ion-button class="auth-submit" type="submit" expand="block" :disabled="loading">
        <ion-spinner v-if="loading" name="crescent" />
        <span v-else>Sign in</span>
      </ion-button>
      <div class="auth-links">
        <router-link to="/forgot-password">Forgot password?</router-link>
      </div>
    </form>

    <template #footer>
      New patient? <router-link to="/register">Create an account</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonButton, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/vue'
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons'
import AuthShell from './AuthShell.vue'
import TermsAgreement from './TermsAgreement.vue'
import { useAuth } from '../../composables/useAuth'
import { validateEmail, validateRequired } from '../../utils/validation'

const route = useRoute()
const router = useRouter()
const { login, loading, homeFor } = useAuth()

const email = ref('')
const password = ref('')
const agreed = ref(false)
const errorMessage = ref('')
const errors = reactive({ email: '', password: '', terms: '' })

watch(agreed, (value) => {
  if (value) errors.terms = ''
})

const notice = computed(() =>
  route.query.reset === '1' ? 'Password updated. Please sign in with your new password.' : '',
)

async function submit() {
  errorMessage.value = ''
  errors.email = validateEmail(email.value)
  errors.password = validateRequired(password.value, 'Password')
  errors.terms = agreed.value ? '' : 'Please agree to the Terms and Conditions.'
  if (errors.email || errors.password || errors.terms) return

  try {
    const profile = await login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const target = redirect.startsWith(`/${profile.role}/`) ? redirect : homeFor(profile.role)
    await router.replace(target)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unable to sign in.'
  }
}
</script>
