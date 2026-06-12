import { createClient } from './server'
import { getQaVerificationSession } from '@/lib/platform/qa-verification.server'

export interface UserSchoolContext {
  school_id: string
  role_code: string
}

export async function getUserSchoolContext(userId: string): Promise<UserSchoolContext | null> {
  const qaSession = await getQaVerificationSession(userId)
  if (qaSession) {
    return {
      school_id: qaSession.schoolId,
      role_code: qaSession.roleCode,
    }
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('user_school_roles')
    .select('school_id, role_code')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(50)

  const rows = (data as Array<{ school_id: string; role_code: string }> | null) ?? []
  if (!rows.length) return null

  const schoolIds = [...new Set(rows.map(r => r.school_id))]
  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('id, is_active, platform_status, suspended_until')
    .in('id', schoolIds)

  const schools = (schoolRaw as Array<{
    id: string
    is_active: boolean
    platform_status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | null
    suspended_until?: string | null
  }> | null) ?? []

  const schoolStatusById = new Map(
    schools.map(s => [s.id, s] as const)
  )

  const operationalRole = rows.find(row => {
    const school = schoolStatusById.get(row.school_id)
    if (!school) return false
    const status = school.platform_status ?? (school.is_active ? 'ACTIVE' : 'DISABLED')
    if (status === 'ACTIVE') return true
    if (status === 'SUSPENDED' && school.suspended_until) {
      return new Date(school.suspended_until).getTime() <= Date.now()
    }
    return false
  })

  if (!operationalRole) return null

  return {
    school_id: operationalRole.school_id,
    role_code: operationalRole.role_code,
  }
}
