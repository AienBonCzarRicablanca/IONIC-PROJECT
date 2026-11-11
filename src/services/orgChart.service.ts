import type { Database } from '../types/database.types'
import { isSupabaseConfigured, supabase } from './supabase'

const BUCKET = 'org-photos'
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export type OrgAnchor = 'left' | 'right' | 'below'

export type OrgMember = {
  id: string
  clinicId: string
  parentId: string | null
  fullName: string
  roleTitle: string
  bio: string
  photoPath: string | null
  photoUrl: string | null
  posX: number
  posY: number
  anchor: OrgAnchor | null
}

type OrgRow = Database['public']['Tables']['org_members']['Row']

export const previewOrgChart: OrgMember[] = [
  person('a11ce000-0000-4000-8000-000000000001', null, 'Dr. Elena Cruz', 'Clinic Owner', 'Sets the standard of care and still sees patients herself.', 50, 14, null),
  person('a11ce000-0000-4000-8000-000000000002', 'a11ce000-0000-4000-8000-000000000001', 'Marco Santos', 'Clinic Manager', 'Keeps the schedule, the team, and the day running calmly.', 22, 46, 'left'),
  person('a11ce000-0000-4000-8000-000000000003', 'a11ce000-0000-4000-8000-000000000001', 'Daniel Go', 'Front Desk Supervisor', 'Greets every arrival and keeps records within reach.', 50, 46, 'below'),
  person('a11ce000-0000-4000-8000-000000000004', 'a11ce000-0000-4000-8000-000000000001', 'Dr. Rafael Lim', 'Associate Dentist', 'Explains restorative treatment in plain language.', 78, 46, 'right'),
  person('a11ce000-0000-4000-8000-000000000005', 'a11ce000-0000-4000-8000-000000000002', 'Sofia Reyes', 'Patient Care Lead', 'Makes sure each visit starts with a clear plan.', 22, 78, 'below'),
  person('a11ce000-0000-4000-8000-000000000006', 'a11ce000-0000-4000-8000-000000000003', 'Liza Torres', 'Billing Coordinator', 'Walks patients through invoices before treatment begins.', 50, 78, 'below'),
]

function person(
  id: string,
  parentId: string | null,
  fullName: string,
  roleTitle: string,
  bio: string,
  posX: number,
  posY: number,
  anchor: OrgAnchor | null,
): OrgMember {
  return {
    id,
    clinicId: '',
    parentId,
    fullName,
    roleTitle,
    bio,
    photoPath: null,
    photoUrl: null,
    posX,
    posY,
    anchor,
  }
}

function mapMember(row: OrgRow): OrgMember {
  const anchor = row.anchor === 'left' || row.anchor === 'right' || row.anchor === 'below' ? row.anchor : null
  return {
    id: row.id,
    clinicId: row.clinic_id,
    parentId: row.parent_id,
    fullName: row.full_name,
    roleTitle: row.role_title,
    bio: row.bio,
    photoPath: row.photo_path,
    photoUrl: orgPhotoUrl(row.photo_path),
    posX: Number(row.pos_x),
    posY: Number(row.pos_y),
    anchor,
  }
}

export function orgPhotoUrl(path: string | null) {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function listOrgChart(): Promise<{ members: OrgMember[]; saved: boolean }> {
  if (!isSupabaseConfigured) return { members: previewOrgChart, saved: false }
  const { data, error } = await supabase.from('org_members').select('*').order('pos_y').order('pos_x')
  if (error) return { members: previewOrgChart, saved: false }
  return { members: data.map(mapMember), saved: true }
}

export async function createOrgMember(
  clinicId: string,
  input: { parentId: string | null; fullName: string; roleTitle: string; bio: string; posX: number; posY: number; anchor: OrgAnchor | null },
) {
  const { data, error } = await supabase
    .from('org_members')
    .insert({
      clinic_id: clinicId,
      parent_id: input.parentId,
      full_name: input.fullName,
      role_title: input.roleTitle,
      bio: input.bio,
      pos_x: input.posX,
      pos_y: input.posY,
      anchor: input.anchor,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMember(data)
}

export async function updateOrgMember(
  id: string,
  input: { fullName: string; roleTitle: string; bio: string; parentId: string | null; photoPath?: string | null },
) {
  const { data, error } = await supabase
    .from('org_members')
    .update({
      full_name: input.fullName,
      role_title: input.roleTitle,
      bio: input.bio,
      parent_id: input.parentId,
      ...(input.photoPath !== undefined ? { photo_path: input.photoPath } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMember(data)
}

export async function moveOrgMember(id: string, posX: number, posY: number) {
  const { error } = await supabase.from('org_members').update({ pos_x: posX, pos_y: posY }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteOrgMember(id: string) {
  const { error } = await supabase.from('org_members').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadOrgPhoto(clinicId: string, file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photo.')
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error('Photos must be smaller than 2 MB.')
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${clinicId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)
  return path
}

export async function removeOrgPhoto(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
