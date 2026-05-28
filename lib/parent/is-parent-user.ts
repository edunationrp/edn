import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type SupabaseLike = Pick<SupabaseClient<Database>, 'from'>

const STAFF_ROLES = [
  'PROVISEUR',
  'DIRECTEUR_ADJOINT',
  'FONDATEUR',
  'CENSEUR',
  'SECRETAIRE',
  'PROFESSEUR',
  'INTENDANT',
  'CONSEILLER_EDUCATION',
  'SURVEILLANT_GENERAL',
  'VIE_SCOLAIRE',
  'SUPER_ADMIN_EDUNATION',
] as const

export async function isParentPortalUser(
  supabase: SupabaseLike,
  userId: string,
): Promise<boolean> {
  const { data: account } = await supabase
    .from('parent_accounts')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (account) return true

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_role')
    .eq('id', userId)
    .maybeSingle()

  const role = (profile as { default_role: string | null } | null)?.default_role
  if (role !== 'PARENT' && role !== 'PARENT_ILLETRE') {
    return false
  }

  const { data: staffRoles } = await supabase
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role_code', [...STAFF_ROLES])
    .limit(1)

  return !((staffRoles as Array<{ role_code: string }> | null)?.length)
}
