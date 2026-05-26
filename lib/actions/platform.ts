'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin } from '@/lib/platform/access'

async function requireAdmin() {
  const access = await requirePlatformAdmin()
  if ('error' in access) return access
  try {
    return { admin: createAdminClient() }
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }
}

export async function setPlatformSchoolActive(schoolId: string, isActive: boolean) {
  const result = await requireAdmin()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (result.admin as any)
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform')
  revalidatePath('/dashboard/platform/schools')
  revalidatePath(`/dashboard/platform/schools/${schoolId}`)
  return { success: true as const }
}

export async function setPlatformOrganizationActive(orgId: string, isActive: boolean) {
  const result = await requireAdmin()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (result.admin as any)
    .from('organizations')
    .update({ is_active: isActive })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/organizations')
  return { success: true as const }
}

export async function updatePlatformOrganizationPlan(
  orgId: string,
  planCode: string,
  maxSchools: number
) {
  const result = await requireAdmin()
  if ('error' in result) return result

  if (maxSchools < 1 || maxSchools > 100) {
    return { error: 'Nombre d\'établissements invalide (1–100).' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (result.admin as any)
    .from('organizations')
    .update({ plan_code: planCode, max_schools: maxSchools })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/organizations')
  return { success: true as const }
}

export async function setPlatformUserActive(userId: string, isActive: boolean) {
  const result = await requireAdmin()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (result.admin as any)
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/users')
  return { success: true as const }
}
