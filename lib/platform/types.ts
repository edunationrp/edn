export type PlatformSchoolRow = {
  id: string
  name: string
  type: string
  city: string | null
  country: string
  isActive: boolean
  organizationId: string | null
  organizationName: string | null
  studentCount: number
  staffCount: number
  createdAt: string
}

export type PlatformOrganizationRow = {
  id: string
  name: string
  planCode: string
  maxSchools: number
  schoolCount: number
  isActive: boolean
  founderName: string | null
  founderEmail: string | null
  createdAt: string
}

export type PlatformUserRow = {
  id: string
  fullName: string | null
  email: string | null
  defaultRole: string | null
  isActive: boolean
  schoolCount: number
  roles: string[]
  createdAt: string
}

export type PlatformAuditLogRow = {
  id: string
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string
  createdAt: string
  actorName: string
  actorEmail: string
  schoolId: string | null
  schoolName: string | null
}

export type PlatformOverview = {
  schoolsTotal: number
  schoolsActive: number
  organizationsTotal: number
  organizationsActive: number
  usersTotal: number
  usersActive: number
  studentsTotal: number
  studentsActive: number
  signupsLast30Days: number
  recentSchools: Array<{
    id: string
    name: string
    city: string | null
    isActive: boolean
    createdAt: string
  }>
  recentAuditLogs: PlatformAuditLogRow[]
  schoolsByType: Record<string, number>
  orgsByPlan: Record<string, number>
}
