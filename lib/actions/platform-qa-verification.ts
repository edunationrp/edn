'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logQaVerificationEvent } from '@/lib/platform/qa-audit.server'
import { ensureQaDemoSchoolData } from '@/lib/platform/qa-demo-seed'
import {
  QA_DEMO_DEFAULT_ROLE,
  QA_DEMO_SCHOOL_ID,
  QA_DEMO_SCHOOL_NAME,
} from '@/lib/platform/qa-demo-school'
import {
  QA_VERIFICATION_COOKIE,
  QA_VERIFICATION_COOKIE_OPTIONS,
  encodeQaVerificationPayload,
  isQaInspectableRole,
  type QaInspectableSchool,
} from '@/lib/platform/qa-verification'
import {
  isPlatformOwnerAccount,
  readQaVerificationPayload,
} from '@/lib/platform/qa-verification.server'
import type { UserRole } from '@/types/roles'

async function requirePlatformOwner(): Promise<
  { user: { id: string }; supabase: Awaited<ReturnType<typeof createClient>> } | { error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }
  if (!(await isPlatformOwnerAccount(user.id))) {
    return { error: 'Accès réservé à la super-administration EduNation.' }
  }
  return { user, supabase }
}

function sortInspectableSchools(
  schools: QaInspectableSchool[],
): QaInspectableSchool[] {
  return [...schools].sort((a, b) => {
    if (a.isQaDemo !== b.isQaDemo) return a.isQaDemo ? -1 : 1
    return a.name.localeCompare(b.name, 'fr')
  })
}

export async function ensureQaDemoSchool(): Promise<
  { ok: true; studentCount: number; created: boolean } | { error: string }
> {
  const access = await requirePlatformOwner()
  if ('error' in access) return access

  try {
    const admin = createAdminClient()
    const result = await ensureQaDemoSchoolData(admin)
    if ('error' in result) return result

    revalidatePath('/dashboard/platform/inspect')
    return { ok: true, studentCount: result.studentCount, created: result.created }
  } catch {
    return { error: 'Service indisponible (configuration serveur).' }
  }
}

export async function listQaInspectableSchools(): Promise<
  { schools: QaInspectableSchool[] } | { error: string }
> {
  const access = await requirePlatformOwner()
  if ('error' in access) return access

  try {
    const admin = createAdminClient()
    await ensureQaDemoSchoolData(admin)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('schools')
      .select('id, name, city, type, is_active, is_qa_demo')
      .order('name', { ascending: true })

    if (error) return { error: error.message }

    const schools = sortInspectableSchools(
      ((data ?? []) as Array<{
        id: string
        name: string
        city: string | null
        type: string
        is_active: boolean
        is_qa_demo?: boolean
      }>).map(row => ({
        id: row.id,
        name: row.name,
        city: row.city,
        type: row.type,
        isActive: row.is_active,
        isQaDemo: Boolean(row.is_qa_demo),
      })),
    )

    return { schools }
  } catch {
    return { error: 'Service indisponible (configuration serveur).' }
  }
}

async function fetchSchoolSummary(
  admin: ReturnType<typeof createAdminClient>,
  schoolId: string,
): Promise<{ id: string; name: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('schools')
    .select('id, name')
    .eq('id', schoolId)
    .limit(1)

  if (error) return null
  return (data as Array<{ id: string; name: string }> | null)?.[0] ?? null
}

export async function startQaVerification(input: {
  schoolId: string
  roleCode: string
}): Promise<{ success: true; redirectTo: string } | { error: string }> {
  const access = await requirePlatformOwner()
  if ('error' in access) return access

  const schoolId = input.schoolId?.trim()
  const roleCode = input.roleCode?.trim()

  if (!schoolId) return { error: 'Sélectionnez un établissement.' }
  if (!roleCode || !isQaInspectableRole(roleCode)) {
    return { error: 'Sélectionnez un rôle personnel valide.' }
  }

  let school: { id: string; name: string } | null = null

  try {
    const admin = createAdminClient()
    if (schoolId === QA_DEMO_SCHOOL_ID) {
      const ensure = await ensureQaDemoSchoolData(admin)
      if ('error' in ensure) return ensure
    }

    school = await fetchSchoolSummary(admin, schoolId)
    if (!school) return { error: 'Établissement introuvable.' }
  } catch {
    return { error: 'Service indisponible (configuration serveur).' }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    QA_VERIFICATION_COOKIE,
    encodeQaVerificationPayload({ s: schoolId, r: roleCode }),
    QA_VERIFICATION_COOKIE_OPTIONS,
  )

  await logQaVerificationEvent({
    action: 'start',
    schoolId,
    schoolName: school.name,
    roleCode: roleCode as UserRole,
  })

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/platform/inspect')

  return { success: true, redirectTo: '/dashboard' }
}

export async function startQaDemoVerification(): Promise<
  { success: true; redirectTo: string } | { error: string }
> {
  return startQaVerification({
    schoolId: QA_DEMO_SCHOOL_ID,
    roleCode: QA_DEMO_DEFAULT_ROLE,
  })
}

export async function endQaVerification(): Promise<
  { success: true; redirectTo: string } | { error: string }
> {
  const access = await requirePlatformOwner()
  if ('error' in access) return access

  const payload = await readQaVerificationPayload()
  let auditContext: {
    schoolId: string
    schoolName: string
    roleCode: UserRole
  } | null = null

  if (payload && isQaInspectableRole(payload.r)) {
    try {
      const admin = createAdminClient()
      const school = await fetchSchoolSummary(admin, payload.s)
      if (school) {
        auditContext = {
          schoolId: payload.s,
          schoolName: school.name,
          roleCode: payload.r,
        }
      } else if (payload.s === QA_DEMO_SCHOOL_ID) {
        auditContext = {
          schoolId: QA_DEMO_SCHOOL_ID,
          schoolName: QA_DEMO_SCHOOL_NAME,
          roleCode: payload.r,
        }
      }
    } catch {
      // ignore audit lookup errors
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(QA_VERIFICATION_COOKIE, '', { ...QA_VERIFICATION_COOKIE_OPTIONS, maxAge: 0 })

  if (auditContext) {
    await logQaVerificationEvent({
      action: 'end',
      schoolId: auditContext.schoolId,
      schoolName: auditContext.schoolName,
      roleCode: auditContext.roleCode,
    })
  }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/platform/inspect')

  return { success: true, redirectTo: '/dashboard' }
}
