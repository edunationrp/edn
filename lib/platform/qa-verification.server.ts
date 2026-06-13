import 'server-only'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  QA_VERIFICATION_COOKIE,
  decodeQaVerificationPayload,
  isQaInspectableRole,
  type QaVerificationSession,
} from '@/lib/platform/qa-verification'
import { QA_DEMO_SCHOOL_ID, QA_DEMO_SCHOOL_NAME } from '@/lib/platform/qa-demo-school'

export async function isPlatformOwnerAccount(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('default_role')
    .eq('id', userId)
    .limit(1)

  const defaultRole = (profileRaw as Array<{ default_role: string | null }> | null)?.[0]?.default_role
  return defaultRole === 'SUPER_ADMIN_EDUNATION'
}

export async function readQaVerificationPayload() {
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
  if (!school) {
    if (payload.s === QA_DEMO_SCHOOL_ID) {
      return {
        schoolId: payload.s,
        roleCode: payload.r,
        schoolName: QA_DEMO_SCHOOL_NAME,
      }
    }
    return null
  }

  return {
    schoolId: payload.s,
    roleCode: payload.r,
    schoolName: school.name,
  }
}
