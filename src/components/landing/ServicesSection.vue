<template>
  <section id="services" class="section services-section">
    <div class="section-heading">
      <div class="services-mark" aria-hidden="true">
        <span></span>
        <svg viewBox="0 0 24 24"><path d="M12 6.2c-.9 0-1.6-1.4-2.7-2.5-.8-.8-2-1-2.8-.1C5.2 4.9 4.4 6.5 4.5 8.4c.1 1.8.7 3.4 1.3 4.8.4 1 .2 1.9-.2 3-.5 1.5-.2 3.2 1 4 .8.5 1.7.2 2.2-.7.5-.9.7-1.9.8-2.8.1-.7.5-.9 1.2-.9h.4c.7 0 1.1.2 1.2.9.1.9.3 1.9.8 2.8.5.9 1.4 1.2 2.2.7 1.2-.8 1.5-2.5 1-4-.4-1.1-.6-2-.2-3 .6-1.4 1.2-3 1.3-4.8.1-1.9-.7-3.5-2-4.8-.8-.9-2-.7-2.8.1-1.1 1.1-1.8 2.5-2.7 2.5z" /></svg>
        <span></span>
      </div>
      <h2>Our Services</h2>
      <p>From a regular check-up to a little extra confidence, we make every visit feel easy.</p>
    </div>

    <ion-grid class="service-grid">
      <ion-row>
        <ion-col v-for="(service, index) in services" :key="service.title" size="12" size-md="6" size-lg="3">
          <article class="service-card" :class="{ 'service-card-featured': index === 0 }">
            <div class="service-image">
              <!-- Place service images in public/assets/images/services/ using each card's filename. -->
              <ImagePlaceholder
                :src="`/assets/images/services/${service.image}`"
                :alt="service.imageAlt"
                :label="`Add ${service.image}`"
              />
              <span class="service-icon"><ion-icon :icon="service.icon" /></span>
            </div>
            <div class="service-copy">
              <span class="service-number">0{{ index + 1 }}</span>
              <h3>{{ service.title }}</h3>
              <p>{{ service.description }}</p>
              <a href="#contact" :aria-label="`Ask us about ${service.title}`">
                Learn more <ion-icon :icon="arrowForwardOutline" />
              </a>
            </div>
          </article>
        </ion-col>
      </ion-row>
    </ion-grid>

    <div class="services-footnote">
      <span><ion-icon :icon="sparklesOutline" /> Not sure what you need?</span>
      <a href="#contact">Let's figure it out together <ion-icon :icon="arrowForwardOutline" /></a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonCol, IonGrid, IonIcon, IonRow } from '@ionic/vue'
import { arrowForwardOutline, sparklesOutline } from 'ionicons/icons'
import { CLINIC_SERVICES } from '../../content/clinicServices'
import ImagePlaceholder from './ImagePlaceholder.vue'

const services = CLINIC_SERVICES
</script>

<style scoped>
.section {
  padding: 94px 0;
}

.services-section {
  background: #f7fcfb;
}

.services-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #128f86;
}

.services-mark span {
  width: 72px;
  height: 1px;
  background: #cfe5e1;
}

.services-mark svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.section-heading {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto 40px;
  text-align: center;
}

.section-kicker {
  justify-content: center;
}

h2 {
  margin: 14px 0 12px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(38px, 4.2vw, 54px);
  font-weight: 500;
  letter-spacing: -2px;
  line-height: 1.06;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.section-heading > p {
  max-width: 450px;
  margin: 0 auto;
  color: #778b91;
  font-size: 13px;
  line-height: 1.7;
}

.service-grid {
  width: min(1160px, calc(100% - 36px));
  padding: 0;
}

.service-grid ion-col {
  padding: 9px;
}

.service-card {
  height: 100%;
  overflow: hidden;
  background: #fbfdfd;
  border: 1px solid #edf2f2;
  border-radius: 17px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.service-card:hover {
  box-shadow: 0 14px 32px rgb(30 73 84 / 9%);
  transform: translateY(-3px);
}

.service-card-featured {
  background: #f2f9f8;
}

.service-image {
  position: relative;
  height: 151px;
  background: #e4f1ef;
}

.service-image :deep(.image-fallback) {
  border-radius: 0;
}

.service-image :deep(.fallback-label) {
  bottom: 19px;
}

.service-icon {
  position: absolute;
  right: 14px;
  bottom: -16px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--clinic-blue);
  background: #fff;
  border: 1px solid #edf4f3;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(26 71 83 / 9%);
  font-size: 17px;
}

.service-copy {
  position: relative;
  padding: 20px 17px 17px;
}

.service-number {
  position: absolute;
  top: 19px;
  right: 17px;
  color: #b4c6c8;
  font-family: var(--font-display);
  font-size: 12px;
}

.service-copy h3 {
  margin: 0 0 8px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.service-copy p {
  min-height: 47px;
  margin: 0;
  color: #788c92;
  font-size: 11px;
  line-height: 1.6;
}

.service-copy a {
  margin-top: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  text-decoration: none;
}

.service-copy a ion-icon {
  font-size: 13px;
}

.services-footnote {
  width: min(1160px, calc(100% - 48px));
  margin: 22px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #758b91;
  font-size: 11px;
}

.services-footnote > span,
.services-footnote a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.services-footnote > span ion-icon {
  color: #42b4a3;
  font-size: 15px;
}

.services-footnote a {
  color: var(--clinic-blue);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 600px) {
  .section {
    padding: 67px 0;
  }

  .section-heading {
    width: calc(100% - 38px);
    margin-bottom: 27px;
  }

  .service-grid {
    width: calc(100% - 26px);
  }

  .service-grid ion-col {
    padding: 6px;
  }

  .service-image {
    height: 135px;
  }

  .service-copy {
    padding: 18px 13px 14px;
  }

  .service-copy h3 {
    font-size: 16px;
  }

  .services-footnote {
    width: calc(100% - 38px);
    align-items: flex-start;
    flex-direction: column;
    margin-top: 14px;
  }
}
</style>
