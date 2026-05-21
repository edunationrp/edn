import { createClient } from './server'

export interface UserSchoolContext {
  school_id: string
  role_code: string
}

export async function getUserSchoolContext(userId: string): Promise<UserSchoolContext | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_school_roles')
    .select('school_id, role_code')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)

  const rows = data as Array<{ school_id: string; role_code: string }> | null
  const row = rows?.[0]
  if (!row) return null

  return {
    school_id: row.school_id,
    role_code: row.role_code,
  }
}
