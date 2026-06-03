import { createClient } from '@/lib/supabase/server'
import {
  ORG_CHART_BRANCHES,
  resolveOrgChartBranch,
  type OrgChartMember,
  type SchoolOrgChartData,
} from '@/lib/staff/org-chart'
import type { UserRole } from '@/types/roles'

const ALL_ORG_CHART_ROLE_CODES = [
  ...new Set(ORG_CHART_BRANCHES.flatMap(b => b.roleCodes)),
]

type StaffRow = {
  id: string
  user_id: string
  role_code: string
  is_active: boolean
  profiles: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
}

export async function getSchoolOrgChartData(schoolId: string): Promise<SchoolOrgChartData> {
  const supabase = await createClient()

  const [{ data: schoolRaw }, { data: staffRaw }] = await Promise.all([
    supabase.from('schools').select('name, logo_url').eq('id', schoolId).maybeSingle(),
    supabase
      .from('user_school_roles')
      .select(`
        id, user_id, role_code, is_active,
        profiles (full_name, email, phone)
      `)
      .eq('school_id', schoolId)
      .in('role_code', ALL_ORG_CHART_ROLE_CODES)
      .order('created_at', { ascending: true }),
  ])

  const school = schoolRaw as { name: string; logo_url: string | null } | null
  const staffRows = (staffRaw ?? []) as StaffRow[]

  const membersByBranch = new Map<string, OrgChartMember[]>()
  for (const branch of ORG_CHART_BRANCHES) {
    membersByBranch.set(branch.id, [])
  }

  for (const row of staffRows) {
    const branchId = resolveOrgChartBranch(row.role_code as UserRole)
    if (!branchId) continue

    const member: OrgChartMember = {
      id: row.id,
      userId: row.user_id,
      roleCode: row.role_code as UserRole,
      fullName: row.profiles?.full_name?.trim() || '—',
      email: row.profiles?.email ?? null,
      phone: row.profiles?.phone ?? null,
      isActive: row.is_active,
    }

    membersByBranch.get(branchId)?.push(member)
  }

  const branches = ORG_CHART_BRANCHES.map(branch => {
    const members = membersByBranch.get(branch.id) ?? []
    return {
      ...branch,
      members,
      activeCount: members.filter(m => m.isActive).length,
    }
  })

  const totalStaff = staffRows.length
  const totalActive = staffRows.filter(r => r.is_active).length

  return {
    schoolName: school?.name ?? 'Mon établissement',
    schoolLogoUrl: school?.logo_url ?? null,
    branches,
    totalStaff,
    totalActive,
  }
}
