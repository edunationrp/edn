import type { UserRole } from '@/types/roles'
import { ROLE_LABELS } from '@/types/roles'

export const QA_VERIFICATION_COOKIE = 'edunation_qa_verification'

export const QA_AUDIT_ACTION_START = 'qa_verification_start'
export const QA_AUDIT_ACTION_END = 'qa_verification_end'

/** Rôles simulables depuis le dashboard plateforme (hors super admin). */
export const QA_INSPECTABLE_ROLES: UserRole[] = [
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'CENSEUR',
  'CONSEILLER',
  'CONSEILLER_EDUCATION',
  'INTENDANT',
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'SURVEILLANT_GENERAL',
  'PROFESSEUR',
]

export const QA_VERIFICATION_COOKIE_OPTIONS = {
  path: '/dashboard',
  maxAge: 60 * 60 * 8,
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
}

type QaVerificationPayload = {
  s: string
  r: string
}

export type QaVerificationSession = {
  schoolId: string
  roleCode: UserRole
  schoolName: string
}

export type QaInspectableSchool = {
  id: string
  name: string
  city: string | null
  type: string
  isActive: boolean
  isQaDemo: boolean
}

export type QaVerificationAuditRow = {
  id: string
  action: string
  schoolId: string | null
  schoolName: string | null
  roleCode: string | null
  roleLabel: string | null
  actorName: string
  actorEmail: string
  createdAt: string
}

export function encodeQaVerificationPayload(payload: QaVerificationPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeQaVerificationPayload(raw: string): QaVerificationPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as QaVerificationPayload
    if (typeof parsed.s === 'string' && typeof parsed.r === 'string') return parsed
    return null
  } catch {
    return null
  }
}

export function isQaInspectableRole(role: string): role is UserRole {
  return QA_INSPECTABLE_ROLES.includes(role as UserRole)
}

export function getQaRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role
}
