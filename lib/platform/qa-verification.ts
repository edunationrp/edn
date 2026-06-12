import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isPlatformOwnerRole } from '@/lib/platform/access'
import type { UserRole } from '@/types/roles'
import { ROLE_LABELS } from '@/types/roles'

export const QA_VERIFICATION_COOKIE = 'edunation_qa_verification'

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

export async function isPlatformOwnerAccount(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('default_role')
    .eq('id', userId)
    .limit(1)

  const defaultRole = (profileRaw as Array<{ default_role: string | null }> | null)?.[0]?.default_role
  return isPlatformOwnerRole(defaultRole)
}

export async function readQaVerificationPayload(): Promise<QaVerificationPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(QA_VERIFICATION_COOKIE)?.value
  if (!raw) return null
  return decodeQaVerificationPayload(raw)
}

export async function getQaVerificationSession(userId: string): Promise<QaVerificationSession | null> {
  if (!(await isPlatformOwnerAccount(userId))) return null

  const payload = await readQaVerificationPayload()
  if (!payload || !isQaInspectableRole(payload.r)) return null

  const supabase = await createClient()
  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('id, name')
    .eq('id', payload.s)
    .limit(1)

  const school = (schoolRaw as Array<{ id: string; name: string }> | null)?.[0]
  if (!school) return null

  return {
    schoolId: payload.s,
    roleCode: payload.r,
    schoolName: school.name,
  }
}
