import { ref, watch } from 'vue'
import { useAuth } from './useAuth'
import { getMyPatient, type MyPatient } from '../services/portal.service'

// Loads the signed-in patient's record and runs `onReady` once it is known.
export function useMyPatient(onReady: (patient: MyPatient) => Promise<void>) {
  const { session } = useAuth()
  const patient = ref<MyPatient | null>(null)
  const loading = ref(false)
  const loadError = ref('')

  async function load() {
    const userId = session.value?.user.id
    if (!userId) return
    loading.value = true
    loadError.value = ''
    try {
      patient.value = await getMyPatient(userId)
      if (!patient.value) {
        throw new Error('No patient record is linked to this account. Please contact the clinic.')
      }
      await onReady(patient.value)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load your data.'
    } finally {
      loading.value = false
    }
  }

  watch(() => session.value?.user.id, () => void load(), { immediate: true })
  return { patient, loading, loadError, reload: load }
}
