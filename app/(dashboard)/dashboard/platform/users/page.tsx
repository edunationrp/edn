import { PageHeader } from '@/components/dashboard/page-header'
import { PlatformUsersTable } from '@/features/platform/platform-users-table'
import { getPlatformUsers } from '@/lib/platform/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Utilisateurs — Super Admin',
}

export default async function PlatformUsersPage() {
  const users = await getPlatformUsers()
  const active = users.filter(u => u.accountStatus === 'ACTIVE' && u.isActive).length
  const suspendedTotal = users.filter(u => u.accountStatus === 'SUSPENDED_TOTAL').length
  const suspendedTemporary = users.filter(u => u.accountStatus === 'SUSPENDED_TEMPORARY').length

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Utilisateurs"
        description={`${users.length} compte${users.length > 1 ? 's' : ''} · ${active} actif${active > 1 ? 's' : ''} · ${suspendedTotal} suspendu${suspendedTotal > 1 ? 's' : ''} total · ${suspendedTemporary} suspendu${suspendedTemporary > 1 ? 's' : ''} temporaire`}
        badge="Plateforme"
      />
      <PlatformUsersTable users={users} />
    </div>
  )
}
