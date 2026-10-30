import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { createAnimation, IonicVue, type AnimationBuilder } from '@ionic/vue';
import { initTheme } from './composables/useTheme';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import '@ionic/vue/css/palettes/dark.class.css';

import './theme/variables.css';
import './theme/landing.css';
import './theme/components.css';
import './theme/dark.css';

initTheme();

const pageTransition: AnimationBuilder = (_baseEl, opts) => {
  const enteringEl = opts?.enteringEl as HTMLElement | undefined;
  const animation = createAnimation();
  if (!enteringEl) return animation;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forward = opts?.direction !== 'back';
  return animation
    .addElement(enteringEl)
    .duration(reduced ? 0 : 260)
    .easing('cubic-bezier(0.22, 1, 0.36, 1)')
    .beforeClearStyles(['opacity', 'transform'])
    .fromTo('opacity', '0', '1')
    .fromTo('transform', `translateY(${forward ? '8px' : '-8px'})`, 'translateY(0)');
};

const app = createApp(App)
  .use(IonicVue, { animated: true, navAnimation: pageTransition, backButtonText: '' })
  .use(router);

router.isReady().then(() => {
  app.mount('#app');
});
