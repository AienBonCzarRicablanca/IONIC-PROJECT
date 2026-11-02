<template>
  <ThemeToggle header />
  <NotificationButton v-if="notifications" />
</template>

<script setup lang="ts">
import NotificationButton from './NotificationButton.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{ notifications?: boolean }>()
</script>
