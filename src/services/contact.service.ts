import { supabase } from './supabase'

export type ContactMessage = {
  id: string
  sender_name: string
  sender_email: string
  message: string
  created_at: string
  read_at: string | null
}

export async function submitContactMessage(name: string, email: string, message: string) {
  const { error } = await supabase.rpc('submit_contact_message', {
    p_name: name,
    p_email: email,
    p_message: message,
  })
  if (error) throw new Error(error.message)
}

export async function listContactMessages(clinicId: string) {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, sender_name, sender_email, message, created_at, read_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data as ContactMessage[]
}

export async function markContactMessageRead(clinicId: string, id: string) {
  const { error } = await supabase
    .from('contact_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('clinic_id', clinicId)
    .eq('id', id)
    .is('read_at', null)
  if (error) throw new Error(error.message)
}
