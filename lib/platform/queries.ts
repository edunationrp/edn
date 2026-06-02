import { createAdminClient } from '@/lib/supabase/admin'
import type {
  PlatformAuditLogRow,
  PlatformOrganizationRow,
  PlatformOverview,
  PlatformSchoolRow,
  PlatformUserRow,
} from '@/lib/platform/types'

function emptyOverview(): PlatformOverview {
  return {
    schoolsTotal: 0,
    schoolsActive: 0,
    organizationsTotal: 0,
    organizationsActive: 0,
    usersTotal: 0,
    usersActive: 0,
    studentsTotal: 0,
    studentsActive: 0,
    signupsLast30Days: 0,
    recentSchools: [],
    recentAuditLogs: [],
    schoolsByType: {},
    orgsByPlan: {},
  }
}

function getAdmin() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const admin = getAdmin()
  if (!admin) return emptyOverview()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const since = thirtyDaysAgo.toISOString()

  const [
    schoolsRes,
    orgsRes,
    profilesRes,
    studentsRes,
    recentSchoolsRes,
    recentLogsRes,
    signupsRes,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('schools').select('id, is_active, type, platform_status, created_at'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('organizations').select('id, is_active, plan_code'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('profiles').select('id, is_active, account_status, suspended_until, created_at'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('students').select('id, status'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('schools')
      .select('id, name, city, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('audit_logs')
      .select(`
        id, action, entity_type, entity_id, ip_address, created_at, school_id,
        profiles!audit_logs_actor_id_fkey ( full_name, email ),
        schools ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(8),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since),
  ])

  const schools = (schoolsRes.data ?? []) as Array<{ id: string; is_active: boolean; type: string; platform_status?: string | null }>
  const orgs = (orgsRes.data ?? []) as Array<{ id: string; is_active: boolean; plan_code: string }>
  const profiles = (profilesRes.data ?? []) as Array<{
    id: string
    is_active: boolean
    account_status?: string | null
    suspended_until?: string | null
  }>
  const students = (studentsRes.data ?? []) as Array<{ id: string; status: string }>

  const schoolsByType = schools.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const orgsByPlan = orgs.reduce((acc, o) => {
    acc[o.plan_code] = (acc[o.plan_code] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recentAuditLogs = mapAuditRows(recentLogsRes.data)

  return {
    schoolsTotal: schools.length,
    schoolsActive: schools.filter(s => (s.platform_status ?? (s.is_active ? 'ACTIVE' : 'DISABLED')) === 'ACTIVE').length,
    organizationsTotal: orgs.length,
    organizationsActive: orgs.filter(o => o.is_active).length,
    usersTotal: profiles.length,
    usersActive: profiles.filter(p => {
      const status = p.account_status ?? 'ACTIVE'
      if (!p.is_active) return false
      if (status === 'SUSPENDED_TOTAL') return false
      if (status === 'SUSPENDED_TEMPORARY') {
        if (!p.suspended_until) return false
        return new Date(p.suspended_until).getTime() <= Date.now()
      }
      return true
    }).length,
    studentsTotal: students.length,
    studentsActive: students.filter(s => s.status === 'active').length,
    signupsLast30Days: signupsRes.count ?? 0,
    recentSchools: ((recentSchoolsRes.data ?? []) as Array<{
      id: string
      name: string
      city: string | null
      is_active: boolean
      created_at: string
    }>).map(s => ({
      id: s.id,
      name: s.name,
      city: s.city,
      isActive: s.is_active,
      createdAt: s.created_at,
    })),
    recentAuditLogs,
    schoolsByType,
    orgsByPlan,
  }
}

function mapAuditRows(raw: unknown): PlatformAuditLogRow[] {
  return ((raw ?? []) as Array<{
    id: string
    action: string
    entity_type: string
    entity_id: string | null
    ip_address: unknown
    created_at: string
    school_id: string | null
    profiles: { full_name: string | null; email: string | null } | null
    schools: { name: string } | null
  }>).map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    ipAddress: String(log.ip_address ?? ''),
    createdAt: log.created_at,
    actorName: log.profiles?.full_name ?? 'Système',
    actorEmail: log.profiles?.email ?? '',
    schoolId: log.school_id,
    schoolName: log.schools?.name ?? null,
  }))
}

export async function getPlatformSchools(): Promise<PlatformSchoolRow[]> {
  const admin = getAdmin()
  if (!admin) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolsRaw } = await (admin as any)
    .from('schools')
    .select(`
      id, name, type, city, country, is_active, platform_status, suspended_until, status_reason, organization_id, created_at,
      organizations ( name )
    `)
    .order('created_at', { ascending: false })

  const schools = (schoolsRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    city: string | null
    country: string
    is_active: boolean
    platform_status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | null
    suspended_until: string | null
    status_reason: string | null
    organization_id: string | null
    created_at: string
    organizations: { name: string } | null
  }>

  if (!schools.length) return []

  const schoolIds = schools.map(s => s.id)

  const [studentsRes, rolesRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('students').select('school_id, status').in('school_id', schoolIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('user_school_roles').select('school_id').in('school_id', schoolIds).eq('is_active', true),
  ])

  const studentCounts = new Map<string, number>()
  for (const row of (studentsRes.data ?? []) as Array<{ school_id: string; status: string }>) {
    if (row.status === 'active') {
      studentCounts.set(row.school_id, (studentCounts.get(row.school_id) ?? 0) + 1)
    }
  }

  const staffCounts = new Map<string, number>()
  for (const row of (rolesRes.data ?? []) as Array<{ school_id: string }>) {
    staffCounts.set(row.school_id, (staffCounts.get(row.school_id) ?? 0) + 1)
  }

  return schools.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    city: s.city,
    country: s.country,
    isActive: (s.platform_status ?? (s.is_active ? 'ACTIVE' : 'DISABLED')) === 'ACTIVE',
    platformStatus: (s.platform_status ?? (s.is_active ? 'ACTIVE' : 'DISABLED')) as 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
    suspendedUntil: s.suspended_until,
    statusReason: s.status_reason,
    organizationId: s.organization_id,
    organizationName: s.organizations?.name ?? null,
    studentCount: studentCounts.get(s.id) ?? 0,
    staffCount: staffCounts.get(s.id) ?? 0,
    createdAt: s.created_at,
  }))
}

export async function getPlatformSchoolById(schoolId: string) {
  const admin = getAdmin()
  if (!admin) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolRaw } = await (admin as any)
    .from('schools')
    .select(`
      *,
      organizations ( id, name, plan_code )
    `)
    .eq('id', schoolId)
    .limit(1)

  const school = (schoolRaw as Array<Record<string, unknown>> | null)?.[0]
  if (!school) return null

  const [students, staff, years] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('user_school_roles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('school_years').select('id, name, is_active').eq('school_id', schoolId).order('start_date', { ascending: false }).limit(3),
  ])

  return {
    school,
    stats: {
      students: students.count ?? 0,
      staff: staff.count ?? 0,
    },
    schoolYears: (years.data ?? []) as Array<{ id: string; name: string; is_active: boolean }>,
    leadership: await getPlatformSchoolLeadership(admin, schoolId),
  }
}

export async function getPlatformSchoolLeadership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  schoolId: string,
) {
  const { data: schoolMetaRaw } = await admin
    .from('schools')
    .select('founder_id')
    .eq('id', schoolId)
    .limit(1)

  const founderId =
    (schoolMetaRaw as Array<{ founder_id: string | null }> | null)?.[0]?.founder_id ?? null

  const [leadersRes, staffRes, invitesRes] = await Promise.all([
    admin
      .from('user_school_roles')
      .select(`
        id, user_id, role_code, is_active,
        profiles ( full_name, email )
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .in('role_code', ['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT'])
      .order('role_code'),
    admin
      .from('user_school_roles')
      .select(`
        id, user_id, role_code,
        profiles ( full_name, email )
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .not('role_code', 'in', '("PROVISEUR","FONDATEUR","DIRECTEUR_ADJOINT")')
      .order('role_code'),
    admin
      .from('staff_invitations')
      .select('id, invited_email, invited_name, expires_at, status')
      .eq('school_id', schoolId)
      .eq('role_code', 'PROVISEUR')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false }),
  ])

  const leaders = ((leadersRes.data ?? []) as Array<{
    id: string
    user_id: string
    role_code: string
    profiles: { full_name: string | null; email: string | null } | null
  }>).map(row => ({
    id: row.id,
    userId: row.user_id,
    roleCode: row.role_code,
    fullName: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? null,
    isFounder: founderId === row.user_id,
  }))

  const staffCandidates = ((staffRes.data ?? []) as Array<{
    user_id: string
    role_code: string
    profiles: { full_name: string | null; email: string | null } | null
  }>).map(row => ({
    userId: row.user_id,
    fullName: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? null,
    roleCode: row.role_code,
  }))

  const pendingInvites = ((invitesRes.data ?? []) as Array<{
    id: string
    invited_email: string | null
    invited_name: string | null
    expires_at: string
  }>).map(row => ({
    id: row.id,
    invitedEmail: row.invited_email,
    invitedName: row.invited_name,
    expiresAt: row.expires_at,
  }))

  return {
    leaders,
    staffCandidates,
    pendingInvites,
  }
}

export async function getPlatformOrganizations(): Promise<PlatformOrganizationRow[]> {
  const admin = getAdmin()
  if (!admin) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgsRaw } = await (admin as any)
    .from('organizations')
    .select(`
      id, name, plan_code, max_schools, is_active, created_at,
      profiles!organizations_founder_id_fkey ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  const orgs = (orgsRaw ?? []) as Array<{
    id: string
    name: string
    plan_code: string
    max_schools: number
    is_active: boolean
    created_at: string
    profiles: { full_name: string | null; email: string | null } | null
  }>

  if (!orgs.length) return []

  const orgIds = orgs.map(o => o.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schoolsRaw } = await (admin as any)
    .from('schools')
    .select('organization_id')
    .in('organization_id', orgIds)

  const schoolCounts = new Map<string, number>()
  for (const row of (schoolsRaw ?? []) as Array<{ organization_id: string | null }>) {
    if (row.organization_id) {
      schoolCounts.set(row.organization_id, (schoolCounts.get(row.organization_id) ?? 0) + 1)
    }
  }

  return orgs.map(o => ({
    id: o.id,
    name: o.name,
    planCode: o.plan_code,
    maxSchools: o.max_schools,
    schoolCount: schoolCounts.get(o.id) ?? 0,
    isActive: o.is_active,
    founderName: o.profiles?.full_name ?? null,
    founderEmail: o.profiles?.email ?? null,
    createdAt: o.created_at,
  }))
}

export async function getPlatformUsers(): Promise<PlatformUserRow[]> {
  const admin = getAdmin()
  if (!admin) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profilesRaw } = await (admin as any)
    .from('profiles')
    .select('id, full_name, email, default_role, is_active, account_status, suspended_until, suspension_reason, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const profiles = (profilesRaw ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    default_role: string | null
    is_active: boolean
    account_status: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY' | null
    suspended_until: string | null
    suspension_reason: string | null
    created_at: string
  }>

  if (!profiles.length) return []

  const userIds = profiles.map(p => p.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rolesRaw } = await (admin as any)
    .from('user_school_roles')
    .select('user_id, role_code, school_id')
    .in('user_id', userIds)
    .eq('is_active', true)

  const rolesByUser = new Map<string, { schools: Set<string>; roles: Set<string> }>()
  for (const row of (rolesRaw ?? []) as Array<{ user_id: string; role_code: string; school_id: string }>) {
    const entry = rolesByUser.get(row.user_id) ?? { schools: new Set(), roles: new Set() }
    entry.schools.add(row.school_id)
    entry.roles.add(row.role_code)
    rolesByUser.set(row.user_id, entry)
  }

  return profiles.map(p => {
    const meta = rolesByUser.get(p.id)
    const accountStatus = p.account_status ?? 'ACTIVE'
    const temporaryExpired = accountStatus === 'SUSPENDED_TEMPORARY'
      ? p.suspended_until !== null && new Date(p.suspended_until).getTime() <= Date.now()
      : false

    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      defaultRole: p.default_role,
      isActive: p.is_active && (accountStatus === 'ACTIVE' || temporaryExpired),
      accountStatus,
      suspendedUntil: p.suspended_until,
      suspensionReason: p.suspension_reason,
      schoolCount: meta?.schools.size ?? 0,
      roles: meta ? [...meta.roles] : [],
      createdAt: p.created_at,
    }
  })
}

export async function getPlatformAuditLogs(limit = 100): Promise<PlatformAuditLogRow[]> {
  const admin = getAdmin()
  if (!admin) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('audit_logs')
    .select(`
      id, action, entity_type, entity_id, ip_address, created_at, school_id,
      profiles!audit_logs_actor_id_fkey ( full_name, email ),
      schools ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return mapAuditRows(data)
}
