<template>
  <ion-avatar class="user-avatar" :class="{ 'user-avatar-sm': size === 'sm' }" aria-hidden="true">
    <img v-if="url" :src="url" alt="" />
    <span v-else>{{ initials }}</span>
  </ion-avatar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonAvatar } from '@ionic/vue'
import { getAvatarUrl } from '../../services/profile.service'

const props = withDefaults(
  defineProps<{
    name: string
    path?: string | null
    size?: 'md' | 'sm'
  }>(),
  { path: null, size: 'md' },
)

const url = ref<string | null>(null)
const initials = computed(
  () =>
    props.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?',
)

watch(
  () => props.path,
  async (path) => {
    url.value = null
    if (!path) return
    try {
      url.value = await getAvatarUrl(path)
    } catch {
      url.value = null
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.user-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #fff;
  background: var(--clinic-blue);
  font-size: 12px;
  font-weight: 700;
}

.user-avatar-sm {
  width: 22px;
  height: 22px;
  font-size: 9px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
