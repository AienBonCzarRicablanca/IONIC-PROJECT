<template>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-brand">
        <a href="#home" class="brand">
          <img class="brand-mark" :src="'/logo.png'" alt="" />
          <span class="brand-copy"><strong>harbor<span> dental</span></strong><small>CARE THAT FEELS DIFFERENT</small></span>
        </a>
        <p>A little more comfort, a lot more care. We’re happy you’re here.</p>
      </div>
      <div class="footer-links">
        <strong>Explore</strong>
        <a href="#services">Dental services</a>
        <a href="#about">Our story</a>
        <a href="#organization">Our team</a>
        <a href="#dentists">Meet the team</a>
      </div>
      <div class="footer-links">
        <strong>Say hello</strong>
        <a href="#contact">Contact us</a>
        <a href="#contact">Book a visit</a>
        <a href="mailto:hello@harbordental.example">Email the clinic</a>
      </div>
      <div class="footer-social">
        <strong>Stay in touch</strong>
        <p>Follow along for smiles, tips, and little reminders to take care.</p>
        <div>
          <a href="#contact" aria-label="Facebook placeholder"><ion-icon :icon="logoFacebook" /></a>
          <a href="#contact" aria-label="Instagram placeholder"><ion-icon :icon="logoInstagram" /></a>
          <a href="#contact" aria-label="LinkedIn placeholder"><ion-icon :icon="logoLinkedin" /></a>
        </div>
        <small>Social links are placeholders</small>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© {{ new Date().getFullYear() }} Harbor Dental. All rights reserved.</span>
      <span>Clinic details shown are placeholders for development.</span>
      <a href="#home">Back to top ↑</a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { logoFacebook, logoInstagram, logoLinkedin } from 'ionicons/icons'
</script>

<style scoped>
.site-footer {
  color: #dce9e8;
  background: #193d49;
}

.footer-main {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
  padding: 44px 0 35px;
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 0.9fr 1.1fr;
  gap: 45px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: white;
  text-decoration: none;
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: block;
  border-radius: 12px;
  object-fit: cover;
}

.brand-copy {
  display: grid;
  gap: 3px;
}

.brand-copy strong {
  font-size: 17px;
  letter-spacing: -0.5px;
}

.brand-copy strong span {
  color: #78d0bf;
}

.brand-copy small {
  color: #a6c0bf;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1px;
}

.footer-brand p,
.footer-social p {
  max-width: 235px;
  margin: 14px 0 0;
  color: #a9c0c1;
  font-size: 10px;
  line-height: 1.7;
}

.footer-links,
.footer-social {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 11px;
}

.footer-links > strong,
.footer-social > strong {
  margin-bottom: 4px;
  color: #fff;
  font-size: 10px;
}

.footer-links a {
  color: #b2c7c7;
  font-size: 9px;
  text-decoration: none;
}

.footer-links a:hover,
.footer-bottom a:hover {
  color: #fff;
}

.footer-social p {
  margin: -2px 0 0;
}

.footer-social > div {
  display: flex;
  gap: 8px;
}

.footer-social > div a {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #dce9e8;
  background: rgb(255 255 255 / 9%);
  border-radius: 9px;
  font-size: 14px;
}

.footer-social > small {
  color: #93acad;
  font-size: 8px;
}

.footer-bottom {
  min-height: 49px;
  padding: 10px max(24px, calc((100% - 1160px) / 2));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  color: #a3b9b9;
  border-top: 1px solid rgb(255 255 255 / 11%);
  font-size: 8px;
}

.footer-bottom a {
  color: #c5d8d7;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .footer-main {
    width: calc(100% - 42px);
    grid-template-columns: repeat(2, 1fr);
    gap: 29px 22px;
  }

  .footer-brand {
    grid-column: span 2;
  }

  .footer-bottom {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 21px;
    gap: 8px;
  }
}
</style>
