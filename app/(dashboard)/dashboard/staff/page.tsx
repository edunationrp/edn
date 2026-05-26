import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { StaffDirectoryTable } from '@/features/staff/staff-directory-table'
import type { StaffDirectoryRow } from '@/features/staff/staff-directory-table'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasPermission, isSchoolFullAuthority } from '@/types/permissions'
import { ROLE_LABELS, STAFF_ROLES, type UserRole } from '@/types/roles'
import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

export const metadata: Metadata = {
  title: 'Gestion du personnel',
}

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const schoolRole = await getUserSchoolContext(user.id)
  const role = schoolRole?.role_code as UserRole | undefined
  const canInvite = role ? hasPermission(role, 'staff:invite') : false
  const canRemove = role ? isSchoolFullAuthority(role) : false

  const { data: staffMembersRaw, count } = await supabase
    .from('user_school_roles')
    .select(`
      id, user_id, role_code, is_active, created_at,
      profiles (id, full_name, email, phone, avatar_url, is_active)
    `, { count: 'exact' })
    .eq('school_id', schoolRole?.school_id ?? '')
    .in('role_code', STAFF_ROLES)
    .order('created_at', { ascending: false })

  const staffMembers = staffMembersRaw as Array<{
    id: string
    user_id: string
    role_code: string
    is_active: boolean
    created_at: string
    profiles: {
      id: string
      full_name: string | null
      email: string | null
      phone: string | null
      avatar_url: string | null
      is_active: boolean
    } | null
  }> | null

  const roleGroups = STAFF_ROLES.reduce((acc, role) => {
    acc[role] = staffMembers?.filter(s => s.role_code === role).length ?? 0
    return acc
  }, {} as Record<string, number>)

  const rows: StaffDirectoryRow[] = (staffMembers ?? []).map(member => ({
    id: member.id,
    userId: member.user_id,
    roleCode: member.role_code as UserRole,
    isActive: member.is_active,
    createdAt: member.created_at,
    fullName: member.profiles?.full_name?.trim() || '—',
    email: member.profiles?.email ?? null,
    phone: member.profiles?.phone ?? null,
    isCurrentUser: member.user_id === user.id,
  }))

  return (
    <div className={dashboard.page}>
      <PageHeader
        title="Personnel"
        description={`${count ?? 0} membre${(count ?? 0) > 1 ? 's' : ''} du personnel`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canInvite && (
              <Button className="w-full sm:w-auto" variant="brandDark" asChild>
                <Link href="/dashboard/staff/roles-permissions?tab=invitations">
                  <UserPlus className="h-4 w-4" />
                  Inviter du personnel
                </Link>
              </Button>
            )}
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/staff/roles-permissions">
                Rôles & permissions
              </Link>
            </Button>
          </div>
        }
      />

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible lg:grid-cols-6">
        {STAFF_ROLES.map(role => (
          <div
            key={role}
            className={cn(
              dashboard.card,
              'min-w-[108px] shrink-0 snap-start p-3 text-center sm:min-w-0',
            )}
          >
            <p className="text-2xl font-bold tabular-nums text-[#1a4d2e]">{roleGroups[role]}</p>
            <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">
              {ROLE_LABELS[role as UserRole]}
            </p>
          </div>
        ))}
      </div>

      <StaffDirectoryTable members={rows} canRemove={canRemove} />
    </div>
  )
}
