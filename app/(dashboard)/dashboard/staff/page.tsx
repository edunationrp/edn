import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import type { StaffDirectoryRow } from '@/features/staff/staff-directory-table'
import { StaffPageClient } from '@/features/staff/staff-page-client'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasPermission, isSchoolFullAuthority } from '@/types/permissions'
import { STAFF_ROLES, type UserRole } from '@/types/roles'
import type { Metadata } from 'next'
import { getSchoolOrgChartData } from '@/lib/staff/org-chart-data'

export const metadata: Metadata = {
  title: 'Gestion du personnel',
}

type StaffPageProps = {
  searchParams: Promise<{ view?: string }>
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const supabase = await createClient()
  const { view } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const schoolRole = await getUserSchoolContext(user.id)
  const schoolId = schoolRole?.school_id
  if (!schoolId) redirect('/dashboard')

  const role = schoolRole?.role_code as UserRole | undefined
  const canInvite = role ? hasPermission(role, 'staff:invite') : false
  const canRemove = role ? isSchoolFullAuthority(role) : false

  const [{ data: staffMembersRaw, count }, orgChart] = await Promise.all([
    supabase
      .from('user_school_roles')
      .select(`
        id, user_id, role_code, is_active, created_at,
        profiles (id, full_name, email, phone, avatar_url, is_active)
      `, { count: 'exact' })
      .eq('school_id', schoolId)
      .in('role_code', STAFF_ROLES)
      .order('created_at', { ascending: false }),
    getSchoolOrgChartData(schoolId),
  ])

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

  const roleGroups = STAFF_ROLES.reduce((acc, roleCode) => {
    acc[roleCode] = staffMembers?.filter(s => s.role_code === roleCode).length ?? 0
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

  const initialView = view === 'organigramme' ? 'organigramme' as const : 'liste' as const

  return (
    <div className="min-w-0 space-y-5 animate-fade-in sm:space-y-6">
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

      <StaffPageClient
        initialView={initialView}
        rows={rows}
        canInvite={canInvite}
        canRemove={canRemove}
        orgChart={orgChart}
        roleGroups={roleGroups}
      />
    </div>
  )
}
