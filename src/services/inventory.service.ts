import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type InventoryTransaction = {
  id: string
  transaction_type: Database['public']['Enums']['inventory_transaction_type']
  quantity_change: number
  note: string | null
  created_at: string
  profiles: { full_name: string } | null
}
export type InventoryItemInput = {
  name: string
  category: string | null
  unit: string
  supplier: string | null
  unit_cost: number
  reorder_threshold: number
  image_path: string | null
}

const IMAGE_BUCKET = 'inventory-images'
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export type StockAction = 'addition' | 'consumption'

export async function listInventory(clinicId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_archived', false)
    .order('name')
  if (error) throw new Error(error.message)
  return data
}

export async function listItemTransactions(clinicId: string, itemId: string) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(
      'id, transaction_type, quantity_change, note, created_at, profiles!inventory_transactions_actor_id_fkey(full_name)',
    )
    .eq('clinic_id', clinicId)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return data as InventoryTransaction[]
}

export const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_threshold

export async function createItem(clinicId: string, input: InventoryItemInput) {
  const { error } = await supabase.from('inventory_items').insert({ ...input, clinic_id: clinicId })
  if (error) {
    throw new Error(
      error.code === '23505' ? 'An item with this name already exists.' : error.message,
    )
  }
}

export async function updateItem(clinicId: string, id: string, input: InventoryItemInput) {
  const { error } = await supabase
    .from('inventory_items')
    .update(input)
    .eq('clinic_id', clinicId)
    .eq('id', id)
  if (error) {
    throw new Error(
      error.code === '23505' ? 'An item with this name already exists.' : error.message,
    )
  }
}

export async function archiveItem(clinicId: string, id: string, imagePath: string | null) {
  const { error } = await supabase
    .from('inventory_items')
    .update({ is_archived: true })
    .eq('clinic_id', clinicId)
    .eq('id', id)
  if (error) throw new Error(error.message)
  if (!imagePath) return
  try {
    await removeInventoryImage(imagePath)
  } catch {
    // The item is already archived. A leftover photo does not block the archive.
  }
}

export async function inventoryImageUrl(path: string | null) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

export async function uploadInventoryImage(clinicId: string, file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Item photos must be smaller than 2 MB.')
  }
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${clinicId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return path
}

export async function removeInventoryImage(path: string) {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

// The database trigger updates stock and rejects results below zero.
export async function recordStockChange(
  clinicId: string,
  actorId: string,
  item: InventoryItem,
  action: StockAction,
  quantity: number,
  note: string | null,
) {
  const change = action === 'addition' ? quantity : -quantity
  const { error } = await supabase.from('inventory_transactions').insert({
    clinic_id: clinicId,
    actor_id: actorId,
    item_id: item.id,
    transaction_type: action,
    quantity_change: change,
    note,
  })
  if (error) {
    throw new Error(
      error.message.includes('negative')
        ? 'Not enough stock for this change.'
        : error.message,
    )
  }
}
