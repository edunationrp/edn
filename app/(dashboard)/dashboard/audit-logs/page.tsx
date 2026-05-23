import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canAccessAuditLogs } from '@/lib/dashboard/role-scope'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { Shield } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Metadata } from 'next'

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

  const logs = logsRaw as Array<{
    id: string
    action: string
    entity_type: string
    entity_id: string | null
    ip_address: unknown
    created_at: string
    profiles: { full_name: string | null; email: string | null } | null
  }> | null

  const actionColors: Record<string, string> = {
    login: 'bg-blue-100 text-blue-800',
    logout: 'bg-gray-100 text-gray-800',
    create: 'bg-green-100 text-green-800',
    update: 'bg-orange-100 text-orange-800',
    delete: 'bg-red-100 text-red-800',
    validate: 'bg-teal-100 text-teal-800',
    generate: 'bg-purple-100 text-purple-800',
  }

  const total = count ?? 0

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Journaux d'Audit"
        description={`${total} action${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''} pour votre établissement`}
      />

      <Card>
        <CardContent className="p-0 sm:p-6">
          {logs && logs.length > 0 ? (
            <>
              <div className="divide-y sm:hidden">
                {logs.map(log => {
                  const actionType = log.action.split('_')[0].toLowerCase()
                  const badgeColor = actionColors[actionType] ?? 'bg-gray-100 text-gray-800'
                  return (
                    <div key={log.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={badgeColor}>{log.action}</Badge>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {log.profiles?.full_name ?? 'Système'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.entity_type}
                        {log.entity_id ? ` · #${log.entity_id.slice(0, 8)}` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date/Heure</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Acteur</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Action</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Entité</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const actionType = log.action.split('_')[0].toLowerCase()
                      const badgeColor = actionColors[actionType] ?? 'bg-gray-100 text-gray-800'
                      return (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="py-2.5 px-4">
                            <p className="text-xs font-medium">{log.profiles?.full_name ?? 'Système'}</p>
                            <p className="text-xs text-muted-foreground">{log.profiles?.email ?? ''}</p>
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge className={badgeColor}>{log.action}</Badge>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground">
                            {log.entity_type}
                            {log.entity_id && (
                              <span className="ml-1 font-mono opacity-60">#{log.entity_id.slice(0, 8)}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground font-mono">
                            {String(log.ip_address) ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Shield className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Aucun log d&apos;audit pour cet établissement
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
