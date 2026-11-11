<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button menu="app-menu" aria-label="Open menu" /></ion-buttons>
        <ion-title>About the clinic</ion-title>
        <ion-buttons slot="end"><HeaderTools notifications /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="about-page">
        <header class="about-lead">
          <p>Harbor Dental</p>
          <h2>A visit can feel like a fresh start.</h2>
          <p>
            Dental care should feel clear, kind, and made for you. The team listens, explains the
            options, and keeps the next step easy to follow.
          </p>
        </header>

        <div class="about-facts">
          <article>
            <h3>The practice</h3>
            <p>
              Harbor Dental is on J.P. Rizal Street in Calapan City, Oriental Mindoro. Families,
              students, and long-time patients share the same front desk.
            </p>
          </article>
          <article>
            <h3>A visit</h3>
            <p>
              Book in the app or call (043) 000-1400. The team confirms the chair, meets you by
              name, and reviews your chart before you sit down. Fees are explained before treatment.
            </p>
          </article>
          <article>
            <h3>Hours</h3>
            <p>
              Monday to Saturday, 8:00 to 5:00. Closed on Sundays. Trouble breathing or swelling of
              the face needs urgent care, not a message in the app.
            </p>
          </article>
          <article>
            <h3>What we hold to</h3>
            <p>
              The mission is thoughtful care that feels welcoming. The hope is a community that
              feels good about showing its smile. Your records stay with the clinic.
            </p>
          </article>
        </div>

        <section class="about-team">
          <h2>Who keeps the clinic running</h2>
          <p>Hover or tap a portrait. The note opens beside that person.</p>
          <OrgChart />
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import HeaderTools from '../../components/common/HeaderTools.vue'
import OrgChart from '../../components/landing/OrgChart.vue'
</script>

<style scoped>
.about-page {
  width: min(1080px, 100%);
  margin: 0 auto;
  padding: 4px 2px 28px;
}

.about-lead p:first-child {
  margin: 0;
  color: var(--clinic-blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.about-lead h2,
.about-team h2 {
  margin: 8px 0;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.04em;
}

.about-lead h2 {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

.about-lead p:last-child,
.about-team > p,
.about-facts p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.about-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 18px 0 28px;
}

.about-facts article {
  padding: 16px;
  background: color-mix(in srgb, var(--surface) 84%, transparent);
  border: 1px solid color-mix(in srgb, var(--surface) 70%, var(--line));
  border-radius: 18px;
}

.about-facts h3 {
  margin: 0 0 6px;
  color: var(--clinic-ink);
  font-size: 16px;
}

.about-team > p {
  margin-bottom: 14px;
}
</style>
