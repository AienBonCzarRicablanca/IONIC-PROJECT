<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="app-menu" aria-label="Open menu" />
        </ion-buttons>
        <ion-title>Inventory</ion-title>
        <ion-buttons slot="end"><HeaderTools /></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="inv-page">
        <PageAction :icon="addOutline" @click="openNew">Add item</PageAction>
        <ion-card v-if="lowStock.length" color="warning">
          <ion-card-content role="alert">
            <strong>Low stock:</strong> {{ lowStock.map((item) => item.name).join(', ') }}
          </ion-card-content>
        </ion-card>

        <div class="inv-search">
          <ion-searchbar v-model="search" aria-label="Search inventory" placeholder="Search name, category, or supplier" />
          <button
            type="button"
            class="inv-filter"
            :class="{ active: filtersActive }"
            aria-label="Filter inventory"
            @click="openFilters"
          >
            <ion-icon :icon="funnelOutline" aria-hidden="true" />
          </button>
          <ion-popover
            class="inv-filter-popover"
            :is-open="filterOpen"
            :event="filterEvent"
            reference="event"
            side="bottom"
            alignment="end"
            @didDismiss="filterOpen = false"
          >
            <div class="filter-panel">
              <section class="filter-col">
                <p class="filter-label">Category</p>
                <div class="filter-scroll">
                  <button type="button" :class="{ selected: categoryFilter === 'all' }" @click="categoryFilter = 'all'">
                    All categories
                  </button>
                  <button type="button" :class="{ selected: categoryFilter === 'none' }" @click="categoryFilter = 'none'">
                    No category
                  </button>
                  <button
                    v-for="category in filterCategories"
                    :key="category"
                    type="button"
                    :class="{ selected: categoryFilter === category }"
                    @click="categoryFilter = category"
                  >
                    {{ category }}
                  </button>
                </div>
              </section>
              <section class="filter-col filter-stock">
                <p class="filter-label">Stock</p>
                <button type="button" :class="{ selected: stockFilter === 'all' }" @click="stockFilter = 'all'">All stock</button>
                <button type="button" :class="{ selected: stockFilter === 'low' }" @click="stockFilter = 'low'">Low stock</button>
                <button type="button" :class="{ selected: stockFilter === 'ok' }" @click="stockFilter = 'ok'">In stock</button>
              </section>
            </div>
          </ion-popover>
        </div>
        <button v-if="filtersActive" type="button" class="filter-summary" @click="clearFilters">
          {{ filterSummary }}
          <ion-icon :icon="closeOutline" aria-hidden="true" />
        </button>

        <div v-if="loading" class="state-message" role="status">Loading inventory...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">
          {{ loadError }}
        </div>
        <p v-else-if="!visible.length" class="state-message">
          {{ items.length ? 'No items match this search.' : 'No inventory items.' }}
        </p>
        <ion-list v-else lines="full">
          <ion-item v-for="item in visible" :key="item.id" :detail="false">
            <div class="inv-thumb" slot="start" aria-hidden="true">
              <img v-if="imageUrls[item.id]" :src="imageUrls[item.id]" alt="" />
              <ion-icon v-else :icon="cubeOutline" />
            </div>
            <ion-label class="ion-text-wrap">
              <h2>{{ item.name }}</h2>
              <p>
                {{ item.quantity }} {{ item.unit }} · reorder at {{ item.reorder_threshold }}
                <template v-if="item.category"> · {{ item.category }}</template>
                <template v-if="item.supplier"> · {{ item.supplier }}</template>
              </p>
            </ion-label>
            <ion-chip :color="isLowStock(item) ? 'warning' : 'success'">
              {{ isLowStock(item) ? 'Low' : 'OK' }}
            </ion-chip>
            <ion-button slot="end" size="small" fill="clear" @click="openStock(item)">Stock</ion-button>
            <ion-button slot="end" size="small" fill="clear" @click="openHistory(item)">History</ion-button>
            <ion-button slot="end" size="small" fill="clear" @click="openEdit(item)">Edit</ion-button>
          </ion-item>
        </ion-list>
      </div>

      <ion-modal :is-open="itemOpen" @did-dismiss="itemOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editingId ? 'Edit item' : 'Add item' }}</ion-title>
            <ion-buttons slot="end"><ion-button :disabled="saving" @click="itemOpen = false">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="form" @submit.prevent="saveItem">
            <div class="photo-field">
              <div class="photo-preview" aria-hidden="true">
                <img v-if="previewUrl" :src="previewUrl" alt="" />
                <ion-icon v-else :icon="imageOutline" />
              </div>
              <div>
                <p class="hint">JPG, PNG, or WebP · maximum 2 MB</p>
                <input
                  ref="fileInput"
                  class="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  @change="onPhoto"
                />
                <div class="photo-actions">
                  <ion-button type="button" fill="outline" size="small" :disabled="saving" @click="fileInput?.click()">
                    {{ previewUrl ? 'Change photo' : 'Add photo' }}
                  </ion-button>
                  <ion-button v-if="previewUrl" type="button" fill="clear" size="small" color="medium" :disabled="saving" @click="clearPhoto">
                    Remove photo
                  </ion-button>
                </div>
              </div>
            </div>
            <ion-input v-model="form.name" label="Name" label-placement="stacked" fill="outline" required />
            <ion-select
              v-model="categoryChoice"
              label="Category"
              label-placement="stacked"
              fill="outline"
              interface="popover"
            >
              <ion-select-option value="none">No category</ion-select-option>
              <ion-select-option v-for="category in INVENTORY_CATEGORIES" :key="category" :value="category">
                {{ category }}
              </ion-select-option>
              <ion-select-option :value="OTHER_CATEGORY">Other</ion-select-option>
            </ion-select>
            <ion-input
              v-if="categoryChoice === OTHER_CATEGORY"
              v-model="customCategory"
              label="Other category"
              label-placement="stacked"
              fill="outline"
              placeholder="Type the category"
              required
            />
            <ion-input v-model="form.unit" label="Unit (e.g. box, pcs)" label-placement="stacked" fill="outline" required />
            <ion-input v-model="form.supplier" label="Supplier" label-placement="stacked" fill="outline" />
            <ion-input v-model="unitCost" label="Unit cost (PHP)" label-placement="stacked" fill="outline" type="number" min="0" step="0.01" />
            <ion-input v-model="threshold" label="Reorder threshold" label-placement="stacked" fill="outline" type="number" min="0" />
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">Save item</ion-button>
            <ion-button v-if="editingId" type="button" expand="block" fill="outline" color="danger" :disabled="saving" @click="archive">
              Archive item
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="Boolean(stockItem)" @did-dismiss="stockItem = null">
        <ion-header>
          <ion-toolbar>
            <ion-title>Stock: {{ stockItem?.name }}</ion-title>
            <ion-buttons slot="end"><ion-button :disabled="saving" @click="stockItem = null">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <form class="form" @submit.prevent="saveStock">
            <p>Current stock: {{ stockItem?.quantity }} {{ stockItem?.unit }}</p>
            <ion-select v-model="stockAction" label="Action" label-placement="stacked" fill="outline" interface="popover">
              <ion-select-option value="addition">Add stock</ion-select-option>
              <ion-select-option value="consumption">Use / remove stock</ion-select-option>
            </ion-select>
            <ion-input v-model="stockQty" label="Quantity" label-placement="stacked" fill="outline" type="number" min="0.001" step="any" />
            <ion-input v-model="stockNote" label="Note (optional)" label-placement="stacked" fill="outline" />
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">Record</ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-modal :is-open="historyOpen" @did-dismiss="closeHistory">
        <ion-header>
          <ion-toolbar>
            <ion-title>History: {{ historyItem?.name }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="historyOpen = false">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div v-if="historyLoading" class="state-message" role="status">
            Loading transaction history...
          </div>
          <div v-else-if="historyError" class="state-message error-message" role="alert">
            {{ historyError }}
          </div>
          <p v-else-if="!historyEntries.length" class="state-message">
            No stock transactions recorded for this item.
          </p>
          <ion-list v-else lines="full">
            <ion-item v-for="entry in historyEntries" :key="entry.id">
              <ion-label class="ion-text-wrap">
                <h2>{{ entry.transaction_type === 'addition' ? 'Stock added' : 'Stock used' }}</h2>
                <p>{{ formatTransactionDate(entry.created_at) }}</p>
                <p>By {{ entry.profiles?.full_name ?? 'Unknown staff member' }}</p>
                <p v-if="entry.note">{{ entry.note }}</p>
              </ion-label>
              <ion-chip :color="entry.quantity_change > 0 ? 'success' : 'warning'">
                {{ entry.quantity_change > 0 ? '+' : '' }}{{ entry.quantity_change }}
              </ion-chip>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>

      <ion-toast :is-open="toastOpen" :message="toastMessage" :duration="2600" @did-dismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonPopover,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { addOutline, closeOutline, cubeOutline, funnelOutline, imageOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import { INVENTORY_CATEGORIES, OTHER_CATEGORY, isPresetCategory } from '../../content/inventoryCategories'
import { useAuth } from '../../composables/useAuth'
import {
  archiveItem,
  createItem,
  inventoryImageUrl,
  type InventoryItem,
  type InventoryTransaction,
  isLowStock,
  listInventory,
  listItemTransactions,
  recordStockChange,
  removeInventoryImage,
  type StockAction,
  updateItem,
  uploadInventoryImage,
} from '../../services/inventory.service'

const { profile } = useAuth()
const items = ref<InventoryItem[]>([])
const imageUrls = ref<Record<string, string>>({})
const search = ref('')
const categoryFilter = ref('all')
const stockFilter = ref<'all' | 'low' | 'ok'>('all')
const filterOpen = ref(false)
const filterEvent = ref<Event | undefined>()
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const formError = ref('')
const itemOpen = ref(false)
const editingId = ref<string | null>(null)
const stockItem = ref<InventoryItem | null>(null)
const historyItem = ref<InventoryItem | null>(null)
const historyEntries = ref<InventoryTransaction[]>([])
const historyOpen = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
let historyRequest = 0
const stockAction = ref<StockAction>('addition')
const stockQty = ref('')
const stockNote = ref('')
const unitCost = ref('0')
const threshold = ref('0')
const toastOpen = ref(false)
const toastMessage = ref('')
const form = reactive({
  name: '',
  unit: 'pcs',
  supplier: '' as string | null,
})
const categoryChoice = ref('none')
const customCategory = ref('')
const existingImagePath = ref<string | null>(null)
const pendingImage = ref<File | null>(null)
const removeImage = ref(false)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let previewIsBlob = false
let imageRequest = 0

const lowStock = computed(() => items.value.filter(isLowStock))
const filtersActive = computed(() => categoryFilter.value !== 'all' || stockFilter.value !== 'all')
const filterSummary = computed(() => {
  const parts: string[] = []
  if (categoryFilter.value === 'none') parts.push('No category')
  else if (categoryFilter.value !== 'all') parts.push(categoryFilter.value)
  if (stockFilter.value === 'low') parts.push('Low stock')
  if (stockFilter.value === 'ok') parts.push('In stock')
  return parts.join(' · ')
})
const filterCategories = computed(() => {
  const extras = items.value
    .map((item) => item.category)
    .filter((category): category is string => typeof category === 'string' && !isPresetCategory(category))
  return [...INVENTORY_CATEGORIES, ...new Set(extras)]
})
const visible = computed(() => {
  const term = search.value.trim().toLowerCase()
  return items.value.filter((item) => {
    const haystack = [item.name, item.category, item.supplier, item.unit].filter(Boolean).join(' ').toLowerCase()
    const matchesTerm = !term || haystack.includes(term)
    const matchesCategory =
      categoryFilter.value === 'all' ||
      (categoryFilter.value === 'none' ? !item.category : item.category === categoryFilter.value)
    const matchesStock =
      stockFilter.value === 'all' ||
      (stockFilter.value === 'low' ? isLowStock(item) : !isLowStock(item))
    return matchesTerm && matchesCategory && matchesStock
  })
})

function openFilters(event: Event) {
  filterEvent.value = event
  filterOpen.value = true
}

function clearFilters() {
  categoryFilter.value = 'all'
  stockFilter.value = 'all'
}

function showToast(message: string) {
  toastMessage.value = message
  toastOpen.value = true
}

async function load() {
  const clinicId = profile.value?.clinicId
  if (!clinicId) return
  loading.value = true
  loadError.value = ''
  try {
    items.value = await listInventory(clinicId)
    void loadImageUrls(items.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load inventory.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })

onUnmounted(() => {
  if (previewIsBlob && previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function setPreview(url: string | null, blob: boolean) {
  if (previewIsBlob && previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = url
  previewIsBlob = blob
}

function resetPhoto() {
  pendingImage.value = null
  removeImage.value = false
  existingImagePath.value = null
  setPreview(null, false)
  if (fileInput.value) fileInput.value.value = ''
}

function applyCategory(category: string | null) {
  if (category && isPresetCategory(category)) {
    categoryChoice.value = category
    customCategory.value = ''
    return
  }
  if (category) {
    categoryChoice.value = OTHER_CATEGORY
    customCategory.value = category
    return
  }
  categoryChoice.value = 'none'
  customCategory.value = ''
}

function chosenCategory() {
  if (categoryChoice.value === OTHER_CATEGORY) {
    const custom = customCategory.value.trim()
    if (!custom) throw new Error('Type the category name.')
    return custom
  }
  if (!categoryChoice.value || categoryChoice.value === 'none') return null
  return categoryChoice.value.trim()
}

function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const allowed = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  if (!allowed || file.size > 2 * 1024 * 1024) {
    formError.value = 'Choose a JPG, PNG, or WebP image under 2 MB.'
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  formError.value = ''
  pendingImage.value = file
  removeImage.value = false
  setPreview(URL.createObjectURL(file), true)
}

function clearPhoto() {
  pendingImage.value = null
  removeImage.value = true
  setPreview(null, false)
  if (fileInput.value) fileInput.value.value = ''
}

async function loadImageUrls(list: InventoryItem[]) {
  const request = ++imageRequest
  const urls: Record<string, string> = {}
  await Promise.all(
    list.map(async (item) => {
      if (!item.image_path) return
      const url = await inventoryImageUrl(item.image_path)
      if (url) urls[item.id] = url
    }),
  )
  if (request === imageRequest) imageUrls.value = urls
}

function openNew() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, { name: '', unit: 'pcs', supplier: '' })
  applyCategory(null)
  resetPhoto()
  unitCost.value = '0'
  threshold.value = '0'
  itemOpen.value = true
}

async function openEdit(item: InventoryItem) {
  editingId.value = item.id
  formError.value = ''
  Object.assign(form, {
    name: item.name,
    unit: item.unit,
    supplier: item.supplier ?? '',
  })
  applyCategory(item.category)
  unitCost.value = String(item.unit_cost)
  threshold.value = String(item.reorder_threshold)
  pendingImage.value = null
  removeImage.value = false
  existingImagePath.value = item.image_path
  setPreview(item.image_path ? await inventoryImageUrl(item.image_path) : null, false)
  if (fileInput.value) fileInput.value.value = ''
  itemOpen.value = true
}

function openStock(item: InventoryItem) {
  stockItem.value = item
  stockAction.value = 'addition'
  stockQty.value = ''
  stockNote.value = ''
  formError.value = ''
}

async function openHistory(item: InventoryItem) {
  const request = ++historyRequest
  historyItem.value = item
  historyEntries.value = []
  historyError.value = ''
  historyLoading.value = true
  historyOpen.value = true
  const clinicId = profile.value?.clinicId
  if (!clinicId) {
    historyError.value = 'Your active clinic session is unavailable. Sign in again and retry.'
    historyLoading.value = false
    return
  }
  try {
    const entries = await listItemTransactions(clinicId, item.id)
    if (request === historyRequest) historyEntries.value = entries
  } catch (error) {
    if (request === historyRequest) {
      historyError.value = error instanceof Error ? error.message : 'Could not load transaction history.'
    }
  } finally {
    if (request === historyRequest) historyLoading.value = false
  }
}

function closeHistory() {
  historyRequest += 1
  historyOpen.value = false
  historyItem.value = null
}

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleString()
}

async function guarded(action: (clinicId: string) => Promise<void>, success: string, close: () => void) {
  const clinicId = profile.value?.clinicId
  if (!clinicId) {
    formError.value = 'Your active clinic session is unavailable. Sign in again and retry.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await action(clinicId)
    close()
    showToast(success)
    await load()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed.'
    formError.value = /image_path|inventory-images|Bucket not found/i.test(message)
      ? 'Run the inventory image SQL in the Supabase SQL editor, then try again.'
      : message
  } finally {
    saving.value = false
  }
}

const saveItem = () =>
  guarded(
    async (clinicId) => {
      const cost = Number(unitCost.value)
      const reorder = Number(threshold.value)
      if (!form.name.trim() || !form.unit.trim()) throw new Error('Name and unit are required.')
      if (!(cost >= 0) || !(reorder >= 0)) throw new Error('Cost and threshold must be zero or more.')
      const category = chosenCategory()
      let imagePath = removeImage.value ? null : existingImagePath.value
      let uploadedPath: string | null = null
      if (pendingImage.value) {
        uploadedPath = await uploadInventoryImage(clinicId, pendingImage.value)
        imagePath = uploadedPath
      }
      const input = {
        name: form.name.trim(),
        category,
        unit: form.unit.trim(),
        supplier: form.supplier?.trim() || null,
        unit_cost: cost,
        reorder_threshold: reorder,
        image_path: imagePath,
      }
      try {
        if (editingId.value) await updateItem(clinicId, editingId.value, input)
        else await createItem(clinicId, input)
      } catch (error) {
        if (uploadedPath) await removeInventoryImage(uploadedPath).catch(() => undefined)
        throw error
      }
      const previousPath = existingImagePath.value
      if (previousPath && previousPath !== imagePath) {
        await removeInventoryImage(previousPath).catch(() => undefined)
      }
    },
    'Item saved.',
    () => (itemOpen.value = false),
  )

const archive = () =>
  guarded(
    (clinicId) => archiveItem(clinicId, editingId.value as string, existingImagePath.value),
    'Item archived.',
    () => (itemOpen.value = false),
  )

const saveStock = () =>
  guarded(
    async (clinicId) => {
      const actorId = profile.value?.id
      const quantity = Number(stockQty.value)
      if (!actorId || !stockItem.value) throw new Error('Sign in again and retry.')
      if (!(quantity > 0)) throw new Error('Enter a quantity above zero.')
      await recordStockChange(
        clinicId,
        actorId,
        stockItem.value,
        stockAction.value,
        quantity,
        stockNote.value.trim() || null,
      )
    },
    'Stock updated.',
    () => (stockItem.value = null),
  )
</script>

<style scoped>
.inv-page {
  margin: 0 auto;
  max-width: 900px;
  padding: 0.5rem;
}

.form {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.inv-search {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.inv-search ion-searchbar {
  flex: 1;
  min-width: 0;
  padding: 0;
  --background: transparent;
  --box-shadow: none;
}

.inv-filter {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-right: 6px;
  flex: none;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--clinic-blue);
  font-size: 1.15rem;
  cursor: pointer;
}

.inv-filter.active {
  background: var(--accent-soft);
}

.filter-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 8px 2px 0;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--clinic-blue);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
}

.inv-filter-popover {
  --width: min(440px, 94vw);
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(124px, 0.85fr);
  width: min(440px, 94vw);
  max-height: min(380px, 70vh);
  padding: 12px;
}

.filter-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  min-height: 0;
}

.filter-stock {
  padding-left: 10px;
  border-left: 1px solid var(--line);
}

.filter-scroll {
  display: grid;
  gap: 4px;
  min-height: 0;
  overflow: auto;
}

.filter-label {
  margin: 0 4px 4px;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-panel button {
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--clinic-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.filter-panel button.selected {
  background: var(--accent-soft);
  color: var(--clinic-blue);
  font-weight: 700;
}

.inv-thumb,
.photo-preview {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--accent-soft);
  color: var(--clinic-blue);
}

.inv-thumb {
  width: 52px;
  height: 52px;
  margin-inline-end: 12px;
  border-radius: 12px;
  font-size: 1.3rem;
}

.inv-thumb img,
.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-field {
  display: flex;
  gap: 12px;
  align-items: center;
}

.photo-preview {
  width: 84px;
  height: 84px;
  flex: none;
  border-radius: 16px;
  font-size: 1.8rem;
}

.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.hint {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 0.84rem;
}

.file-input {
  display: none;
}

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
