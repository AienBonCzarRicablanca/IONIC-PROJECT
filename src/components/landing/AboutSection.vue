<template>
  <section id="about" class="about-section">
    <div class="about-inner">
      <div class="about-visual">
        <!-- Add the clinic photo at public/assets/images/about-clinic.jpg. -->
        <ImagePlaceholder
          src="/assets/images/about-clinic.jpg"
          alt="Harbor Dental's welcoming clinic"
          label="Add about-clinic.jpg"
        />
        <div class="photo-caption"><span>01</span> A calmer kind of dental visit</div>
        <div class="about-stamp"><strong>care<br />first</strong><ion-icon :icon="heartOutline" /></div>
      </div>

      <div class="about-copy">
        <span class="section-kicker">A CLINIC WITH A LITTLE MORE HEART</span>
        <h2>We believe a<br />visit can feel<br /><em>like a fresh start.</em></h2>
        <p>
          Dental care should feel clear, kind, and made for you. We take the time to listen, explain
          your options, and help you feel at ease at every step.
        </p>
        <div class="clinic-values">
          <div>
            <span class="value-icon"><ion-icon :icon="heartOutline" /></span>
            <span><strong>Our mission</strong><small>To make thoughtful dental care feel welcoming and within reach.</small></span>
          </div>
          <div>
            <span class="value-icon value-icon-teal"><ion-icon :icon="sunnyOutline" /></span>
            <span><strong>Our vision</strong><small>A community that feels good about showing off its smiles.</small></span>
          </div>
        </div>
        <a href="#organization" class="about-link">Meet the team <ion-icon :icon="arrowForwardOutline" /></a>
      </div>
    </div>

    <div class="about-story">
      <article>
        <span class="section-kicker">THE PRACTICE</span>
        <h3>A neighborhood clinic with a careful pace.</h3>
        <p>
          Harbor Dental is on J.P. Rizal Street in Calapan City. The rooms are set up for
          unhurried visits: a clear explanation first, then treatment you have agreed to.
          Families, students, and long-time patients share the same front desk.
        </p>
      </article>
      <article>
        <span class="section-kicker">A VISIT</span>
        <h3>You always know what happens next.</h3>
        <p>
          Book from the portal or call (043) 000-1400. The team confirms the chair, meets you
          by name, and reviews your chart before you sit down. Fees are explained before
          treatment, and your records stay with the clinic.
        </p>
      </article>
      <article>
        <span class="section-kicker">HOURS</span>
        <h3>Monday to Saturday, 8:00 to 5:00.</h3>
        <p>
          The clinic is closed on Sundays. If you are in pain, call during open hours and the
          front desk will look for the earliest safe chair. Trouble breathing or swelling of
          the face needs urgent care, not a message in the app.
        </p>
      </article>
    </div>

    <div id="organization" class="about-org">
      <div class="section-heading">
        <span class="section-kicker">THE PEOPLE</span>
        <h2>Who keeps the<br /><em>clinic running.</em></h2>
        <p>Hover or tap a portrait. The note opens beside that person.</p>
      </div>
      <OrgChart />
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline, heartOutline, sunnyOutline } from 'ionicons/icons'
import ImagePlaceholder from './ImagePlaceholder.vue'
import OrgChart from './OrgChart.vue'
</script>

<style scoped>
.about-section {
  padding: 98px 0;
  overflow: hidden;
  background: #f3f8f7;
}

.about-inner {
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 0.92fr;
  align-items: center;
  gap: 11%;
}

.about-visual {
  position: relative;
  height: 440px;
  border-radius: 18px 90px 18px 18px;
  background: #deefeb;
}

.about-visual :deep(.image-frame),
.about-visual :deep(.image-fallback) {
  border-radius: inherit;
}

.photo-caption {
  position: absolute;
  left: 20px;
  bottom: 18px;
  padding: 10px 13px;
  color: #3c616a;
  background: rgb(255 255 255 / 91%);
  border-radius: 9px;
  font-size: 10px;
  font-weight: 700;
}

.photo-caption span {
  margin-right: 8px;
  color: var(--clinic-blue);
}

.about-stamp {
  position: absolute;
  top: 40px;
  right: -37px;
  width: 93px;
  height: 93px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #347f8e;
  border: 5px solid #f3f8f7;
  border-radius: 50%;
  text-align: center;
  transform: rotate(9deg);
}

.about-stamp strong {
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 0.95;
}

.about-stamp ion-icon {
  margin-top: 4px;
  font-size: 12px;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.15px;
}

h2 {
  margin: 15px 0 17px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(42px, 4.6vw, 58px);
  font-weight: 500;
  letter-spacing: -2.8px;
  line-height: 1.02;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.about-copy > p {
  max-width: 430px;
  margin: 0;
  color: #71868c;
  font-size: 13px;
  line-height: 1.8;
}

.clinic-values {
  display: grid;
  gap: 18px;
  margin: 25px 0 23px;
}

.clinic-values > div {
  display: flex;
  align-items: center;
  gap: 13px;
}

.value-icon {
  width: 39px;
  height: 39px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: #438293;
  background: #e3efee;
  border-radius: 13px;
  font-size: 19px;
}

.value-icon-teal {
  color: #4fa99b;
  background: #e4f2eb;
}

.clinic-values > div > span:last-child {
  display: grid;
  gap: 4px;
}

.clinic-values strong {
  color: var(--clinic-ink);
  font-size: 11px;
}

.clinic-values small {
  max-width: 330px;
  color: #788b90;
  font-size: 10px;
  line-height: 1.55;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--clinic-blue);
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
}

.about-link ion-icon {
  font-size: 15px;
}

.about-story {
  width: min(1080px, calc(100% - 48px));
  margin: 64px auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.about-story article {
  padding: 22px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.about-story h3 {
  margin: 10px 0 8px;
  color: var(--clinic-ink);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.about-story p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.about-org {
  width: min(1160px, calc(100% - 48px));
  margin: 72px auto 0;
}

.section-heading h2 {
  margin: 12px 0;
}

.section-heading p {
  max-width: 520px;
  margin: 0 0 22px;
  color: #71868c;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 760px) {
  .about-section {
    padding: 68px 0;
  }

  .about-inner,
  .about-story,
  .about-org {
    width: min(100% - 42px, 720px);
  }

  .about-inner {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .about-story {
    grid-template-columns: 1fr;
  }

  .about-visual {
    width: 90%;
    height: 340px;
  }

  .about-stamp {
    right: -30px;
  }
}

@media (max-width: 420px) {
  .about-visual {
    height: 285px;
  }

  h2 {
    font-size: 43px;
  }
}
</style>
