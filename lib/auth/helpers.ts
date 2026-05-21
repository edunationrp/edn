import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/roles'
import type { UserProfile } from '@/types/global'

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1)

  const profile = (profileRaw as UserProfile[] | null)?.[0] ?? null
  return profile
}

export async function getUserSchoolRoles(userId: string, schoolId: string): Promise<UserRole[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .eq('is_active', true)

  const rows = data as Array<{ role_code: string }> | null
  return rows?.map(r => r.role_code as UserRole) ?? []
}

type SchoolRow = {
  id: string
  name: string
  type: string
  logo_url: string | null
  city: string | null
  is_active: boolean
}

type UserSchoolRoleRow = {
  role_code: string
  school_id: string
  school_name: string | null
  school_type: string | null
  school_city: string | null
  school_logo_url: string | null
  school_is_active: boolean | null
}

export async function getUserActiveSchools(userId: string): Promise<UserSchoolRoleRow[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_school_roles')
    .select('role_code, school_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  const rows = data as Array<{ role_code: string; school_id: string }> | null
  if (!rows || rows.length === 0) return []

  const schoolIds = rows.map(r => r.school_id)
  const { data: schoolsRaw } = await supabase
    .from('schools')
    .select('id, name, type, logo_url, city, is_active')
    .in('id', schoolIds)

  const schools = schoolsRaw as SchoolRow[] | null
  const schoolMap = new Map((schools ?? []).map(s => [s.id, s]))

  return rows.map(r => {
    const school = schoolMap.get(r.school_id)
    return {
      role_code: r.role_code,
      school_id: r.school_id,
      school_name: school?.name ?? null,
      school_type: school?.type ?? null,
      school_city: school?.city ?? null,
      school_logo_url: school?.logo_url ?? null,
      school_is_active: school?.is_active ?? null,
    }
  })
}
