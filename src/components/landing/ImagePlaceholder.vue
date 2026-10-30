<template>
  <div class="image-frame" :class="{ 'image-loaded': src && !failed }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      @error="failed = true"
    />
    <div v-else class="image-fallback" role="img" :aria-label="`${alt} image placeholder`">
      <span class="fallback-art" aria-hidden="true">
        <span class="art-sun" />
        <span class="art-hill art-hill-back" />
        <span class="art-hill art-hill-front" />
        <span class="art-spark art-spark-one">✦</span>
        <span class="art-spark art-spark-two">✧</span>
        <ion-icon :icon="imageOutline" />
      </span>
      <span class="fallback-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import { imageOutline } from 'ionicons/icons'

const props = defineProps<{
  src?: string
  alt: string
  label: string
}>()

const failed = ref(false)

watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<style scoped>
.image-frame,
.image-fallback {
  width: 100%;
  height: 100%;
  min-height: 150px;
  overflow: hidden;
  border-radius: inherit;
}

img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-fallback {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #65828a;
  background: linear-gradient(145deg, #edf8f7 0%, #e2f0f1 52%, #d6e9ec 100%);
}

.fallback-art {
  position: relative;
  width: 78%;
  height: 69%;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.fallback-art > ion-icon {
  z-index: 2;
  color: rgb(44 126 139 / 75%);
  font-size: clamp(26px, 4vw, 44px);
}

.art-sun {
  position: absolute;
  top: 12%;
  right: 18%;
  width: 28px;
  height: 28px;
  background: #fff;
  border-radius: 50%;
  opacity: 0.65;
}

.art-hill {
  position: absolute;
  bottom: -45%;
  width: 110%;
  height: 100%;
  border-radius: 50% 50% 0 0;
}

.art-hill-back {
  left: -26%;
  background: #b5d9d7;
  transform: rotate(-12deg);
}

.art-hill-front {
  right: -30%;
  background: #c8e3df;
  transform: rotate(12deg);
}

.art-spark {
  position: absolute;
  color: #f9ffff;
  font-size: 18px;
}

.art-spark-one {
  top: 18%;
  left: 20%;
}

.art-spark-two {
  top: 38%;
  right: 12%;
  font-size: 13px;
}

.fallback-label {
  position: absolute;
  right: 10px;
  bottom: 8px;
  left: 10px;
  color: #607982;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-align: center;
}
</style>
