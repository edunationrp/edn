import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getQaRoleLabel } from '@/lib/platform/qa-verification'
import type { UserRole } from '@/types/roles'

export const QA_AUDIT_ACTION_START = 'qa_verification_start'
export const QA_AUDIT_ACTION_END = 'qa_verification_end'

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

type LogInput = {
  action: 'start' | 'end'
  schoolId: string
  schoolName: string
  roleCode: UserRole
}

export async function logQaVerificationEvent(input: LogInput): Promise<void> {
  const supabase = await createClient()
  const auditAction = input.action === 'start' ? QA_AUDIT_ACTION_START : QA_AUDIT_ACTION_END

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('log_platform_admin_action', {
    p_action: auditAction,
    p_target_type: 'qa_verification',
    p_target_id: input.schoolId,
    p_reason: `Simulation du rôle ${getQaRoleLabel(input.roleCode)}`,
    p_metadata: {
      schoolId: input.schoolId,
      schoolName: input.schoolName,
      roleCode: input.roleCode,
      roleLabel: getQaRoleLabel(input.roleCode),
    },
  })
}

export async function getQaVerificationAuditLogs(limit = 30): Promise<QaVerificationAuditRow[]> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('platform_admin_actions')
      .select(`
        id, action, target_id, metadata, created_at,
        profiles!platform_admin_actions_actor_id_fkey ( full_name, email )
      `)
      .in('action', [QA_AUDIT_ACTION_START, QA_AUDIT_ACTION_END])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as Array<{
      id: string
      action: string
      target_id: string | null
      metadata: {
        schoolName?: string
        roleCode?: string
        roleLabel?: string
      } | null
      created_at: string
      profiles: { full_name: string | null; email: string | null } | null
    }>).map(row => ({
      id: row.id,
      action: row.action,
      schoolId: row.target_id,
      schoolName: row.metadata?.schoolName ?? null,
      roleCode: row.metadata?.roleCode ?? null,
      roleLabel: row.metadata?.roleLabel ?? null,
      actorName: row.profiles?.full_name ?? 'Super admin',
      actorEmail: row.profiles?.email ?? '',
      createdAt: row.created_at,
    }))
  } catch {
    return []
  }
}
