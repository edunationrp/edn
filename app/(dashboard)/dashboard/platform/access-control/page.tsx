import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformAccessControlPanel } from '@/features/platform/platform-access-control-panel'
import { getPlatformAccessControlData } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contrôle d\'accès — Super Admin',
}

export default async function PlatformAccessControlPage() {
  const data = await getPlatformAccessControlData()

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Contrôle d'accès"
        description={`${data.suspendedUsers.length} compte(s) suspendu(s) · ${data.restrictedSchools.length} école(s) restreinte(s)`}
        badge="Plateforme"
      />
      <PlatformAccessControlPanel
        suspendedUsers={data.suspendedUsers}
        restrictedSchools={data.restrictedSchools}
      />
    </div>
  )
}
