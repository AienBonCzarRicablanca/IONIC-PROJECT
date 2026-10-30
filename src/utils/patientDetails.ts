export type PatientSex = 'female' | 'male' | 'other'

const SEX_LABELS: Record<PatientSex, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
}

export function isPatientSex(value: string | null | undefined): value is PatientSex {
  return value === 'female' || value === 'male' || value === 'other'
}

export function sexLabel(value: string | null | undefined) {
  return isPatientSex(value) ? SEX_LABELS[value] : '—'
}

export function ageFromBirthDate(value: string | null | undefined, today = new Date()) {
  if (!value) return null
  const birth = new Date(`${value}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const month = today.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1
  return age >= 0 && age < 130 ? age : null
}

export function ageLabel(value: string | null | undefined) {
  const age = ageFromBirthDate(value)
  if (age === null) return null
  return age === 1 ? '1 year old' : `${age} years old`
}

export function birthSummary(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00`),
  )
  const age = ageLabel(value)
  return age ? `${date} · ${age}` : date
}
