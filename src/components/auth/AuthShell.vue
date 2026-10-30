<template>
  <ion-page>
    <ion-content :fullscreen="true" class="auth-content">
      <div class="auth-wrap">
        <div class="auth-toolbar">
          <ThemeToggle icon-only />
        </div>
        <router-link to="/" class="auth-brand" aria-label="Back to Harbor Dental home">
          <span class="auth-brand-mark"><ion-icon :icon="sparklesOutline" /></span>
          <strong>harbor<span> dental</span></strong>
        </router-link>

        <section class="auth-card">
          <h1>{{ title }}</h1>
          <p class="auth-subtitle">{{ subtitle }}</p>

          <div v-if="!isSupabaseConfigured" class="auth-banner auth-banner-warning" role="alert">
            <ion-icon :icon="warningOutline" />
            <span>{{ CONFIG_ERROR }}</span>
          </div>

          <slot />
        </section>

        <div class="auth-footer"><slot name="footer" /></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { sparklesOutline, warningOutline } from 'ionicons/icons'
import ThemeToggle from '../common/ThemeToggle.vue'
import { CONFIG_ERROR } from '../../services/auth.service'
import { isSupabaseConfigured } from '../../services/supabase'

defineProps<{
  title: string
  subtitle: string
}>()
</script>

<style>
.auth-content {
  --background: var(--canvas);
}

.auth-wrap {
  position: relative;
  min-height: 100%;
  padding: 32px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.auth-toolbar {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--clinic-ink);
  font-size: 19px;
  letter-spacing: -0.6px;
  text-decoration: none;
}

.auth-brand strong {
  font-family: var(--font-display);
  font-weight: 500;
}

.auth-brand strong span {
  color: var(--clinic-blue);
}

.auth-brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--clinic-blue);
  border-radius: 14px;
  font-size: 20px;
}

.auth-card {
  width: min(100%, 420px);
  padding: 30px 26px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.auth-card h1 {
  margin: 0 0 6px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.04em;
}

.auth-subtitle {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
}

.auth-form {
  display: grid;
  gap: 14px;
}

.auth-form ion-input {
  --border-radius: 10px;
  min-height: 56px;
}

.auth-field-error {
  margin-top: -8px;
  color: #b24c4c;
  font-size: 12px;
}

.auth-submit {
  --border-radius: 12px;
  --box-shadow: none;
  height: 50px;
  margin: 6px 0 0;
  font-weight: 700;
}

.auth-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.auth-banner ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 17px;
}

.auth-banner-warning {
  color: #7a5a14;
  background: #fff6e0;
}

.auth-banner-error {
  color: #9b3a3a;
  background: #fdecec;
}

.auth-banner-success {
  color: #1f6b57;
  background: #e5f5ef;
}

.auth-links {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.auth-links a,
.auth-footer a {
  color: var(--clinic-blue);
  font-weight: 700;
  text-decoration: none;
}

.auth-footer {
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}
</style>
