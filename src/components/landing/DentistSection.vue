<template>
  <section id="dentists" class="dentist-section">
    <div class="section-heading">
      <span class="section-kicker">MEET YOUR SMILE PEOPLE</span>
      <h2>Good humans.<br /><em>Great dentists.</em></h2>
      <p>Kind, experienced professionals who take the time to get to know you.</p>
    </div>
    <div v-if="loading" class="dentist-list" aria-hidden="true">
      <article v-for="slot in 4" :key="slot" class="dentist-card">
        <div class="dentist-photo" />
        <div class="dentist-details">
          <span class="load-line" />
          <span class="load-line load-line-short" />
        </div>
      </article>
    </div>
    <p v-else-if="!dentists.length" class="dentist-empty">Dentist profiles will appear here when their accounts are active.</p>
    <div v-else class="dentist-list">
      <article v-for="(dentist, index) in dentists" :key="dentist.id" class="dentist-card">
        <div class="dentist-photo" :class="tone(index)">
          <img v-if="dentist.photoUrl" :src="dentist.photoUrl" :alt="`Portrait of ${dentist.fullName}`" />
          <span v-else class="dentist-initials" aria-hidden="true">{{ initials(dentist.fullName) }}</span>
        </div>
        <div class="dentist-details">
          <span class="dentist-specialty">{{ specialty(dentist.specialization) }}</span>
          <h3>{{ dentist.fullName }}</h3>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAvatarUrl } from '../../services/profile.service'
import { listPublicDentists, type PublicDentist } from '../../services/portal.service'

type DentistCard = PublicDentist & { photoUrl: string | null }

const tones = ['', 'photo-peach', 'photo-lilac', 'photo-mint']
const dentists = ref<DentistCard[]>([])
const loading = ref(true)

function tone(index: number) {
  return tones[index % tones.length]
}

function specialty(value: string | null) {
  return (value?.trim() || 'Dentist').toUpperCase()
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  )
}

onMounted(async () => {
  try {
    const rows = await listPublicDentists()
    dentists.value = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        photoUrl: row.avatarPath ? await getAvatarUrl(row.avatarPath).catch(() => null) : null,
      })),
    )
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dentist-section {
  padding: 93px 0 77px;
  background: #fff;
}

.section-heading {
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto 37px;
  text-align: center;
}

.section-kicker {
  color: var(--clinic-blue);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.25px;
}

h2 {
  margin: 14px 0 12px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: clamp(39px, 4.2vw, 53px);
  font-weight: 500;
  letter-spacing: -2.2px;
  line-height: 1.04;
}

h2 em {
  color: var(--clinic-blue);
  font-weight: 500;
}

.section-heading p {
  max-width: 420px;
  margin: 0 auto;
  color: #788b91;
  font-size: 12px;
  line-height: 1.7;
}

.dentist-list {
  width: min(1160px, calc(100% - 38px));
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.dentist-card {
  flex: 1 1 220px;
  width: min(260px, 100%);
  max-width: 260px;
  overflow: hidden;
  background: #fafcfc;
  border: 1px solid #edf2f2;
  border-radius: 16px;
}

.dentist-photo {
  position: relative;
  height: 244px;
  background: #e1f0ee;
}

.dentist-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dentist-initials {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #1c5966;
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 600;
}

.photo-peach {
  background: #f3e9df;
}

.photo-peach .dentist-initials {
  color: #7d6756;
}

.photo-lilac {
  background: #eee9f3;
}

.photo-lilac .dentist-initials {
  color: #705b78;
}

.photo-mint {
  background: #e3f0e7;
}

.photo-mint .dentist-initials {
  color: #3f6c62;
}

.dentist-details {
  padding: 17px 16px 18px;
}

.dentist-specialty {
  color: #4c98a1;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1px;
}

.dentist-details h3 {
  margin: 6px 0 7px;
  color: var(--clinic-ink);
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
}

.load-line {
  display: block;
  height: 12px;
  margin-top: 8px;
  border-radius: 999px;
  background: var(--skeleton);
}

.load-line-short {
  width: 55%;
}

.dentist-empty {
  margin: 8px 8px 0;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

@media (max-width: 600px) {
  .dentist-section {
    padding: 68px 0 57px;
  }

  .dentist-list {
    width: calc(100% - 27px);
    gap: 12px;
  }

  .dentist-photo {
    height: 190px;
  }

  .dentist-details {
    padding: 14px 12px;
  }

  .dentist-details h3 {
    font-size: 17px;
  }
}
</style>
