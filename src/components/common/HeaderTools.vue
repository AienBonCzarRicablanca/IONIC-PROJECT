<template>
  <ThemeToggle header />
  <NotificationButton />
</template>

<script setup lang="ts">
import NotificationButton from './NotificationButton.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{ notifications?: boolean }>()
</script>
