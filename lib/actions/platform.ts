'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin } from '@/lib/platform/access'

type AdminRpcResponse = { error: { message: string } | null }
type AdminRpcClient = {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<AdminRpcResponse>
}

async function requireAdmin() {
  const access = await requirePlatformAdmin()
  if ('error' in access) return access
  try {
    return { admin: createAdminClient(), userClient: access.supabase }
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }
}

export async function setPlatformSchoolActive(schoolId: string, isActive: boolean) {
  const result = await requireAdmin()
  if ('error' in result) return result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (result.admin as any).rpc('super_admin_set_school_status', {
    p_school_id: schoolId,
    p_status: isActive ? 'ACTIVE' : 'SUSPENDED',
    p_reason: isActive ? 'Réactivation par super admin' : 'Suspension par super admin',
    p_suspended_until: null,
  })

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

  const rpcClient = result.userClient as unknown as AdminRpcClient
  const { error } = isActive
    ? await rpcClient.rpc('super_admin_reactivate_user', {
      p_target_user_id: userId,
      p_reason: 'Réactivation par super admin',
    })
    : await rpcClient.rpc('super_admin_suspend_user_total', {
      p_target_user_id: userId,
      p_reason: 'Suspension totale par super admin',
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/users')
  return { success: true as const }
}

export async function suspendPlatformUserTemporary(userId: string, reason: string, untilIso: string) {
  const result = await requireAdmin()
  if ('error' in result) return result

  const until = new Date(untilIso)
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
    return { error: 'Date de fin invalide.' }
  }

  const rpcClient = result.userClient as unknown as AdminRpcClient
  const { error } = await rpcClient.rpc('super_admin_suspend_user_temporary', {
    p_target_user_id: userId,
    p_reason: reason.trim() || 'Suspension temporaire par super admin',
    p_until: until.toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/users')
  return { success: true as const }
}

export async function setPlatformSchoolStatus(
  schoolId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
  reason?: string,
  suspendedUntilIso?: string | null
) {
  const result = await requireAdmin()
  if ('error' in result) return result

  let suspendedUntil: string | null = null
  if (status === 'SUSPENDED' && suspendedUntilIso) {
    const d = new Date(suspendedUntilIso)
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      return { error: 'Date de suspension invalide.' }
    }
    suspendedUntil = d.toISOString()
  }

  const rpcClient = result.userClient as unknown as AdminRpcClient
  const { error } = await rpcClient.rpc('super_admin_set_school_status', {
    p_school_id: schoolId,
    p_status: status,
    p_reason: reason?.trim() || null,
    p_suspended_until: suspendedUntil,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform')
  revalidatePath('/dashboard/platform/schools')
  revalidatePath(`/dashboard/platform/schools/${schoolId}`)
  return { success: true as const }
}

export async function reviewSuspensionAppeal(
  appealId: string,
  status: 'APPROVED' | 'REJECTED',
  note?: string
) {
  const result = await requireAdmin()
  if ('error' in result) return result

  const rpcClient = result.userClient as unknown as AdminRpcClient
  const { error } = await rpcClient.rpc('review_suspension_appeal', {
    p_request_id: appealId,
    p_status: status,
    p_review_note: note?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/platform/access-control')
  return { success: true as const }
}
