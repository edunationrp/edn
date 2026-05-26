import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformOrganizationsTable } from '@/features/platform/platform-organizations-table'
import { getPlatformOrganizations } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organisations — Super Admin',
}

export default async function PlatformOrganizationsPage() {
  const organizations = await getPlatformOrganizations()

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Organisations"
        description={`${organizations.length} groupe${organizations.length > 1 ? 's' : ''} multi-établissements`}
        badge="Plateforme"
      />
      <PlatformOrganizationsTable organizations={organizations} />
    </div>
  )
}
