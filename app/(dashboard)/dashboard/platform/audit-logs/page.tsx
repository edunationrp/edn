import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformAuditLogsTable } from '@/features/platform/platform-audit-logs-table'
import { getPlatformAuditLogs } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journaux d\'audit — Super Admin',
}

export default async function PlatformAuditLogsPage() {
  const logs = await getPlatformAuditLogs(150)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Journaux d'audit"
        description={`${logs.length} dernières actions enregistrées sur toute la plateforme`}
        badge="Plateforme"
      />
      <PlatformAuditLogsTable logs={logs} />
    </div>
  )
}
