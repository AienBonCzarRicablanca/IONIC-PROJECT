<template>
  <AuthShell title="Set a new password" subtitle="Choose a strong password you have not used before.">
    <div v-if="errorMessage" class="auth-banner auth-banner-error" role="alert">
      <ion-icon :icon="alertCircleOutline" /><span>{{ errorMessage }}</span>
    </div>

    <div v-if="checking" class="reset-checking"><ion-spinner name="crescent" /></div>

    <div v-else-if="!hasRecoverySession" class="auth-banner auth-banner-warning" role="alert">
      <ion-icon :icon="warningOutline" />
      <span>
        This reset link is invalid or has expired.
        <router-link to="/forgot-password">Request a new link</router-link>.
      </span>
    </div>

    <form v-else class="auth-form" novalidate @submit.prevent="submit">
      <ion-input
        v-model="password"
        label="New password"
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
        label="Confirm new password"
        label-placement="stacked"
        fill="outline"
        type="password"
        autocomplete="new-password"
        @ionInput="errors.confirm = ''"
      />
      <span v-if="errors.confirm" class="auth-field-error">{{ errors.confirm }}</span>

      <ion-button class="auth-submit" type="submit" expand="block" :disabled="submitting">
        <ion-spinner v-if="submitting" name="crescent" />
        <span v-else>Update password</span>
      </ion-button>
    </form>

    <template #footer>
      <router-link to="/login">Back to sign in</router-link>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonButton, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/vue'
import { alertCircleOutline, warningOutline } from 'ionicons/icons'
import AuthShell from './AuthShell.vue'
import { getSession, signOut, updatePassword } from '../../services/auth.service'
import { validatePassword } from '../../utils/validation'

const router = useRouter()
const password = ref('')
const confirm = ref('')
const errorMessage = ref('')
const checking = ref(true)
const hasRecoverySession = ref(false)
const submitting = ref(false)
const errors = reactive({ password: '', confirm: '' })

onMounted(async () => {
  // supabase-js exchanges the recovery token in the URL for a temporary session.
  await new Promise((resolve) => setTimeout(resolve, 400))
  hasRecoverySession.value = Boolean(await getSession())
  checking.value = false
})

async function submit() {
  errorMessage.value = ''
  errors.password = validatePassword(password.value)
  errors.confirm = password.value === confirm.value ? '' : 'Passwords do not match.'
  if (errors.password || errors.confirm) return

  submitting.value = true
  try {
    await updatePassword(password.value)
    await signOut()
    await router.replace({ path: '/login', query: { reset: '1' } })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Unable to update password.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.reset-checking {
  display: grid;
  place-items: center;
  padding: 24px 0;
}
</style>
