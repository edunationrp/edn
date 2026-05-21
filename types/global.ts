import type { UserRole } from './roles'

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  default_role: UserRole | null
  is_active: boolean
}

export interface SchoolContext {
  id: string
  name: string
  type: string
  logo_url: string | null
  city: string | null
  is_active: boolean
}

export interface ActiveSchoolYear {
  id: string
  name: string
  start_date: string
  end_date: string
}

export interface AppContext {
  user: UserProfile
  activeSchool: SchoolContext | null
  activeSchoolYear: ActiveSchoolYear | null
  currentRole: UserRole | null
  schools: SchoolContext[]
}

export interface KPICard {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal'
}

export interface SidebarItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
  children?: SidebarItem[]
  badge?: number
}

export type StudentStatus = 'pending' | 'active' | 'rejected' | 'transferred' | 'inactive'
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
export type ReportCardStatus = 'draft' | 'generated' | 'validated' | 'published' | 'archived'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'sick' | 'excused'
export type AssessmentType = 'devoir' | 'interrogation' | 'composition' | 'examen'

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
