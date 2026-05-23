import type { UserRole } from '@/types/roles'

export type SettingsSectionId =
  | 'overview'
  | 'profile'
  | 'security'
  | 'notifications'
  | 'school-identity'
  | 'school-academic'
  | 'school-calendar'
  | 'school-finance'
  | 'organization'
  | 'access-management'
  | 'parent-space'
  | 'teaching'
  | 'shortcuts'
  | 'session'

export type SectionAccess = 'none' | 'view' | 'edit'

export type NotificationTypeKey =
  | 'payment'
  | 'grade'
  | 'attendance'
  | 'announcement'
  | 'message'
  | 'system'

export type NotificationPreferences = {
  email_enabled: boolean
  in_app_enabled: boolean
  types: Record<NotificationTypeKey, boolean>
  digest: 'instant' | 'daily' | 'weekly' | 'none'
}

export type TeachingPreferences = {
  notify_grade_submissions: boolean
  notify_attendance_reminders: boolean
  compact_grade_entry: boolean
}

export type ParentPreferences = {
  simplified_interface: boolean
  notify_sms_fallback: boolean
}

export type UserPreferences = {
  notifications: NotificationPreferences
  teaching?: TeachingPreferences
  parent?: ParentPreferences
  language?: string
}

export type SchoolSettingsData = {
  id: string
  name: string
  structure_name: string | null
  type: string
  address: string | null
  city: string | null
  province: string | null
  country: string
  phone: string | null
  email: string | null
  logo_url: string | null
  motto: string | null
  currency: string
  evaluation_system: string
  main_language: string
  access_level: string
  academic_format: string
  estimated_students: number | null
  is_active: boolean
  organization_id: string | null
}

export type SchoolYearRow = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export type TermRow = {
  id: string
  name: string
  type: string
  start_date: string
  end_date: string
  is_active: boolean
  school_year_id: string
}

export type OrganizationRow = {
  id: string
  name: string
  logo_url: string | null
  plan_code: string
  max_schools: number
}

export type SettingsOverviewStats = {
  students: number
  staff: number
  classes: number
  unreadNotifications: number
}

export type SettingsPagePayload = {
  role: UserRole
  roleLabel: string
  schoolId: string
  schoolName: string
  profile: {
    fullName: string
    email: string
    phone: string
    country: string
    preferredLanguage: string
    avatarUrl: string | null
  }
  preferences: UserPreferences
  school: SchoolSettingsData | null
  schoolYears: SchoolYearRow[]
  terms: TermRow[]
  organization: OrganizationRow | null
  parentProfile: {
    preferredLanguage: string
    literacyLevel: string
  } | null
  stats: SettingsOverviewStats | null
  sections: Array<{
    id: SettingsSectionId
    access: SectionAccess
  }>
}
