<template>
  <section class="testimonials-section">
    <div class="testimonial-heading">
      <span class="section-kicker">KIND WORDS, PLACEHOLDER STORIES</span>
      <h2>Smiles say a lot.<br /><em>So do people.</em></h2>
      <span class="sample-badge"><ion-icon :icon="informationCircleOutline" /> Sample testimonials for layout preview</span>
    </div>
    <div class="testimonial-grid">
      <article v-for="quote in testimonials" :key="quote.name" class="quote-card">
        <div class="quote-stars" aria-label="5 out of 5 stars">
          <ion-icon v-for="star in 5" :key="star" :icon="starOutline" />
        </div>
        <span class="quote-mark" aria-hidden="true">“</span>
        <blockquote>{{ quote.text }}</blockquote>
        <div class="quote-person">
          <span class="quote-avatar">{{ quote.initial }}</span>
          <span><strong>{{ quote.name }}</strong><small>{{ quote.detail }}</small></span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { informationCircleOutline, starOutline } from 'ionicons/icons'

const testimonials = [
  {
    text: 'Everyone made me feel welcome from the moment I walked in. They explained everything without rushing me.',
    name: 'Taylor R.',
    detail: 'A happier check-up',
    initial: 'T',
  },
  {
    text: 'I used to put off appointments. The team was so kind and patient that I finally feel relaxed coming in.',
    name: 'Jordan M.',
    detail: 'Part of the Harbor family',
    initial: 'J',
  },
  {
    text: 'Clear advice, no pressure, and a lovely team. I left knowing exactly what my options were.',
    name: 'Sam L.',
    detail: 'A brighter visit',
    initial: 'S',
  },
]
</script>

<style scoped>
.testimonials-section {
  padding: 89px 0 94px;
  background: #fff;
}

.testimonial-heading {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto 35px;
  text-align: center;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.15px;
}

h2 {
  margin: 14px 0 12px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(38px, 4.1vw, 52px);
  font-weight: 500;
  letter-spacing: -2px;
  line-height: 1.05;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.sample-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  color: #6f8a90;
  background: #eff7f5;
  border-radius: 20px;
  font-size: 9px;
}

.sample-badge ion-icon {
  color: #55a79a;
  font-size: 12px;
}

.testimonial-grid {
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.quote-card {
  position: relative;
  min-height: 218px;
  padding: 22px 21px 18px;
  background: #f8fbfa;
  border: 1px solid #edf2f1;
  border-radius: 16px;
}

.quote-stars {
  display: flex;
  gap: 3px;
  color: #e8b766;
  font-size: 13px;
}

.quote-mark {
  position: absolute;
  top: 17px;
  right: 19px;
  color: #d4e8e3;
  font-family: var(--font-display);
  font-size: 54px;
  line-height: 1;
}

blockquote {
  min-height: 69px;
  margin: 18px 0 18px;
  color: #536e75;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.55;
}

.quote-person {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 13px;
  border-top: 1px solid #e8efed;
}

.quote-avatar {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  color: #397e88;
  background: #e0efeb;
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.quote-card:nth-child(2) .quote-avatar {
  color: #8b6c58;
  background: #f1e6dc;
}

.quote-card:nth-child(3) .quote-avatar {
  color: #705f81;
  background: #ebe4f0;
}

.quote-person > span:last-child {
  display: grid;
  gap: 3px;
}

.quote-person strong {
  color: var(--clinic-ink);
  font-size: 10px;
}

.quote-person small {
  color: #91a0a3;
  font-size: 9px;
}

@media (max-width: 760px) {
  .testimonials-section {
    padding: 67px 0;
  }

  .testimonial-grid {
    width: min(100% - 42px, 520px);
    grid-template-columns: 1fr;
  }

  .quote-card {
    min-height: 0;
  }
}
</style>
