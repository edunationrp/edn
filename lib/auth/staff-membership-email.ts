import { createHash } from 'crypto'

const STAFF_AUTH_DOMAIN =
  process.env.STAFF_AUTH_EMAIL_DOMAIN?.trim() || 'login.edunation.internal'

/** Email technique Supabase Auth — unique par (email de contact, établissement). */
export function buildStaffMembershipAuthEmail(contactEmail: string, schoolId: string): string {
  const normalized = contactEmail.trim().toLowerCase()
  const digest = createHash('sha256')
    .update(`${normalized}:${schoolId}`)
    .digest('hex')
    .slice(0, 32)
  return `staff.${digest}@${STAFF_AUTH_DOMAIN}`
}

export function isStaffMembershipAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return lower.startsWith('staff.') && lower.endsWith(`@${STAFF_AUTH_DOMAIN.toLowerCase()}`)
}

export function normalizeContactEmail(email: string): string {
  return email.trim().toLowerCase()
}
