<template>
  <section class="why-section">
    <div class="why-inner">
      <div class="why-heading">
        <span class="section-kicker">MORE THAN A CHECK-UP</span>
        <h2>Little things<br />that make a<br /><em>big difference.</em></h2>
        <p>Because feeling good about your care is part of feeling good about your smile.</p>
        <a href="#contact">See what care can feel like <ion-icon :icon="arrowForwardOutline" /></a>
      </div>
      <div class="why-features">
        <article v-for="feature in features" :key="feature.title">
          <span class="feature-icon" :class="feature.tone"><ion-icon :icon="feature.icon" /></span>
          <div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
          <ion-icon class="feature-check" :icon="checkmarkCircleOutline" />
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  heartOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
} from 'ionicons/icons'

const features = [
  {
    title: 'People who listen',
    description: 'Your questions and comfort always have a seat at the table.',
    icon: heartOutline,
    tone: 'tone-rose',
  },
  {
    title: 'Modern, thoughtful care',
    description: 'Clear options and current techniques, explained in plain language.',
    icon: sparklesOutline,
    tone: 'tone-blue',
  },
  {
    title: 'A team in your corner',
    description: 'Friendly professionals who care about the person behind the smile.',
    icon: peopleOutline,
    tone: 'tone-green',
  },
  {
    title: 'Your privacy matters',
    description: 'We treat your personal information with care and respect.',
    icon: shieldCheckmarkOutline,
    tone: 'tone-lilac',
  },
]
</script>

<style scoped>
.why-section {
  padding: 91px 0;
  background: #f3f8f7;
}

.why-inner {
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.76fr 1fr;
  gap: 12%;
  align-items: center;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.15px;
}

h2 {
  margin: 15px 0 14px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(42px, 4.5vw, 57px);
  font-weight: 500;
  letter-spacing: -2.5px;
  line-height: 1.02;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.why-heading > p {
  max-width: 315px;
  margin: 0;
  color: #778a90;
  font-size: 12px;
  line-height: 1.75;
}

.why-heading > a {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  text-decoration: none;
}

.why-features {
  display: grid;
  gap: 10px;
}

.why-features article {
  min-height: 83px;
  padding: 14px 15px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #eaf0ef;
  border-radius: 14px;
}

.feature-icon {
  width: 43px;
  height: 43px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 13px;
  font-size: 19px;
}

.tone-rose {
  color: #c5787b;
  background: #fbefed;
}

.tone-blue {
  color: #4a91a0;
  background: #e9f4f5;
}

.tone-green {
  color: #4d9b84;
  background: #e9f5ed;
}

.tone-lilac {
  color: #887da8;
  background: #f1edf7;
}

.why-features article > div {
  flex: 1;
}

.why-features h3 {
  margin: 0 0 4px;
  color: var(--clinic-ink);
  font-size: 11px;
  font-weight: 800;
}

.why-features p {
  margin: 0;
  color: #7f9095;
  font-size: 9px;
  line-height: 1.5;
}

.feature-check {
  color: #73b4a4;
  font-size: 16px;
}

@media (max-width: 760px) {
  .why-section {
    padding: 68px 0;
  }

  .why-inner {
    width: min(100% - 42px, 600px);
    grid-template-columns: 1fr;
    gap: 33px;
  }
}

@media (max-width: 420px) {
  .why-features article {
    gap: 10px;
    padding: 12px;
  }

  .feature-icon {
    width: 37px;
    height: 37px;
  }
}
</style>
