import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { Suspense } from 'react'
import { RolesPermissionsClient } from '@/features/staff/roles-permissions-client'
import { hasPermission, isSchoolFullAuthority } from '@/types/permissions'
import { ROLE_LABELS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import type { Metadata } from 'next'
import type { RolesPermissionsPayload } from '@/features/staff/roles-permissions-types'
import { getPublicAppUrl } from '@/lib/env/public'
import {
  enrichTeacherAssignments,
  parseTeacherAssignmentsFromMetadata,
} from '@/lib/staff/invitation-assignments'

export const metadata: Metadata = {
  title: 'Rôles & Permissions — EduNation',
}

type RawInvitation = {
  id: string
  role_code: string
  status: string
  token: string
  expires_at: string
  invited_email: string | null
  invited_name: string | null
  metadata: unknown
}

async function loadInvitations(
  schoolId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, error: userError } = await (supabase as any)
    .from('staff_invitations')
    .select('id, role_code, status, token, expires_at, invited_email, invited_name, metadata')
    .eq('school_id', schoolId)
    .order('expires_at', { ascending: false })
    .limit(50)

  let rows = (userData as RawInvitation[] | null) ?? []

  if (userError || !userData) {
    try {
      const admin = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (admin as any)
        .from('staff_invitations')
        .select('id, role_code, status, token, expires_at, invited_email, invited_name, metadata')
        .eq('school_id', schoolId)
        .order('expires_at', { ascending: false })
        .limit(50)
      rows = (data as RawInvitation[] | null) ?? []
    } catch {
      return []
    }
  }

  const db = createAdminClient()

  return Promise.all(
    rows.map(async row => ({
      id: row.id,
      roleCode: row.role_code,
      status: row.status,
      token: row.token,
      expiresAt: row.expires_at,
      invitedEmail: row.invited_email,
      invitedName: row.invited_name,
      teacherAssignments: row.role_code === 'PROFESSEUR'
        ? await enrichTeacherAssignments(
            db,
            schoolId,
            parseTeacherAssignmentsFromMetadata(row.metadata)
          )
        : [],
    }))
  )
}

async function loadInviteFormOptions(
  schoolId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data: yearRaw } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  const activeYearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id

  let classesQuery = supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  if (activeYearId) {
    classesQuery = classesQuery.eq('school_year_id', activeYearId)
  }

  const [classesResult, subjectsResult] = await Promise.all([
    classesQuery,
    supabase
      .from('subjects')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('name'),
  ])

  return {
    inviteClasses: ((classesResult.data ?? []) as Array<{ id: string; name: string }>).map(c => ({
      id: c.id,
      name: c.name,
    })),
    inviteSubjects: ((subjectsResult.data ?? []) as Array<{ id: string; name: string }>).map(s => ({
      id: s.id,
      name: s.name,
    })),
  }
}

export default async function RolesPermissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'staff:read')) {
    redirect('/dashboard')
  }

  const canManage = hasPermission(role, 'staff:invite')
  const schoolId = ctx.school_id

  const [schoolResult, membersResult, invitations, inviteOptions] = await Promise.all([
    supabase.from('schools').select('name').eq('id', schoolId).limit(1),
    supabase
      .from('user_school_roles')
      .select(`
        id, role_code, is_active, created_at, user_id,
        profiles ( id, full_name, email, phone, avatar_url )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    canManage ? loadInvitations(schoolId, supabase) : Promise.resolve([]),
    canManage ? loadInviteFormOptions(schoolId, supabase) : Promise.resolve({
      inviteClasses: [],
      inviteSubjects: [],
    }),
  ])

  const schoolName = (schoolResult.data as Array<{ name: string }> | null)?.[0]?.name ?? 'Mon établissement'

  const members = ((membersResult.data ?? []) as Array<{
    id: string
    role_code: string
    is_active: boolean
    created_at: string
    user_id: string
    profiles: {
      id: string
      full_name: string | null
      email: string | null
      phone: string | null
      avatar_url: string | null
    } | null
  }>).map(m => ({
    id: m.id,
    userId: m.user_id,
    roleCode: m.role_code as UserRole,
    isActive: m.is_active,
    createdAt: m.created_at,
    fullName: m.profiles?.full_name ?? '—',
    email: m.profiles?.email ?? '',
    phone: m.profiles?.phone ?? null,
    isCurrentUser: m.user_id === user.id,
  }))

  const roleCounts = members.reduce((acc, m) => {
    if (m.isActive) {
      acc[m.roleCode] = (acc[m.roleCode] ?? 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const payload: RolesPermissionsPayload = {
    schoolId,
    schoolName,
    appUrl: getPublicAppUrl(),
    currentRole: role,
    currentRoleLabel: ROLE_LABELS[role] ?? role,
    currentUserId: user.id,
    canInvite: hasPermission(role, 'staff:invite'),
    canActivate: hasPermission(role, 'staff:activate'),
    canDeactivate: hasPermission(role, 'staff:deactivate'),
    canRemove: isSchoolFullAuthority(role),
    members,
    roleCounts,
    invitations,
    inviteClasses: inviteOptions.inviteClasses,
    inviteSubjects: inviteOptions.inviteSubjects,
  }

  return (
    <div className="min-w-0 space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Rôles & Permissions"
        description="Matrice des droits, gestion de l'équipe et invitations sécurisées"
      />
      <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Chargement…</div>}>
        <RolesPermissionsClient data={payload} />
      </Suspense>
    </div>
  )
}
