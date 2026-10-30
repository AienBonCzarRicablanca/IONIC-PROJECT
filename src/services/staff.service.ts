import type { Database } from '../types/database.types'
import { supabase } from './supabase'

export type AppRole = Database['public']['Enums']['app_role']
export type ClinicAccount = Database['public']['Functions']['list_clinic_accounts']['Returns'][number]

export async function listAccounts() {
  const { data, error } = await supabase.rpc('list_clinic_accounts')
  if (error) throw new Error(error.message)
  return data
}

export async function setStaffRole(userId: string, role: AppRole, active: boolean) {
  const { error } = await supabase.rpc('set_staff_role', {
    target_user: userId,
    new_role: role,
    make_active: active,
  })
  if (error) throw new Error(error.message)
}
