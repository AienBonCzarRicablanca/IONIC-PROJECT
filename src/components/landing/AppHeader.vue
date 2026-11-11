<template>
  <ion-header class="site-header">
    <ion-toolbar>
      <div class="header-inner">
        <div class="brand-lockup">
          <a class="brand" href="#home" aria-label="Harbor Dental home" @click="closeMenu">
            <img class="brand-mark" :src="'/logo.png'" alt="" />
            <span class="brand-copy">
              <strong>harbor<span> dental</span></strong>
              <small>CARE THAT FEELS DIFFERENT</small>
            </span>
          </a>
          <span class="brand-rule" aria-hidden="true"></span>
        </div>

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
          <a
            v-for="item in links"
            :key="item.id"
            :href="`#${item.id}`"
            :class="{ 'nav-current': current === item.id }"
            :aria-current="current === item.id ? 'true' : undefined"
            @click="pick(item.id)"
          >{{ item.label }}</a>
          <div class="navigation-actions">
            <ThemeToggle icon-only />
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
import { onMounted, onUnmounted, ref } from 'vue'
import { IonButton, IonHeader, IonIcon, IonToolbar } from '@ionic/vue'
import ThemeToggle from '../common/ThemeToggle.vue'
import {
  arrowForwardOutline,
  closeOutline,
  menuOutline,
} from 'ionicons/icons'

const links = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'about', label: 'About us' },
  { id: 'organization', label: 'Our team' },
  { id: 'dentists', label: 'Our dentists' },
  { id: 'contact', label: 'Contact' },
]

const menuOpen = ref(false)
const current = ref('home')
let content: (HTMLElement & { scrollEvents: boolean }) | null = null

function closeMenu() {
  menuOpen.value = false
}

function pick(id: string) {
  current.value = id
  closeMenu()
}

function updateCurrent() {
  const line = 96
  let active = 'home'
  for (const item of links) {
    const section = document.getElementById(item.id)
    if (!section) continue
    if (section.getBoundingClientRect().top - line <= 16) active = item.id
  }
  current.value = active
}

function onScroll() {
  updateCurrent()
}

onMounted(() => {
  content = document.querySelector('ion-content.landing-content')
  if (content) {
    content.scrollEvents = true
    content.addEventListener('ionScroll', onScroll)
  }
  updateCurrent()
})

onUnmounted(() => {
  content?.removeEventListener('ionScroll', onScroll)
})
</script>

<style scoped>
.site-header {
  box-shadow: 0 10px 30px rgb(18 90 96 / 5%);
}

ion-toolbar {
  --background: #ffffff;
  --border-width: 0;
  --min-height: 78px;
  --padding-start: 0;
  --padding-end: 0;
}

html.ion-palette-dark ion-toolbar {
  --background: #102226;
}

.header-inner {
  width: 100%;
  min-height: 78px;
  padding-inline: max(20px, env(safe-area-inset-left)) max(20px, env(safe-area-inset-right));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-shrink: 0;
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
  display: block;
  border-radius: 12px;
  object-fit: cover;
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

.brand-rule {
  width: 1px;
  height: 34px;
  flex: none;
  background: #d7e6e3;
}

.navigation {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 29px);
}

.navigation > a {
  color: #1d3d46;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: color 160ms ease;
}

.navigation > a.nav-current {
  color: #fff;
  background: #14a094;
  padding: 8px 16px;
  border-radius: 999px;
}

.navigation > a:hover,
.navigation > a:focus-visible {
  color: var(--clinic-blue);
}

.navigation > a.nav-current:hover,
.navigation > a.nav-current:focus-visible {
  color: #fff;
}

.navigation-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-cta {
  --background: #0e7c74;
  --background-hover: #0c6a63;
  --background-activated: #0c6a63;
  --color: #fff;
  --border-radius: 999px;
  --box-shadow: none;
  height: 44px;
  font-size: 14px;
  font-weight: 700;
}

html.ion-palette-dark .brand-rule {
  background: #2c4548;
}

html.ion-palette-dark .navigation > a {
  color: #d7e7e6;
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
    width: 100%;
    min-height: 72px;
    padding-inline: 16px;
    flex-wrap: wrap;
    gap: 0;
  }

  .brand-rule {
    display: none;
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
