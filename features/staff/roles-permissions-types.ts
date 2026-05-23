import type { UserRole } from '@/types/roles'

export type StaffMemberRow = {
  id: string
  userId: string
  roleCode: UserRole
  isActive: boolean
  createdAt: string
  fullName: string
  email: string
  phone: string | null
  isCurrentUser: boolean
}

export type InvitationRow = {
  id: string
  roleCode: string
  status: string
  token: string
  expiresAt: string
  invitedEmail: string | null
  invitedName: string | null
}

export type RolesPermissionsPayload = {
  schoolId: string
  schoolName: string
  appUrl: string
  currentRole: UserRole
  currentRoleLabel: string
  currentUserId: string
  canInvite: boolean
  canActivate: boolean
  canDeactivate: boolean
  members: StaffMemberRow[]
  roleCounts: Record<string, number>
  invitations: InvitationRow[]
}
