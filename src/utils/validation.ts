export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required.'
  return EMAIL_PATTERN.test(value.trim()) ? '' : 'Enter a valid email address.'
}

export function validatePassword(value: string): string {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.'
  return ''
}

export function validateRequired(value: string, label: string): string {
  return value.trim() ? '' : `${label} is required.`
}
