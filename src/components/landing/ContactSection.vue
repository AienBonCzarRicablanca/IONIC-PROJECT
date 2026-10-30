<template>
  <section id="contact" class="contact-section">
    <div class="contact-inner">
      <div class="contact-copy">
        <span class="section-kicker">LET'S MAKE SOMETHING GOOD HAPPEN</span>
        <h2>Your smile<br />starts <em>here.</em></h2>
        <p>Have a question or ready to say hello? We would love to hear from you.</p>

        <div class="contact-details">
          <a href="tel:+63430001400">
            <span><ion-icon :icon="callOutline" /></span>
            <span><strong>Give us a call</strong><small>(043) 000-1400</small></span>
          </a>
          <a href="mailto:hello@harbordental.example">
            <span><ion-icon :icon="mailOutline" /></span>
            <span><strong>Send a note</strong><small>hello@harbordental.example</small></span>
          </a>
          <div>
            <span><ion-icon :icon="locationOutline" /></span>
            <span><strong>Come by</strong><small>J.P. Rizal Street, Calapan City, Oriental Mindoro</small></span>
          </div>
          <div>
            <span><ion-icon :icon="timeOutline" /></span>
            <span><strong>When we're here</strong><small>Mon–Sat, 8:00 AM–5:00 PM</small></span>
          </div>
        </div>
      </div>

      <div class="contact-card">
        <div class="form-heading">
          <span class="form-sparkle"><ion-icon :icon="chatbubbleEllipsesOutline" /></span>
          <div>
            <h3>Drop us a line</h3>
            <p>We’ll get back to you as soon as we can.</p>
          </div>
        </div>
        <form novalidate @submit.prevent="submitForm">
          <label for="contact-name">Your name</label>
          <ion-input
            id="contact-name"
            v-model="form.name"
            name="name"
            autocomplete="name"
            placeholder="e.g. Jamie Smith"
            :class="{ 'input-error': errors.name }"
            @ionInput="clearError('name')"
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>

          <label for="contact-email">Email address</label>
          <ion-input
            id="contact-email"
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :class="{ 'input-error': errors.email }"
            @ionInput="clearError('email')"
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>

          <label for="contact-message">How can we help?</label>
          <ion-textarea
            id="contact-message"
            v-model="form.message"
            name="message"
            :rows="4"
            auto-grow
            placeholder="Tell us a little about what you need..."
            :class="{ 'input-error': errors.message }"
            @ionInput="clearError('message')"
          />
          <span v-if="errors.message" class="field-error">{{ errors.message }}</span>

          <p v-if="submitError" class="field-error" role="alert">{{ submitError }}</p>
          <ion-button class="submit-button" type="submit" expand="block" :disabled="sending">
            {{ sending ? 'Sending...' : 'Send your note' }}
            <ion-icon v-if="!sending" slot="end" :icon="arrowForwardOutline" />
          </ion-button>
          <p class="form-disclaimer">Your note is saved for the clinic. A team member can read it in Messages.</p>
        </form>
      </div>
    </div>

    <figure class="clinic-map">
      <iframe
        title="Harbor Dental on J.P. Rizal Street, Calapan City, Oriental Mindoro"
        src="https://maps.google.com/maps?q=13.4115,121.1803&amp;z=15&amp;output=embed"
        loading="lazy"
      />
      <figcaption>
        J.P. Rizal Street, Calapan City, Oriental Mindoro
        <a
          href="https://www.google.com/maps?q=13.4115,121.1803"
          target="_blank"
          rel="noopener noreferrer"
        >Open the map</a>
      </figcaption>
    </figure>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :duration="3500"
      position="bottom"
      color="primary"
      @didDismiss="toastOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonToast,
} from '@ionic/vue'
import {
  arrowForwardOutline,
  callOutline,
  chatbubbleEllipsesOutline,
  locationOutline,
  mailOutline,
  timeOutline,
} from 'ionicons/icons'
import { submitContactMessage } from '../../services/contact.service'

type ContactField = 'name' | 'email' | 'message'

const form = reactive({
  name: '',
  email: '',
  message: '',
})

const errors = reactive<Record<ContactField, string>>({
  name: '',
  email: '',
  message: '',
})

const toastOpen = ref(false)
const toastMessage = ref('')
const sending = ref(false)
const submitError = ref('')

function clearError(field: ContactField) {
  errors[field] = ''
}

async function submitForm() {
  errors.name = form.name.trim() ? '' : 'Please enter your name.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : 'Enter a valid email address.'
  errors.message = form.message.trim() ? '' : 'Please add a short message.'
  submitError.value = ''

  if (errors.name || errors.email || errors.message || sending.value) return

  sending.value = true
  try {
    await submitContactMessage(form.name.trim(), form.email.trim(), form.message.trim())
    form.name = ''
    form.email = ''
    form.message = ''
    toastMessage.value = 'Your note was sent. The clinic will read it in Messages.'
    toastOpen.value = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send your note.'
    submitError.value = /submit_contact_message|schema cache/i.test(message)
      ? 'The clinic inbox is not ready yet. Please call or email the clinic instead.'
      : message
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.contact-section {
  padding: 91px 0 0;
  background: #eff7f5;
}

.contact-inner {
  width: min(1060px, calc(100% - 48px));
  margin: 0 auto;
  padding-bottom: 66px;
  display: grid;
  grid-template-columns: 0.9fr 1fr;
  gap: 10%;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

h2 {
  margin: 15px 0 13px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(48px, 5.3vw, 66px);
  font-weight: 500;
  letter-spacing: -3px;
  line-height: 0.99;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.contact-copy > p {
  max-width: 335px;
  margin: 0;
  color: #778a90;
  font-size: 12px;
  line-height: 1.75;
}

.contact-details {
  display: grid;
  gap: 16px;
  margin-top: 28px;
}

.contact-details > a,
.contact-details > div {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.contact-details > a > span:first-child,
.contact-details > div > span:first-child {
  width: 37px;
  height: 37px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--clinic-blue);
  background: #fff;
  border-radius: 12px;
  font-size: 16px;
}

.contact-details > a > span:last-child,
.contact-details > div > span:last-child {
  display: grid;
  gap: 4px;
}

.contact-details strong {
  color: var(--clinic-ink);
  font-size: 10px;
}

.contact-details small {
  color: #71868c;
  font-size: 10px;
}

.contact-details i {
  margin-left: 4px;
  color: #a2b1b3;
  font-size: 8px;
  font-style: normal;
}

.contact-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #e8f0ee;
  border-radius: 18px;
  box-shadow: 0 12px 32px rgb(37 88 94 / 6%);
}

.form-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 19px;
}

.form-sparkle {
  width: 41px;
  height: 41px;
  display: grid;
  place-items: center;
  color: #348d98;
  background: #e9f5f2;
  border-radius: 13px;
  font-size: 18px;
}

.form-heading h3 {
  margin: 0 0 4px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 20px;
}

.form-heading p {
  margin: 0;
  color: #829397;
  font-size: 9px;
}

form {
  display: grid;
  gap: 7px;
}

form label {
  margin-top: 8px;
  color: #465f66;
  font-size: 10px;
  font-weight: 700;
}

ion-input,
ion-textarea {
  --background: #f8fbfa;
  --border-radius: 10px;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 11px;
  --padding-bottom: 11px;
  --placeholder-color: #a0afb1;
  --placeholder-opacity: 1;
  border: 1px solid #eaf0ef;
  border-radius: 10px;
  color: var(--clinic-ink);
  font-size: 11px;
}

ion-input {
  min-height: 43px;
}

ion-textarea {
  min-height: 98px;
}

.input-error {
  border-color: #cf7777;
}

.field-error {
  color: #b24c4c;
  font-size: 9px;
}

.submit-button {
  margin-top: 9px;
  --border-radius: 11px;
  --box-shadow: none;
  height: 46px;
  font-size: 11px;
  font-weight: 700;
}

.form-disclaimer {
  margin: 3px 0 0;
  color: #9aa8aa;
  font-size: 8px;
  text-align: center;
}

.clinic-map {
  margin: 0;
  background: var(--surface);
}

.clinic-map iframe {
  display: block;
  width: 100%;
  height: 320px;
  border: 0;
}

.clinic-map figcaption {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px 14px;
  color: var(--clinic-ink);
  font-size: 13px;
}

.clinic-map a {
  color: var(--clinic-blue);
  font-weight: 700;
  white-space: nowrap;
}

ion-toast {
  --border-radius: 13px;
}

@media (max-width: 760px) {
  .contact-section {
    padding-top: 67px;
  }

  .contact-inner {
    width: min(100% - 42px, 590px);
    padding-bottom: 43px;
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

@media (max-width: 420px) {
  .contact-card {
    padding: 18px;
  }

  .contact-details {
    gap: 14px;
  }
}
</style>
