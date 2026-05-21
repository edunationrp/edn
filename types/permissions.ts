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
  FONDATEUR: [
    'schools:read', 'schools:create', 'schools:update',
    'staff:read', 'staff:activate', 'staff:deactivate',
    'students:read', 'parents:read', 'classes:read', 'subjects:read',
    'grades:read_all', 'attendance:read',
    'finance:read', 'report_cards:read',
    'reports:read', 'reports:financial', 'reports:academic',
    'messages:read', 'announcements:read',
  ],
  PROVISEUR: [
    'schools:read', 'schools:update',
    'staff:read', 'staff:invite', 'staff:activate', 'staff:deactivate',
    'students:read', 'students:create', 'students:update', 'students:validate',
    'parents:read', 'parents:validate', 'parents:link_student',
    'classes:read', 'classes:manage',
    'subjects:read', 'subjects:manage',
    'grades:read_all', 'grades:lock', 'grades:validate',
    'attendance:read', 'attendance:manage',
    'discipline:read', 'discipline:manage',
    'timetable:read', 'timetable:manage',
    'finance:read',
    'report_cards:read', 'report_cards:generate', 'report_cards:validate', 'report_cards:publish',
    'messages:read', 'messages:send',
    'announcements:read', 'announcements:create',
    'documents:read', 'documents:generate',
    'reports:read', 'reports:financial', 'reports:academic',
    'audit_logs:read', 'admin:school',
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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}
