export const INVENTORY_CATEGORIES = [
  'Instruments',
  'Consumables',
  'Restorative materials',
  'Anesthesia',
  'Sterilization',
  'Orthodontics',
  'PPE',
  'Medications',
  'Office supplies',
] as const

export const OTHER_CATEGORY = '__other__'

export function isPresetCategory(value: string) {
  return (INVENTORY_CATEGORIES as readonly string[]).includes(value)
}
