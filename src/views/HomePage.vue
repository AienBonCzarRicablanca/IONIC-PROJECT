<template>
  <ion-page>
    <AppHeader />
    <ion-content :fullscreen="true" class="landing-content">
      <main>
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <GallerySection />
        <DentistSection />
        <WhyChooseUsSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
import AboutSection from '../components/landing/AboutSection.vue'
import AppHeader from '../components/landing/AppHeader.vue'
import ContactSection from '../components/landing/ContactSection.vue'
import DentistSection from '../components/landing/DentistSection.vue'
import GallerySection from '../components/landing/GallerySection.vue'
import HeroSection from '../components/landing/HeroSection.vue'
import LandingFooter from '../components/landing/LandingFooter.vue'
import ServicesSection from '../components/landing/ServicesSection.vue'
import TestimonialsSection from '../components/landing/TestimonialsSection.vue'
import WhyChooseUsSection from '../components/landing/WhyChooseUsSection.vue'

</script>

<style scoped>
.landing-content {
  --background: var(--canvas);
  --padding-bottom: 0;
}

main {
  overflow: hidden;
}
</style>
