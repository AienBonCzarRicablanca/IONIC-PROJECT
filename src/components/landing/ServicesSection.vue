<template>
  <section id="services" class="section services-section">
    <div class="section-heading">
      <span class="section-kicker">A LITTLE SOMETHING FOR EVERY SMILE</span>
      <h2>Care for all the<br /><em>reasons you smile.</em></h2>
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
import {
  arrowForwardOutline,
  bandageOutline,
  colorPaletteOutline,
  fitnessOutline,
  happyOutline,
  chatbubbleEllipsesOutline,
  medicalOutline,
  scanOutline,
  sparklesOutline,
  timeOutline,
} from 'ionicons/icons'
import ImagePlaceholder from './ImagePlaceholder.vue'

const services = [
  {
    title: 'Dental cleaning',
    description: 'A fresh start for your smile with a gentle, thorough clean.',
    image: 'dental-cleaning.jpg',
    imageAlt: 'Dental cleaning service',
    icon: sparklesOutline,
  },
  {
    title: 'Dental fillings',
    description: 'Comfort-first repairs that help your natural smile shine.',
    image: 'dental-filling.jpg',
    imageAlt: 'Dental filling service',
    icon: bandageOutline,
  },
  {
    title: 'Teeth whitening',
    description: 'A brighter look, thoughtfully tailored to your smile.',
    image: 'teeth-whitening.jpg',
    imageAlt: 'Teeth whitening service',
    icon: colorPaletteOutline,
  },
  {
    title: 'Braces & alignment',
    description: 'Personalized options for a smile that feels like you.',
    image: 'braces-and-alignment.jpg',
    imageAlt: 'Braces and alignment service',
    icon: fitnessOutline,
  },
  {
    title: 'Tooth extraction',
    description: 'Considerate care and clear support at every step.',
    image: 'tooth-extraction.jpg',
    imageAlt: 'Tooth extraction service',
    icon: medicalOutline,
  },
  {
    title: 'Root canal care',
    description: 'Relief-focused treatment to help protect your tooth.',
    image: 'root-canal.jpg',
    imageAlt: 'Root canal service',
    icon: timeOutline,
  },
  {
    title: 'Dental X-rays',
    description: 'A clearer picture to guide confident, informed care.',
    image: 'dental-x-ray.jpeg',
    imageAlt: 'Dental X-ray service',
    icon: scanOutline,
  },
  {
    title: 'Family dentistry',
    description: 'Welcoming check-ups for the whole family, big and small.',
    image: 'family-dentistry.jpg',
    imageAlt: 'Family dentistry service',
    icon: happyOutline,
  },
  {
    title: 'Dental consultation',
    description: 'A relaxed conversation to talk through your questions and options.',
    image: 'dental-consultation.jpg',
    imageAlt: 'Dental consultation service',
    icon: chatbubbleEllipsesOutline,
  },
]
</script>

<style scoped>
.section {
  padding: 94px 0;
}

.services-section {
  background: #fff;
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
