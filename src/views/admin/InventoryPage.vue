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

        <ion-searchbar v-model="search" aria-label="Search inventory" placeholder="Search items" />

        <div v-if="loading" class="state-message" role="status">Loading inventory...</div>
        <div v-else-if="loadError" class="state-message error-message" role="alert">
          {{ loadError }}
        </div>
        <p v-else-if="!visible.length" class="state-message">No inventory items.</p>
        <ion-list v-else lines="full">
          <ion-item v-for="item in visible" :key="item.id" :detail="false">
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
            <ion-input v-model="form.name" label="Name" label-placement="stacked" fill="outline" required />
            <ion-input v-model="form.category" label="Category" label-placement="stacked" fill="outline" />
            <ion-input v-model="form.unit" label="Unit (e.g. box, pcs)" label-placement="stacked" fill="outline" required />
            <ion-input v-model="form.supplier" label="Supplier" label-placement="stacked" fill="outline" />
            <ion-input v-model="unitCost" label="Unit cost (PHP)" label-placement="stacked" fill="outline" type="number" min="0" step="0.01" />
            <ion-input v-model="threshold" label="Reorder threshold" label-placement="stacked" fill="outline" type="number" min="0" />
            <p v-if="formError" class="error-message" role="alert">{{ formError }}</p>
            <ion-button expand="block" type="submit" :disabled="saving">Save item</ion-button>
            <ion-button v-if="editingId" expand="block" fill="outline" color="danger" :disabled="saving" @click="archive">
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
import { computed, reactive, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue'
import { addOutline } from 'ionicons/icons'
import HeaderTools from '../../components/common/HeaderTools.vue'
import PageAction from '../../components/common/PageAction.vue'
import { useAuth } from '../../composables/useAuth'
import {
  archiveItem,
  createItem,
  type InventoryItem,
  type InventoryTransaction,
  isLowStock,
  listInventory,
  listItemTransactions,
  recordStockChange,
  type StockAction,
  updateItem,
} from '../../services/inventory.service'

const { profile } = useAuth()
const items = ref<InventoryItem[]>([])
const search = ref('')
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
  category: '' as string | null,
  unit: 'pcs',
  supplier: '' as string | null,
})

const lowStock = computed(() => items.value.filter(isLowStock))
const visible = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? items.value.filter((item) => item.name.toLowerCase().includes(term)) : items.value
})

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
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load inventory.'
  } finally {
    loading.value = false
  }
}

watch(() => profile.value?.clinicId, () => void load(), { immediate: true })

function openNew() {
  editingId.value = null
  formError.value = ''
  Object.assign(form, { name: '', category: '', unit: 'pcs', supplier: '' })
  unitCost.value = '0'
  threshold.value = '0'
  itemOpen.value = true
}

function openEdit(item: InventoryItem) {
  editingId.value = item.id
  formError.value = ''
  Object.assign(form, {
    name: item.name,
    category: item.category ?? '',
    unit: item.unit,
    supplier: item.supplier ?? '',
  })
  unitCost.value = String(item.unit_cost)
  threshold.value = String(item.reorder_threshold)
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
    formError.value = error instanceof Error ? error.message : 'Action failed.'
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
      const input = {
        name: form.name.trim(),
        category: form.category?.trim() || null,
        unit: form.unit.trim(),
        supplier: form.supplier?.trim() || null,
        unit_cost: cost,
        reorder_threshold: reorder,
      }
      if (editingId.value) await updateItem(clinicId, editingId.value, input)
      else await createItem(clinicId, input)
    },
    'Item saved.',
    () => (itemOpen.value = false),
  )

const archive = () =>
  guarded(
    (clinicId) => archiveItem(clinicId, editingId.value as string),
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

.state-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: var(--ion-color-danger);
}
</style>
