'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import {
  QA_AUDIT_ACTION_END,
  QA_AUDIT_ACTION_START,
  type QaVerificationAuditRow,
} from '@/lib/platform/qa-verification'
import { ClipboardList } from 'lucide-react'

function actionLabel(action: string) {
  if (action === QA_AUDIT_ACTION_START) return 'Démarrage'
  if (action === QA_AUDIT_ACTION_END) return 'Fin de session'
  return action
}

function actionVariant(action: string): 'success' | 'info' | 'default' {
  if (action === QA_AUDIT_ACTION_START) return 'success'
  if (action === QA_AUDIT_ACTION_END) return 'info'
  return 'default'
}

export function QaVerificationAuditTable({ logs }: { logs: QaVerificationAuditRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-[#1B3A6B]" />
          Journal des vérifications
        </CardTitle>
        <CardDescription>
          Historique des sessions de simulation (super admin).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune session enregistrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Acteur</th>
                  <th className="pb-2 pr-4 font-medium">Action</th>
                  <th className="pb-2 pr-4 font-medium">Établissement</th>
                  <th className="pb-2 font-medium">Rôle simulé</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{log.actorName}</p>
                      {log.actorEmail && (
                        <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={actionVariant(log.action)}>{actionLabel(log.action)}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{log.schoolName ?? '—'}</td>
                    <td className="py-3 text-slate-700">{log.roleLabel ?? log.roleCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
