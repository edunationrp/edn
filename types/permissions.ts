export type Permission =
  // Établissements
  | 'schools:read'
  | 'schools:create'
  | 'schools:update'
  | 'schools:delete'
  // Personnel
  | 'staff:read'
  | 'staff:invite'
  | 'staff:activate'
  | 'staff:deactivate'
  // Élèves
  | 'students:read'
  | 'students:create'
  | 'students:update'
  | 'students:validate'
  | 'students:delete'
  // Parents
  | 'parents:read'
  | 'parents:validate'
  | 'parents:link_student'
  // Classes
  | 'classes:read'
  | 'classes:manage'
  // Matières
  | 'subjects:read'
  | 'subjects:manage'
  // Notes
  | 'grades:read_own'
  | 'grades:read_class'
  | 'grades:read_all'
  | 'grades:create'
  | 'grades:update'
  | 'grades:lock'
  | 'grades:validate'
  // Absences
  | 'attendance:read'
  | 'attendance:create'
  | 'attendance:justify'
  | 'attendance:manage'
  // Discipline
  | 'discipline:read'
  | 'discipline:manage'
  // Emplois du temps
  | 'timetable:read'
  | 'timetable:manage'
  // Finance
  | 'finance:read'
  | 'finance:manage'
  | 'finance:receipts'
  // Bulletins
  | 'report_cards:read'
  | 'report_cards:generate'
  | 'report_cards:validate'
  | 'report_cards:publish'
  // Communication
  | 'messages:read'
  | 'messages:send'
  | 'announcements:read'
  | 'announcements:create'
  // Documents
  | 'documents:read'
  | 'documents:generate'
  // Rapports
  | 'reports:read'
  | 'reports:financial'
  | 'reports:academic'
  // Audit
  | 'audit_logs:read'
  // Administration
  | 'admin:platform'
  | 'admin:school'

import type { UserRole } from './roles'
import { normalizeRole } from './roles'

/** Réservé à la super-administration EduNation (multi-établissements). */
const PLATFORM_ONLY_PERMISSIONS: Permission[] = ['admin:platform']

/** Proviseur et fondateur : contrôle total de leur établissement. */
export const SCHOOL_FULL_AUTHORITY_ROLES: UserRole[] = ['PROVISEUR', 'FONDATEUR']

export function isSchoolFullAuthority(role: string): boolean {
  return SCHOOL_FULL_AUTHORITY_ROLES.includes(role as UserRole)
}

/** Toutes les permissions applicables à un établissement (hors plateforme). */
export const ALL_SCHOOL_PERMISSIONS: Permission[] = [
  'schools:read', 'schools:create', 'schools:update', 'schools:delete',
  'staff:read', 'staff:invite', 'staff:activate', 'staff:deactivate',
  'students:read', 'students:create', 'students:update', 'students:validate', 'students:delete',
  'parents:read', 'parents:validate', 'parents:link_student',
  'classes:read', 'classes:manage',
  'subjects:read', 'subjects:manage',
  'grades:read_own', 'grades:read_class', 'grades:read_all',
  'grades:create', 'grades:update', 'grades:lock', 'grades:validate',
  'attendance:read', 'attendance:create', 'attendance:justify', 'attendance:manage',
  'discipline:read', 'discipline:manage',
  'timetable:read', 'timetable:manage',
  'finance:read', 'finance:manage', 'finance:receipts',
  'report_cards:read', 'report_cards:generate', 'report_cards:validate', 'report_cards:publish',
  'messages:read', 'messages:send',
  'announcements:read', 'announcements:create',
  'documents:read', 'documents:generate',
  'reports:read', 'reports:financial', 'reports:academic',
  'audit_logs:read', 'admin:school',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN_EDUNATION: [
    'schools:read', 'schools:create', 'schools:update', 'schools:delete',
    'staff:read', 'staff:invite', 'staff:activate', 'staff:deactivate',
    'students:read', 'parents:read', 'classes:read', 'subjects:read',
    'grades:read_all', 'attendance:read', 'discipline:read',
    'timetable:read', 'finance:read', 'report_cards:read',
    'messages:read', 'announcements:read', 'documents:read',
    'reports:read', 'reports:financial', 'reports:academic',
    'audit_logs:read', 'admin:platform', 'admin:school',
  ],
  PROVISEUR: [...ALL_SCHOOL_PERMISSIONS],
  FONDATEUR: [...ALL_SCHOOL_PERMISSIONS],
  DIRECTEUR_ADJOINT: [
    'schools:read',
    'staff:read', 'staff:invite', 'staff:activate', 'staff:deactivate',
    'students:read', 'students:create', 'students:update', 'students:validate',
    'parents:read', 'parents:validate',
    'classes:read', 'classes:manage',
    'subjects:read',
    'grades:read_all', 'grades:validate',
    'attendance:read', 'attendance:manage',
    'report_cards:read', 'report_cards:validate',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read', 'reports:academic',
  ],
  CENSEUR: [
    'students:read',
    'classes:read',
    'subjects:read',
    'grades:read_all',
    'attendance:read', 'attendance:manage',
    'discipline:read', 'discipline:manage',
    'timetable:read', 'timetable:manage',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read', 'reports:academic',
  ],
  CONSEILLER: [
    'students:read',
    'classes:read',
    'grades:read_all',
    'attendance:read',
    'discipline:read',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read', 'reports:academic',
  ],
  CONSEILLER_EDUCATION: [
    'students:read',
    'classes:read',
    'grades:read_all',
    'attendance:read',
    'discipline:read',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read', 'reports:academic',
  ],
  INTENDANT: [
    'students:read',
    'parents:read',
    'finance:read', 'finance:manage', 'finance:receipts',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read', 'reports:financial',
  ],
  SECRETAIRE: [
    'students:read', 'students:create', 'students:update', 'students:validate',
    'parents:read', 'parents:validate', 'parents:link_student',
    'staff:read', 'staff:invite',
    'classes:read',
    'finance:read', 'finance:receipts',
    'report_cards:read', 'report_cards:generate',
    'documents:read', 'documents:generate',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read',
  ],
  VIE_SCOLAIRE: [
    'students:read',
    'classes:read',
    'attendance:read', 'attendance:manage', 'attendance:justify',
    'discipline:read',
    'timetable:read',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read',
  ],
  SURVEILLANT_GENERAL: [
    'students:read',
    'classes:read',
    'attendance:read', 'attendance:manage', 'attendance:justify',
    'discipline:read',
    'timetable:read',
    'messages:read', 'messages:send',
    'announcements:read',
    'reports:read',
  ],
  PROFESSEUR: [
    'students:read',
    'classes:read',
    'subjects:read',
    'grades:read_own', 'grades:create', 'grades:update',
    'attendance:read', 'attendance:create',
    'timetable:read',
    'report_cards:read',
    'messages:read', 'messages:send',
    'announcements:read',
  ],
  PARENT: [
    'students:read',
    'grades:read_own',
    'attendance:read', 'attendance:justify',
    'finance:read',
    'report_cards:read',
    'messages:read', 'messages:send',
    'announcements:read',
  ],
  ELEVE: [
    'grades:read_own',
    'attendance:read',
    'report_cards:read',
    'timetable:read',
    'messages:read',
    'announcements:read',
  ],
  PARENT_ILLETRE: [
    'grades:read_own',
    'attendance:read',
    'finance:read',
    'report_cards:read',
    'messages:read', 'messages:send',
    'announcements:read',
  ],
}

export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const rawRole = role as UserRole
  if (isSchoolFullAuthority(rawRole)) {
    return !PLATFORM_ONLY_PERMISSIONS.includes(permission)
  }

  const normalized = normalizeRole(role)
  if (isSchoolFullAuthority(normalized)) {
    return !PLATFORM_ONLY_PERMISSIONS.includes(permission)
  }

  const effectiveRole = ROLE_PERMISSIONS[normalized] ? normalized : rawRole
  return ROLE_PERMISSIONS[effectiveRole]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}
