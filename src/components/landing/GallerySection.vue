<template>
  <section class="gallery-section" aria-labelledby="gallery-heading">
    <div class="gallery-heading">
      <div>
        <span class="section-kicker">A PEEK INSIDE</span>
        <h2 id="gallery-heading">A space to feel <em>at ease.</em></h2>
      </div>
      <p>Bright, calm, and thoughtfully made for your comfort.</p>
    </div>
    <div class="gallery-grid">
      <figure v-for="photo in photos" :key="photo.file" :class="photo.size">
        <!-- Add clinic gallery images to public/assets/images/gallery/ using these filenames. -->
        <ImagePlaceholder
          :src="`/assets/images/gallery/${photo.file}`"
          :alt="photo.alt"
          :label="`Add ${photo.file}`"
        />
        <figcaption>{{ photo.caption }}</figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import ImagePlaceholder from './ImagePlaceholder.vue'

const photos = [
  {
    file: 'reception.jpg',
    alt: 'Clinic reception and waiting area',
    caption: 'A warm hello, right from the start',
    size: 'gallery-large',
  },
  {
    file: 'treatment-room.jpg',
    alt: 'Bright dental treatment room',
    caption: 'A calm place for your care',
    size: 'gallery-small',
  },
  {
    file: 'clinic-details.jpg',
    alt: 'Thoughtful details around the clinic',
    caption: 'Little details, considered',
    size: 'gallery-small',
  },
]
</script>

<style scoped>
.gallery-section {
  padding: 82px 0 90px;
  background: #fff;
}

.gallery-heading {
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto 27px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

h2 {
  margin: 10px 0 0;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(34px, 4vw, 48px);
  font-weight: 500;
  letter-spacing: -1.9px;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.gallery-heading > p {
  max-width: 280px;
  margin: 0 0 6px;
  color: #778b91;
  font-size: 11px;
  line-height: 1.7;
}

.gallery-grid {
  width: min(1080px, calc(100% - 48px));
  height: 325px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 14px;
}

figure {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: #e7f2f0;
  border-radius: 15px;
}

figure :deep(.image-frame),
figure :deep(.image-fallback) {
  border-radius: inherit;
}

figcaption {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  padding: 10px 12px;
  color: var(--clinic-ink);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  border-radius: 9px;
  font-size: 9px;
  font-weight: 700;
}

@media (max-width: 650px) {
  .gallery-section {
    padding: 64px 0;
  }

  .gallery-heading {
    width: calc(100% - 42px);
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }

  .gallery-grid {
    width: calc(100% - 42px);
    height: 420px;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1.2fr 1fr;
    gap: 10px;
  }

  .gallery-large {
    grid-column: span 2;
  }

  figcaption {
    right: 7px;
    bottom: 7px;
    left: 7px;
    padding: 8px 9px;
    font-size: 8px;
  }
}
</style>
