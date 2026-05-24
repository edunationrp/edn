import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { AuditLogsTable } from '@/features/audit/audit-logs-table'
import type { Metadata } from 'next'
import { canAccessAuditLogs } from '@/lib/dashboard/role-scope'

export const metadata: Metadata = {
  title: 'Journaux d\'audit',
}

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  if (!canAccessAuditLogs(ctx.role_code)) {
    redirect('/dashboard')
  }

  const { data: logsRaw, count } = await supabase
    .from('audit_logs')
    .select(
      `
      *,
      profiles!audit_logs_actor_id_fkey (full_name, email)
    `,
      { count: 'exact' }
    )
    .eq('school_id', ctx.school_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const logs = ((logsRaw as Array<{
    id: string
    action: string
    entity_type: string
    entity_id: string | null
    ip_address: unknown
    created_at: string
    profiles: { full_name: string | null; email: string | null } | null
  }> | null) ?? []).map(log => ({
    id: log.id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    ip_address: String(log.ip_address ?? ''),
    created_at: log.created_at,
    actorName: log.profiles?.full_name ?? 'Système',
    actorEmail: log.profiles?.email ?? '',
  }))

  const total = count ?? 0

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Journaux d'Audit"
        description={`${total} action${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''} pour votre établissement`}
      />

      <AuditLogsTable logs={logs} />
    </div>
  )
}
