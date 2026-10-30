<template>
  <section id="home" class="hero-section">
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
          <a class="text-link" href="#services">
            Explore our care
            <ion-icon :icon="arrowDownOutline" />
          </a>
        </div>
        <div class="hero-proof">
          <div class="avatar-stack" aria-hidden="true">
            <span>J</span><span>M</span><span>A</span>
          </div>
          <p><strong>A little more personal.</strong><br />Care built around you, not the other way around.</p>
        </div>
      </div>

      <div class="hero-visual">
        <!-- Add your hero image at public/assets/images/hero-dental-clinic.jpg. -->
        <ImagePlaceholder
          src="/assets/images/hero-dental-clinic.jpg"
          alt="Welcoming, bright dental clinic"
          label="Add hero-dental-clinic.jpg"
        />
        <div class="hero-image-wash" />
        <div class="floating-note">
          <span class="note-icon"><ion-icon :icon="heartOutline" /></span>
          <span><strong>Here for your smile</strong><small>Gentle care, every visit</small></span>
        </div>
        <div class="hero-sticker" aria-label="Care that feels different">
          <span>care that</span><strong>feels<br />different</strong>
          <ion-icon :icon="sparklesOutline" />
        </div>
        <span class="hero-scribble" aria-hidden="true" />
      </div>
    </div>
    <div class="hero-bottom">
      <span>SMALL DETAILS. BIG DIFFERENCE.</span>
      <a href="#about" aria-label="Scroll to learn about us"><ion-icon :icon="arrowDownOutline" /></a>
      <span>YOUR SMILE IS IN GOOD HANDS</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import {
  arrowDownOutline,
  arrowForwardOutline,
  heartOutline,
  sparklesOutline,
} from 'ionicons/icons'
import ImagePlaceholder from './ImagePlaceholder.vue'
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  background: #f5faf9;
}

.hero-inner {
  width: min(1160px, calc(100% - 48px));
  min-height: 590px;
  margin: 0 auto;
  padding: 67px 0 62px;
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  align-items: center;
  gap: 7%;
}

.hero-copy {
  position: relative;
  z-index: 2;
  padding-bottom: 11px;
}

.eyebrow,
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.35px;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  background: #47baa9;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(71 186 169 / 12%);
}

h1 {
  margin: 24px 0 17px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(54px, 6vw, 82px);
  font-weight: 500;
  letter-spacing: -4.5px;
  line-height: 0.99;
}

h1 span {
  color: var(--clinic-blue);
  font-style: italic;
}

.hero-description {
  max-width: 430px;
  margin: 0;
  color: #667c83;
  font-size: 15px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 21px;
  margin-top: 29px;
}

.primary-cta {
  --border-radius: 13px;
  --box-shadow: 0 9px 21px rgb(33 126 141 / 20%);
  height: 51px;
  font-size: 13px;
  font-weight: 700;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--clinic-ink);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.text-link ion-icon {
  color: var(--clinic-blue);
  font-size: 17px;
}

.hero-proof {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 41px;
}

.avatar-stack {
  display: flex;
  padding-left: 3px;
}

.avatar-stack span {
  width: 31px;
  height: 31px;
  margin-left: -4px;
  display: grid;
  place-items: center;
  color: #3f6c73;
  background: #d9ece8;
  border: 2px solid #f5faf9;
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.avatar-stack span:nth-child(2) {
  color: #7d6756;
  background: #f2e2d2;
}

.avatar-stack span:nth-child(3) {
  color: #705b78;
  background: #e7dcee;
}

.hero-proof p {
  margin: 0;
  color: #7d9096;
  font-size: 10px;
  line-height: 1.55;
}

.hero-proof strong {
  color: #38545c;
  font-size: 11px;
}

.hero-visual {
  position: relative;
  height: min(470px, 42vw);
  min-height: 340px;
  border-radius: 48% 48% 20px 20px;
  background: #d7ecea;
}

.hero-visual :deep(.image-frame) {
  border-radius: inherit;
}

.hero-visual :deep(.image-fallback) {
  background: linear-gradient(145deg, #deefea, #d8e9ec 56%, #c8e2de);
}

.hero-image-wash {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, transparent 62%, rgb(34 80 88 / 12%));
  pointer-events: none;
}

.floating-note {
  position: absolute;
  right: -24px;
  bottom: 39px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 17px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 34px rgb(42 81 89 / 13%);
}

.note-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #26889a;
  background: #e8f5f4;
  border-radius: 11px;
  font-size: 17px;
}

.floating-note > span:last-child {
  display: grid;
  gap: 3px;
}

.floating-note strong {
  color: var(--clinic-ink);
  font-size: 11px;
}

.floating-note small {
  color: #81939a;
  font-size: 9px;
}

.hero-sticker {
  position: absolute;
  top: 29px;
  right: -31px;
  width: 102px;
  height: 102px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #42b5a3;
  border: 5px solid #f5faf9;
  border-radius: 50%;
  text-align: center;
  transform: rotate(8deg);
}

.hero-sticker span {
  font-family: var(--font-display);
  font-size: 9px;
  font-style: italic;
}

.hero-sticker strong {
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.03;
}

.hero-sticker ion-icon {
  position: absolute;
  right: 10px;
  bottom: 9px;
  font-size: 13px;
}

.hero-scribble {
  position: absolute;
  top: 28%;
  left: -42px;
  width: 22px;
  height: 22px;
  background:
    linear-gradient(var(--clinic-teal), var(--clinic-teal)) center / 2px 100% no-repeat,
    linear-gradient(var(--clinic-teal), var(--clinic-teal)) center / 100% 2px no-repeat;
}

.hero-bottom {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: #799096;
  background: #edf6f4;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.25px;
}

.hero-bottom a {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: var(--clinic-blue);
  background: white;
  border-radius: 50%;
  font-size: 15px;
}

@media (max-width: 820px) {
  .hero-inner {
    width: min(100% - 44px, 620px);
    min-height: 0;
    padding: 55px 0 54px;
    grid-template-columns: 1fr;
    gap: 42px;
  }

  .hero-copy {
    padding: 0;
  }

  .hero-visual {
    width: 88%;
    height: 390px;
    min-height: 0;
    margin-left: auto;
  }

  .hero-sticker {
    right: -25px;
  }

  .floating-note {
    right: -18px;
  }
}

@media (max-width: 480px) {
  .hero-inner {
    width: calc(100% - 38px);
    padding-top: 42px;
    gap: 34px;
  }

  h1 {
    margin-top: 20px;
    font-size: clamp(53px, 16vw, 69px);
    letter-spacing: -3.4px;
  }

  .hero-description {
    font-size: 14px;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
    margin-top: 23px;
  }

  .hero-proof {
    margin-top: 28px;
  }

  .hero-visual {
    width: 91%;
    height: 300px;
  }

  .hero-sticker {
    top: 17px;
    right: -20px;
    width: 83px;
    height: 83px;
  }

  .hero-sticker strong {
    font-size: 12px;
  }

  .floating-note {
    right: -13px;
    bottom: 18px;
    padding: 10px 12px;
  }

  .hero-bottom {
    gap: 12px;
    font-size: 7px;
    letter-spacing: 0.7px;
  }
}
</style>
