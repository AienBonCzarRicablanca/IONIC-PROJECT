<template>
  <div class="terms-agreement">
    <label class="terms-check">
      <input v-model="agreed" type="checkbox" />
      <span>
        I agree to the
        <button type="button" @click="open = true">Terms and Conditions</button>.
      </span>
    </label>
    <span v-if="error" class="auth-field-error">{{ error }}</span>

    <ion-modal :is-open="open" @did-dismiss="open = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Terms and Conditions</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="open = false">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="terms-content">
        <article class="terms-body">
          <p class="terms-date">Updated {{ TERMS_UPDATED }}</p>
          <section v-for="section in TERMS_SECTIONS" :key="section.title">
            <h2>{{ section.title }}</h2>
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          </section>
          <ion-button expand="block" @click="accept">I agree</ion-button>
        </article>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/vue'
import { TERMS_SECTIONS, TERMS_UPDATED } from '../../content/terms'

defineProps<{ error?: string }>()
const agreed = defineModel<boolean>({ required: true })
const open = ref(false)

function accept() {
  agreed.value = true
  open.value = false
}
</script>

<style scoped>
.terms-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--clinic-ink);
  font-size: 13px;
  line-height: 1.45;
}

.terms-check input {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  accent-color: var(--clinic-blue);
  flex: 0 0 auto;
}

.terms-check button {
  padding: 0;
  color: var(--clinic-blue);
  font: inherit;
  font-weight: 700;
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.terms-body {
  display: grid;
  gap: 8px;
  max-width: 680px;
  margin: 0 auto;
  padding: 8px 20px 28px;
  color: var(--clinic-ink);
}

.terms-date {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.terms-body h2 {
  margin: 14px 0 0;
  font-size: 16px;
  font-weight: 700;
}

.terms-body p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.terms-body ion-button {
  margin-top: 18px;
}
</style>
