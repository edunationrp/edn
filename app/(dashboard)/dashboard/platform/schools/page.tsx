import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformSchoolsTable } from '@/features/platform/platform-schools-table'
import { getPlatformSchools } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Établissements — Super Admin',
}

export default async function PlatformSchoolsPage() {
  const schools = await getPlatformSchools()
  const active = schools.filter(s => s.isActive).length

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Établissements"
        description={`${schools.length} établissement${schools.length > 1 ? 's' : ''} · ${active} actif${active > 1 ? 's' : ''}`}
        badge="Plateforme"
      />
      <PlatformSchoolsTable schools={schools} />
    </div>
  )
}
