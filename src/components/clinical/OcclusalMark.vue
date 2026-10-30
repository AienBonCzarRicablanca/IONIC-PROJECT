<template>
  <svg class="occ" viewBox="0 0 36 36" aria-hidden="true">
    <circle class="ring" cx="18" cy="18" r="13.5" />
    <path class="cross" d="M18 4.5V12.2M18 23.8V31.5M4.5 18H12.2M23.8 18H31.5" />
    <circle class="pit" cx="18" cy="18" r="5.2" />
  </svg>
</template>

<style scoped>
.occ {
  display: block;
  width: calc(var(--tooth-width, 34px) * 0.72);
  height: calc(var(--tooth-width, 34px) * 0.72);
  margin: 1px 0;
}

.ring,
.cross,
.pit {
  fill: none;
  stroke: var(--tooth-stroke, #5f7d8c);
  stroke-width: 1.4;
  stroke-linecap: round;
}

.pit {
  fill: var(--crown-fill, #fffdf8);
}

:global(.cond-missing) .ring,
:global(.cond-missing) .cross,
:global(.cond-missing) .pit {
  stroke-dasharray: 2.5 2;
}
</style>
