<template>
  <ion-header class="site-header">
    <ion-toolbar>
      <div class="header-inner">
        <a class="brand" href="#home" aria-label="Harbor Dental home" @click="closeMenu">
          <span class="brand-mark"><ion-icon :icon="sparklesOutline" /></span>
          <span class="brand-copy">
            <strong>harbor<span> dental</span></strong>
            <small>CARE THAT FEELS DIFFERENT</small>
          </span>
        </a>

        <ion-button
          class="menu-toggle"
          fill="clear"
          aria-label="Toggle navigation"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <ion-icon :icon="menuOpen ? closeOutline : menuOutline" />
        </ion-button>

        <nav class="navigation" :class="{ 'navigation-open': menuOpen }" aria-label="Main navigation">
          <a href="#home" @click="closeMenu">Home</a>
          <a href="#about" @click="closeMenu">About us</a>
          <a href="#services" @click="closeMenu">Services</a>
          <a href="#dentists" @click="closeMenu">Our dentists</a>
          <a href="#contact" @click="closeMenu">Contact</a>
          <div class="navigation-actions">
            <ThemeToggle icon-only />
            <ion-button fill="clear" class="login-button" router-link="/login" @click="closeMenu">Sign in</ion-button>
            <ion-button class="header-cta" router-link="/patient/appointments" @click="closeMenu">
              Book a visit
              <ion-icon slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </div>
        </nav>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonHeader, IonIcon, IonToolbar } from '@ionic/vue'
import ThemeToggle from '../common/ThemeToggle.vue'
import {
  arrowForwardOutline,
  closeOutline,
  menuOutline,
  sparklesOutline,
} from 'ionicons/icons'

const menuOpen = ref(false)

function closeMenu() {
  menuOpen.value = false
}
</script>

<style scoped>
.site-header {
  box-shadow: 0 1px 0 rgb(18 61 75 / 7%);
}

ion-toolbar {
  --background: var(--surface);
  --min-height: 82px;
  --padding-start: 0;
  --padding-end: 0;
}

.header-inner {
  width: min(1160px, calc(100% - 48px));
  min-height: 82px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--clinic-ink);
  text-decoration: none;
  flex-shrink: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--clinic-blue);
  border-radius: 15px;
  font-size: 21px;
  transform: rotate(-5deg);
}

.brand-copy {
  display: grid;
  gap: 2px;
}

.brand-copy strong {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
}

.brand-copy strong span {
  color: var(--clinic-blue);
}

.brand-copy small {
  color: var(--muted);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.15px;
}

.navigation {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 29px);
}

.navigation > a {
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 160ms ease;
}

.navigation > a:hover,
.navigation > a:focus-visible {
  color: var(--clinic-blue);
}

.navigation-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-button {
  --color: var(--clinic-ink);
  font-size: 13px;
  font-weight: 700;
}

.header-cta {
  --border-radius: 12px;
  --box-shadow: none;
  font-size: 13px;
  font-weight: 700;
  height: 44px;
}

.menu-toggle {
  display: none;
  --color: var(--clinic-ink);
  font-size: 22px;
}

@media (max-width: 820px) {
  ion-toolbar {
    --min-height: 72px;
  }

  .header-inner {
    width: min(100% - 36px, 650px);
    min-height: 72px;
    flex-wrap: wrap;
    gap: 0;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .navigation {
    display: none;
    flex-basis: 100%;
    align-items: stretch;
    flex-direction: column;
    gap: 0;
    padding: 5px 0 17px;
  }

  .navigation-open {
    display: flex;
  }

  .navigation > a {
    padding: 12px 4px;
    border-top: 1px solid var(--line);
  }

  .navigation-actions {
    padding-top: 10px;
  }

  .navigation-actions ion-button {
    flex: 1;
  }
}
</style>
