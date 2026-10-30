export type UserRole = 'superadmin' | 'admin' | 'dentist' | 'patient'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  contactNumber: string | null
  avatarPath: string | null
  role: UserRole
  isActive: boolean
  clinicId: string
}

export const ROLE_HOME: Record<UserRole, string> = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  dentist: '/dentist/dashboard',
  patient: '/patient/dashboard',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Clinic Owner',
  admin: 'Front Desk',
  dentist: 'Dentist',
  patient: 'Patient',
}

export interface NavItem {
  label: string
  path: string
  icon: string
}
