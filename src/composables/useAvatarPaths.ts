import { ref } from 'vue'
import { memberAvatarPaths } from '../services/profile.service'

export function useAvatarPaths() {
  const paths = ref<Record<string, string | null>>({})
  let request = 0

  async function load(ids: Array<string | null | undefined>) {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
    const current = ++request
    const map = await memberAvatarPaths(unique)
    if (current !== request) return
    const next: Record<string, string | null> = {}
    for (const id of unique) next[id] = map.get(id) ?? null
    paths.value = next
  }

  function pathFor(id: string | null | undefined) {
    if (!id) return null
    return paths.value[id] ?? null
  }

  return { load, pathFor }
}
