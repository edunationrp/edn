import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformReportsClient } from '@/features/platform/platform-reports-client'
import { getPlatformOverview } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rapports globaux — Super Admin',
}

export default async function PlatformReportsPage() {
  const overview = await getPlatformOverview()

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Rapports globaux"
        description="Croissance, répartition et indicateurs clés de la plateforme EduNation"
        badge="Plateforme"
      />
      <PlatformReportsClient overview={overview} />
    </div>
  )
}
