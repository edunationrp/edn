export type PlatformSchoolLeaderRow = {
  id: string
  userId: string
  roleCode: string
  fullName: string | null
  email: string | null
  isFounder: boolean
}

export type PlatformSchoolStaffCandidateRow = {
  userId: string
  fullName: string | null
  email: string | null
  roleCode: string
}

export type PlatformPendingProviseurInviteRow = {
  id: string
  invitedEmail: string | null
  invitedName: string | null
  expiresAt: string
}

export type PlatformSchoolRow = {
  id: string
  name: string
  type: string
  city: string | null
  country: string
  isActive: boolean
  platformStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  suspendedUntil: string | null
  statusReason: string | null
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
  accountStatus: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY'
  suspendedUntil: string | null
  suspensionReason: string | null
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

export type PlatformAccessControlUserRow = {
  id: string
  fullName: string | null
  email: string | null
  accountStatus: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY'
  suspendedUntil: string | null
  suspensionReason: string | null
  defaultRole: string | null
}

export type PlatformAccessControlSchoolRow = {
  id: string
  name: string
  city: string | null
  country: string
  platformStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  suspendedUntil: string | null
  statusReason: string | null
}

export type SuspensionAppealRow = {
  id: string
  requesterId: string
  requesterName: string | null
  requesterEmail: string | null
  schoolId: string | null
  schoolName: string | null
  appealScope: 'ACCOUNT' | 'SCHOOL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}
