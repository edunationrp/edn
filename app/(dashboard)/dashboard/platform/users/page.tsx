import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformUsersTable } from '@/features/platform/platform-users-table'
import { getPlatformUsers } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Utilisateurs — Super Admin',
}

export default async function PlatformUsersPage() {
  const users = await getPlatformUsers()
  const active = users.filter(u => u.isActive).length

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Utilisateurs"
        description={`${users.length} compte${users.length > 1 ? 's' : ''} · ${active} actif${active > 1 ? 's' : ''}`}
        badge="Plateforme"
      />
      <PlatformUsersTable users={users} />
    </div>
  )
}
