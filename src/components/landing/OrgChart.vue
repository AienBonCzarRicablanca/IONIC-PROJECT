<template>
  <teleport to="body" :disabled="!expanded">
  <div class="org-chart" :class="{ 'org-chart-full': expanded }">
    <div v-if="loading" class="org-status">Loading the clinic team...</div>
    <p v-else-if="!members.length" class="org-status">
      {{ editable && saved ? 'Add the first person to start the chart.' : 'The clinic team chart has not been published yet.' }}
    </p>
    <div v-else class="org-layout" :class="{ 'org-layout-edit': editable && saved }">
      <div class="org-scroll">
        <button
          type="button"
          class="org-fit"
          :aria-label="expanded ? 'Close full screen' : 'Full screen'"
          @click="expanded = !expanded"
        >
          <svg v-if="!expanded" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div
          ref="board"
          class="org-board"
          :style="{ height: `${boardHeight}px` }"
        >
          <svg class="org-lines" :viewBox="`0 0 ${boardSize.width} ${boardSize.height}`" aria-hidden="true">
            <path v-for="member in linked" :key="member.id" :d="connector(member)" />
          </svg>
          <article
            v-for="member in members"
            :key="member.id"
            class="org-node"
            :class="{
              'org-node-selected': member.id === selectedId || member.id === detailId,
              'org-node-open': member.id === detailId && !(editable && saved),
              'org-node-movable': editable && saved,
            }"
            :style="{ left: `${member.posX}%`, top: `${member.posY}%` }"
            @pointerdown="startDrag($event, member)"
            @pointermove="dragMove"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @mouseenter="onEnter(member.id)"
            @mouseleave="onLeave(member.id)"
            @click="onPick(member)"
          >
            <div class="org-orb">
              <img v-if="member.photoUrl" :src="member.photoUrl" :alt="`Portrait of ${member.fullName}`" />
              <span v-else aria-hidden="true">{{ initials(member.fullName) }}</span>
            </div>
            <strong>{{ member.fullName }}</strong>
            <em>{{ member.roleTitle || 'Team member' }}</em>
            <div
              v-if="member.id === detailId && !(editable && saved)"
              class="org-pop"
              :class="{ 'org-pop-left': member.posX > 58 }"
              @click.stop
            >
              <div class="org-pop-photo">
                <img v-if="member.photoUrl" :src="member.photoUrl" :alt="`Portrait of ${member.fullName}`" />
                <span v-else aria-hidden="true">{{ initials(member.fullName) }}</span>
              </div>
              <div class="org-pop-copy">
                <p class="org-kicker">{{ member.roleTitle || 'Team member' }}</p>
                <h3>{{ member.fullName }}</h3>
                <p>{{ member.bio || 'A member of the Harbor Dental team.' }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <aside v-if="editable && saved && selected" class="org-card">
        <p class="org-kicker">Selected person</p>
        <template v-if="editable && saved">
          <label>
            Name
            <input v-model="draftName" maxlength="80" />
          </label>
          <label>
            Role
            <input v-model="draftRole" maxlength="80" />
          </label>
          <label>
            Short description
            <textarea v-model="draftBio" maxlength="280" rows="3" />
          </label>
          <label>
            Reports to
            <select v-model="draftParent">
              <option value="">Top of the chart</option>
              <option v-for="option in parentOptions" :key="option.id" :value="option.id">
                {{ option.fullName }}
              </option>
            </select>
          </label>
          <label class="org-photo">
            Picture
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPhoto" />
          </label>
          <p v-if="formError" class="org-error" role="alert">{{ formError }}</p>
          <div class="org-actions">
            <button type="button" :disabled="busy" @click="saveDetails">Save details</button>
            <button type="button" :disabled="busy" @click="addBranch('left')">Add left</button>
            <button type="button" :disabled="busy" @click="addBranch('right')">Add right</button>
            <button type="button" :disabled="busy" @click="addBranch('below')">Add below</button>
            <button type="button" class="org-danger" :disabled="busy" @click="confirmingDelete = true">Remove</button>
          </div>
          <p v-if="confirmingDelete" class="org-confirm">
            Remove {{ selected.fullName }} and everyone who reports to them?
            <button type="button" class="org-danger" :disabled="busy" @click="removeSelected">Remove branch</button>
            <button type="button" :disabled="busy" @click="confirmingDelete = false">Cancel</button>
          </p>
        </template>
      </aside>
    </div>

    <div v-if="editable && saved && !members.length" class="org-actions org-actions-empty">
      <button type="button" :disabled="busy" @click="addFirst">Add the first person</button>
    </div>
    <p v-if="editable && saved && members.length" class="org-hint">
      Drag a portrait to move it. Add a branch to the left, the right, or below the selected person. The line shows who they report to.
    </p>
    <p v-if="editable && !loading && !saved" class="org-error" role="status">
      The chart can be edited after the organization SQL is applied in Supabase. Until then, this is the starter layout.
    </p>
    <p v-if="pageError" class="org-error" role="alert">{{ pageError }}</p>
  </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  createOrgMember,
  deleteOrgMember,
  listOrgChart,
  moveOrgMember,
  removeOrgPhoto,
  updateOrgMember,
  uploadOrgPhoto,
  type OrgAnchor,
  type OrgMember,
} from '../../services/orgChart.service'

const props = defineProps<{ editable?: boolean; clinicId?: string | null }>()

const members = ref<OrgMember[]>([])
const saved = ref(false)
const loading = ref(true)
const busy = ref(false)
const selectedId = ref<string | null>(null)
const hoverId = ref<string | null>(null)
const pinnedId = ref<string | null>(null)
const confirmingDelete = ref(false)
const formError = ref('')
const pageError = ref('')
const draftName = ref('')
const draftRole = ref('')
const draftBio = ref('')
const draftParent = ref('')
const board = ref<HTMLElement | null>(null)
const expanded = ref(false)
const boardSize = reactive({ width: 1000, height: 820 })
const boardHeight = 820

type Drag = {
  id: string
  pointer: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}
let drag: Drag | null = null

const selected = computed(() => members.value.find((member) => member.id === selectedId.value) ?? null)
const detailId = computed(() => hoverId.value || pinnedId.value)
const linked = computed(() => members.value.filter((member) => member.parentId))
const parentOptions = computed(() =>
  members.value.filter((member) => member.id !== selectedId.value && !isUnder(member.id, selectedId.value)),
)

watch(selected, (member) => {
  confirmingDelete.value = false
  formError.value = ''
  draftName.value = member?.fullName ?? ''
  draftRole.value = member?.roleTitle ?? ''
  draftBio.value = member?.bio ?? ''
  draftParent.value = member?.parentId ?? ''
})

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') expanded.value = false
}

onMounted(() => {
  void load()
  window.addEventListener('resize', measure)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('resize', measure)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

watch(expanded, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) nextTick(measure)
})

async function load() {
  loading.value = true
  pageError.value = ''
  try {
    const result = await listOrgChart()
    members.value = result.members
    saved.value = result.saved
    if (props.editable && !selectedId.value && result.members[0]) selectedId.value = result.members[0].id
  } finally {
    loading.value = false
    await nextTick()
    measure()
  }
}

function measure() {
  const rect = board.value?.getBoundingClientRect()
  if (!rect) return
  boardSize.width = Math.max(1, rect.width)
  boardSize.height = Math.max(1, rect.height)
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => !/^(dr|dra|mr|mrs|ms)\.?$/i.test(part))
  const chosen = (parts.length ? parts : name.trim().split(/\s+/)).slice(0, 2)
  return chosen.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

function isUnder(personId: string, ancestorId: string | null): boolean {
  if (!ancestorId) return false
  const byId = new Map(members.value.map((member) => [member.id, member]))
  let current = byId.get(personId)
  const seen = new Set<string>()
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true
    if (seen.has(current.id)) return false
    seen.add(current.id)
    current = byId.get(current.parentId)
  }
  return false
}

function connector(member: OrgMember) {
  const parent = members.value.find((item) => item.id === member.parentId)
  if (!parent) return ''
  const from = point(parent)
  const to = point(member)
  const mid = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} V ${mid} H ${to.x} V ${to.y}`
}

function point(member: OrgMember) {
  return {
    x: (member.posX / 100) * boardSize.width,
    y: (member.posY / 100) * boardSize.height,
  }
}

function clamp(value: number, min = 10, max = 90) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10))
}

function onEnter(id: string) {
  if (props.editable && saved.value) return
  hoverId.value = id
}

function onLeave(id: string) {
  if (hoverId.value === id) hoverId.value = null
}

function onPick(member: OrgMember) {
  if (props.editable && saved.value) {
    selectedId.value = member.id
    return
  }
  pinnedId.value = pinnedId.value === member.id ? null : member.id
}

function startDrag(event: PointerEvent, member: OrgMember) {
  if (!props.editable || !saved.value) return
  selectedId.value = member.id
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)
  drag = {
    id: member.id,
    pointer: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: member.posX,
    originY: member.posY,
    moved: false,
  }
}

function dragMove(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId || !board.value) return
  const rect = board.value.getBoundingClientRect()
  const dx = ((event.clientX - drag.startX) / rect.width) * 100
  const dy = ((event.clientY - drag.startY) / rect.height) * 100
  if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6) drag.moved = true
  const member = members.value.find((item) => item.id === drag?.id)
  if (!member) return
  member.posX = clamp(drag.originX + dx)
  member.posY = clamp(drag.originY + dy, 8, 88)
  measure()
}

async function endDrag(event: PointerEvent) {
  if (!drag || drag.pointer !== event.pointerId) return
  const finished = drag
  drag = null
  if (!finished.moved) return
  const member = members.value.find((item) => item.id === finished.id)
  if (!member) return
  try {
    await moveOrgMember(member.id, member.posX, member.posY)
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Could not move this person.'
    await load()
  }
}

async function saveDetails() {
  if (!selected.value) return
  const name = draftName.value.trim()
  if (!name) {
    formError.value = 'Enter a name.'
    return
  }
  busy.value = true
  formError.value = ''
  try {
    const updated = await updateOrgMember(selected.value.id, {
      fullName: name,
      roleTitle: draftRole.value.trim(),
      bio: draftBio.value.trim(),
      parentId: draftParent.value || null,
    })
    replace(updated)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not save this person.'
  } finally {
    busy.value = false
  }
}

async function onPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !selected.value || !props.clinicId) return
  busy.value = true
  formError.value = ''
  const previous = selected.value.photoPath
  try {
    const path = await uploadOrgPhoto(props.clinicId, file)
    const updated = await updateOrgMember(selected.value.id, {
      fullName: selected.value.fullName,
      roleTitle: selected.value.roleTitle,
      bio: selected.value.bio,
      parentId: selected.value.parentId,
      photoPath: path,
    })
    replace(updated)
    if (previous) await removeOrgPhoto(previous).catch(() => undefined)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not upload the photo.'
  } finally {
    busy.value = false
  }
}

async function addFirst() {
  if (!props.clinicId) return
  busy.value = true
  pageError.value = ''
  try {
    const created = await createOrgMember(props.clinicId, {
      parentId: null,
      fullName: 'New team member',
      roleTitle: 'Role',
      bio: '',
      posX: 50,
      posY: 14,
      anchor: null,
    })
    members.value = [created]
    selectedId.value = created.id
    measure()
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Could not add a person.'
  } finally {
    busy.value = false
  }
}

async function addBranch(anchor: OrgAnchor) {
  if (!props.clinicId || !selected.value) return
  busy.value = true
  formError.value = ''
  const origin = selected.value
  const dx = anchor === 'left' ? -18 : anchor === 'right' ? 18 : 0
  let posX = clamp(origin.posX + dx)
  const posY = clamp(origin.posY + 24, 8, 88)
  while (members.value.some((member) => Math.abs(member.posX - posX) < 8 && Math.abs(member.posY - posY) < 8)) {
    posX = clamp(posX + (anchor === 'left' ? -8 : 8))
  }
  try {
    const created = await createOrgMember(props.clinicId, {
      parentId: origin.id,
      fullName: 'New team member',
      roleTitle: 'Role',
      bio: '',
      posX,
      posY,
      anchor,
    })
    members.value = [...members.value, created]
    selectedId.value = created.id
    measure()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not add a branch.'
  } finally {
    busy.value = false
  }
}

async function removeSelected() {
  if (!selected.value) return
  busy.value = true
  formError.value = ''
  const removing = selected.value.id
  try {
    await deleteOrgMember(removing)
    const drop = new Set<string>()
    const walk = (id: string) => {
      drop.add(id)
      members.value.filter((member) => member.parentId === id).forEach((child) => walk(child.id))
    }
    walk(removing)
    members.value = members.value.filter((member) => !drop.has(member.id))
    selectedId.value = members.value[0]?.id ?? null
    confirmingDelete.value = false
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not remove this person.'
  } finally {
    busy.value = false
  }
}

function replace(updated: OrgMember) {
  members.value = members.value.map((member) => (member.id === updated.id ? updated : member))
}
</script>

<style scoped>
.org-chart {
  display: grid;
  gap: 14px;
}

.org-chart-full {
  position: fixed;
  z-index: 1000;
  inset: 0;
  gap: 0;
  padding: 0;
  background: var(--canvas);
  overflow: hidden;
}

.org-chart-full .org-scroll {
  min-height: 100dvh;
  border: 0;
  border-radius: 0;
}

.org-fit {
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  color: #f4fbf9;
  background: rgb(6 16 26 / 72%);
  cursor: pointer;
}

.org-chart-full .org-fit {
  top: calc(12px + env(safe-area-inset-top));
  right: calc(12px + env(safe-area-inset-right));
}

.org-fit svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.org-status,
.org-hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.org-layout {
  display: grid;
  gap: 16px;
}

.org-layout-edit {
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
}

.org-scroll {
  position: relative;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--clinic-blue) 28%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
    var(--surface);
}

.org-board {
  position: relative;
  min-width: 760px;
}

.org-board::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url("/assets/images/gallery/clinic-details.jpg") center / cover no-repeat;
  opacity: 0.08;
  pointer-events: none;
}

.org-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.org-lines path {
  fill: none;
  stroke: var(--clinic-blue);
  stroke-width: 2;
  stroke-linejoin: round;
  opacity: 0.7;
}

.org-node {
  position: absolute;
  width: 148px;
  display: grid;
  justify-items: center;
  gap: 4px;
  transform: translate(-50%, -42px);
  text-align: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
}

.org-node-movable {
  cursor: grab;
}

.org-node strong,
.org-node em {
  max-width: 148px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-node strong {
  color: var(--clinic-ink);
  font-size: 13px;
}

.org-node em {
  color: var(--muted);
  font-size: 11px;
  font-style: normal;
}

.org-orb {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: white;
  background: var(--clinic-blue);
  border: 4px solid var(--surface);
  border-radius: 50%;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--clinic-blue) 45%, var(--line));
  font-size: 22px;
  font-weight: 700;
}

.org-node-selected .org-orb {
  box-shadow: 0 0 0 3px var(--clinic-blue);
}

.org-node-open {
  z-index: 6;
}

.org-node-open .org-orb,
.org-node-open strong,
.org-node-open em {
  visibility: hidden;
}

.org-pop {
  position: absolute;
  z-index: 5;
  top: -28px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  max-width: 360px;
  padding: 8px 16px 8px 8px;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px 18px 18px 999px;
  box-shadow: 0 16px 36px rgb(23 72 80 / 18%);
  cursor: default;
  transform-origin: 72px center;
  animation: org-grow 160ms ease;
}

.org-pop-left {
  left: auto;
  right: 6px;
  flex-direction: row-reverse;
  padding: 8px 8px 8px 16px;
  border-radius: 18px 999px 999px 18px;
  transform-origin: calc(100% - 72px) center;
}

.org-pop-photo {
  width: 128px;
  height: 128px;
  display: grid;
  flex: none;
  place-items: center;
  overflow: hidden;
  color: white;
  background: var(--clinic-blue);
  border: 4px solid var(--surface);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--clinic-blue);
  font-size: 32px;
  font-weight: 700;
}

.org-pop-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.org-pop-copy {
  display: grid;
  gap: 3px;
  min-width: 150px;
  max-width: 200px;
}

.org-pop h3 {
  margin: 0;
  color: var(--clinic-ink);
  font-size: 16px;
  line-height: 1.2;
  white-space: normal;
}

.org-pop-copy p:last-child {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
  white-space: normal;
}

@keyframes org-grow {
  from {
    opacity: 0;
    transform: scale(0.72);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.org-orb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.org-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.org-kicker {
  margin: 0;
  color: var(--clinic-blue);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.org-card h3,
.org-role {
  margin: 0;
}

.org-card h3 {
  color: var(--clinic-ink);
  font-size: 18px;
}

.org-role,
.org-card p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.org-card label {
  display: grid;
  gap: 4px;
  color: var(--clinic-ink);
  font-size: 12px;
  font-weight: 700;
}

.org-card input,
.org-card textarea,
.org-card select {
  width: 100%;
  padding: 8px 10px;
  color: var(--clinic-ink);
  background: var(--canvas);
  border: 1px solid var(--line);
  border-radius: 8px;
  font: inherit;
  font-weight: 500;
}

.org-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.org-actions button,
.org-confirm button {
  padding: 8px 10px;
  color: white;
  background: var(--clinic-blue);
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.org-actions button:disabled,
.org-confirm button:disabled {
  opacity: 0.6;
  cursor: default;
}

.org-danger {
  background: #9b3a3a !important;
}

.org-confirm {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.org-error {
  margin: 0;
  color: #9b3a3a;
  font-size: 13px;
}

@media (max-width: 860px) {
  .org-layout-edit {
    grid-template-columns: 1fr;
  }
}
</style>
