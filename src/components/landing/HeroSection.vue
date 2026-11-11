<template>
  <section id="home" class="hero-section">
    <img class="hero-room" src="/assets/images/hero-clinic-bright.jpg" alt="" />
    <div class="hero-fade" aria-hidden="true"></div>
    <div class="hero-inner">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot" /> YOUR NEIGHBORHOOD DENTAL STUDIO</span>
        <h1>Good care.<br /><span>Great smiles.</span></h1>
        <p class="hero-description">
          Thoughtful dental care for every stage of life. Feel comfortable, feel heard, and leave
          smiling a little brighter.
        </p>
        <div class="hero-actions">
          <ion-button class="primary-cta" router-link="/patient/appointments">
            Book your first visit
            <ion-icon slot="end" :icon="arrowForwardOutline" />
          </ion-button>
          <a class="ghost-cta" href="#services">
            Explore our care
            <ion-icon :icon="arrowDownOutline" />
          </a>
        </div>
      </div>

      <div class="hero-visual">
        <svg class="hero-wave" viewBox="0 0 680 620" aria-hidden="true">
          <path d="M430 -20c90 70 150 40 230 110" fill="none" stroke="#b7efe4" stroke-width="34" stroke-linecap="round" />
          <path d="M250 430c150 120 310 70 430 -10" fill="none" stroke="#12a394" stroke-width="54" stroke-linecap="round" />
          <path d="M210 520c170 90 340 40 470 -40" fill="none" stroke="#d9f7f1" stroke-width="42" stroke-linecap="round" />
        </svg>
        <img
          class="hero-portrait"
          src="/assets/images/hero-dental-clinic.jpg"
          alt="Dr. Nicole Primero welcoming patients at Harbor Dental"
        />
        <p class="hero-script">Your Smile, <em>Our Priority</em> <span aria-hidden="true">♥</span></p>
      </div>
    </div>

    <ul class="hero-highlights">
      <li>
        <span class="hi-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M8.2 3.6c1.3-1.5 2.6-1.4 3.5.2.4.7 1 .7 1.4 0 .9-1.6 2.2-1.7 3.5-.2 1.6 1.8 2.6 4.4 1.8 7.2-.6 2.4-1.5 4.6-2.4 6.2-.5.9-1.5.5-1.7-.5-.4-1.7-.8-1.6-1.3.1-.4 1.3-1.5 1.4-2 .3-1.1-2-2.1-4.6-2.6-7.2-.6-2.6.2-5.2 1.8-7.1z" /></svg>
        </span>
        <span>
          <strong>Comprehensive Care</strong>
          <small>From routine checkups to advanced treatments.</small>
        </span>
      </li>
      <li>
        <span class="hi-icon" aria-hidden="true"><ion-icon :icon="shieldCheckmarkOutline" /></span>
        <span>
          <strong>Trusted Professionals</strong>
          <small>A skilled, kind team that takes the time.</small>
        </span>
      </li>
      <li>
        <span class="hi-icon" aria-hidden="true"><ion-icon :icon="heartOutline" /></span>
        <span>
          <strong>A Comfortable Experience</strong>
          <small>A bright clinic and an easy, calm visit.</small>
        </span>
      </li>
      <li>
        <span class="hi-icon" aria-hidden="true"><ion-icon :icon="calendarOutline" /></span>
        <span>
          <strong>Easy Appointment</strong>
          <small>Book online, at a time that suits you.</small>
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { arrowDownOutline, arrowForwardOutline, calendarOutline, heartOutline, shieldCheckmarkOutline } from 'ionicons/icons'
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  padding: 28px 0 36px;
  background: #f4fbf9;
}

.hero-room {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 70% center;
  opacity: 0.42;
  pointer-events: none;
}

.hero-fade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px 280px at 8% 18%, rgb(186 236 224 / 70%), transparent 70%),
    linear-gradient(90deg, rgb(244 251 249 / 96%) 0%, rgb(244 251 249 / 88%) 34%, rgb(244 251 249 / 28%) 68%, rgb(244 251 249 / 8%));
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: min(1160px, calc(100% - 48px));
  min-height: 520px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  align-items: center;
  gap: 4%;
}

.hero-copy {
  position: relative;
  z-index: 2;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #128f86;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  background: #2ec4b6;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgb(46 196 182 / 16%);
}

h1 {
  margin: 18px 0 16px;
  color: #12343c;
  font-family: var(--font-display);
  font-size: clamp(58px, 6.2vw, 86px);
  font-weight: 500;
  letter-spacing: -3.5px;
  line-height: 0.94;
}

h1 span {
  color: #128f86;
  font-style: italic;
  font-weight: 500;
}

.hero-description {
  max-width: 440px;
  margin: 0;
  color: #5d757c;
  font-size: 16px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.primary-cta {
  --background: #0e7c74;
  --background-hover: #0c6a63;
  --background-activated: #0c6a63;
  --color: #fff;
  --border-radius: 999px;
  --box-shadow: 0 10px 22px rgb(14 124 116 / 22%);
  height: 50px;
  font-size: 14px;
  font-weight: 700;
}

.ghost-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 50px;
  padding: 0 18px;
  color: #14343c;
  background: #fff;
  border: 1.5px solid #d5e6e3;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.ghost-cta ion-icon {
  color: #128f86;
  font-size: 16px;
}

.hero-visual {
  position: relative;
  height: min(520px, 46vw);
  min-height: 380px;
}

.hero-wave {
  position: absolute;
  right: -8%;
  top: -6%;
  width: 118%;
  height: 112%;
  pointer-events: none;
}

.hero-portrait {
  position: absolute;
  right: 4%;
  bottom: 0;
  width: min(460px, 78%);
  height: 96%;
  object-fit: cover;
  object-position: center 18%;
  mask-image: radial-gradient(ellipse 72% 78% at 58% 46%, #000 58%, transparent 78%);
}

.hero-script {
  position: absolute;
  right: 2%;
  bottom: 18%;
  margin: 0;
  color: #128f86;
  font-family: var(--font-display);
  font-size: clamp(26px, 2.4vw, 34px);
  font-style: italic;
  font-weight: 500;
  line-height: 1.05;
  transform: rotate(-8deg);
  text-shadow: 0 8px 18px rgb(255 255 255 / 70%);
}

.hero-script span {
  font-style: normal;
}

.hero-highlights {
  position: relative;
  z-index: 2;
  width: min(1080px, calc(100% - 48px));
  margin: 8px auto 0;
  padding: 18px 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  list-style: none;
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 16px 40px rgb(20 80 86 / 8%);
}

.hero-highlights li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 8px 10px;
}

.hero-highlights li + li {
  border-left: 1px solid #e4f0ee;
}

.hi-icon {
  width: 42px;
  height: 42px;
  display: grid;
  flex: none;
  place-items: center;
  color: #128f86;
  font-size: 22px;
}

.hi-icon svg {
  width: 26px;
  height: 26px;
  fill: currentColor;
}

.hero-highlights strong,
.hero-highlights small {
  display: block;
}

.hero-highlights strong {
  color: #14343c;
  font-size: 14px;
}

.hero-highlights small {
  margin-top: 2px;
  color: #6d848b;
  font-size: 12px;
  line-height: 1.35;
}

:global(html.ion-palette-dark) .hero-fade {
  background:
    radial-gradient(420px 280px at 8% 18%, rgb(20 90 86 / 35%), transparent 70%),
    linear-gradient(90deg, rgb(16 34 38 / 94%) 0%, rgb(16 34 38 / 82%) 38%, rgb(16 34 38 / 28%) 70%);
}

:global(html.ion-palette-dark) .hero-room {
  opacity: 0.22;
}

:global(html.ion-palette-dark) .ghost-cta {
  color: #e7f4f2;
  background: transparent;
  border-color: #2c4a4e;
}

:global(html.ion-palette-dark) .hero-highlights {
  background: #173034;
  box-shadow: none;
}

:global(html.ion-palette-dark) .hero-highlights li + li {
  border-color: #2c4548;
}

:global(html.ion-palette-dark) .hero-highlights strong {
  color: #e7f4f2;
}

@media (max-width: 980px) {
  .hero-highlights {
    grid-template-columns: 1fr 1fr;
  }

  .hero-highlights li:nth-child(3) {
    border-left: 0;
  }
}

@media (max-width: 820px) {
  .hero-inner {
    width: min(100% - 36px, 640px);
    min-height: 0;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .hero-visual {
    height: 420px;
    min-height: 0;
  }

  .hero-portrait {
    right: 8%;
    width: min(380px, 86%);
  }

  .hero-highlights {
    width: min(100% - 28px, 640px);
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: clamp(48px, 14vw, 64px);
    letter-spacing: -2.4px;
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .ghost-cta,
  .primary-cta {
    justify-content: center;
  }

  .hero-visual {
    height: 340px;
  }

  .hero-script {
    right: 4%;
    bottom: 10%;
    font-size: 24px;
  }

  .hero-highlights {
    grid-template-columns: 1fr;
    padding: 8px 12px;
  }

  .hero-highlights li,
  .hero-highlights li:nth-child(3) {
    border-left: 0;
    border-top: 1px solid #e4f0ee;
  }

  .hero-highlights li:first-child {
    border-top: 0;
  }
}
</style>
