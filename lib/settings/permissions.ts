import type { UserRole } from '@/types/roles'
import { ADMIN_ROLES } from '@/types/roles'
import type { SectionAccess, SettingsSectionId } from './types'

const SECTION_LABELS: Record<SettingsSectionId, string> = {
  overview: 'Vue d\'ensemble',
  profile: 'Mon profil',
  security: 'Sécurité',
  notifications: 'Alertes',
  'school-identity': 'Établissement',
  'school-academic': 'Pédagogie',
  'school-calendar': 'Calendrier',
  'school-finance': 'Finance',
  organization: 'Organisation',
  'access-management': 'Accès & personnel',
  'parent-space': 'Espace parent',
  teaching: 'Enseignement',
  shortcuts: 'Raccourcis',
  session: 'Session',
}

const FULL_SCHOOL_ROLES: UserRole[] = ['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION']

function isFullSchoolAdmin(role: UserRole) {
  return FULL_SCHOOL_ROLES.includes(role)
}

/** Matrice d'accès Paramètres — le Proviseur (et Fondateur) ont les droits complets établissement. */
export function getSectionAccess(role: UserRole, section: SettingsSectionId): SectionAccess {
  switch (section) {
    case 'overview':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (['CENSEUR', 'INTENDANT', 'SECRETAIRE', 'CONSEILLER', 'VIE_SCOLAIRE'].includes(role)) return 'view'
      return 'none'

    case 'profile':
    case 'security':
    case 'notifications':
    case 'session':
      return 'edit'

    case 'school-identity':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (['CENSEUR', 'INTENDANT', 'SECRETAIRE'].includes(role)) return 'view'
      return 'none'

    case 'school-academic':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (['CENSEUR', 'CONSEILLER'].includes(role)) return 'view'
      return 'none'

    case 'school-calendar':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (['CENSEUR', 'SECRETAIRE'].includes(role)) return 'view'
      return 'none'

    case 'school-finance':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (role === 'INTENDANT') return 'edit'
      if (role === 'SECRETAIRE') return 'view'
      return 'none'

    case 'organization':
      if (isFullSchoolAdmin(role)) return 'edit'
      return 'none'

    case 'access-management':
      if (isFullSchoolAdmin(role)) return 'edit'
      if (role === 'SECRETAIRE') return 'view'
      return 'none'

    case 'parent-space':
      if (role === 'PARENT' || role === 'PARENT_ILLETRE') return 'edit'
      return 'none'

    case 'teaching':
      if (role === 'PROFESSEUR') return 'edit'
      if (isFullSchoolAdmin(role)) return 'edit'
      if (ADMIN_ROLES.includes(role)) return 'view'
      return 'none'

    case 'shortcuts':
      if (role === 'ELEVE') return 'none'
      return 'view'

    default:
      return 'none'
  }
}

export function getVisibleSections(role: UserRole): Array<{ id: SettingsSectionId; access: SectionAccess; label: string }> {
  const order: SettingsSectionId[] = [
    'overview',
    'profile',
    'security',
    'notifications',
    'school-identity',
    'school-academic',
    'school-calendar',
    'school-finance',
    'organization',
    'access-management',
    'parent-space',
    'teaching',
    'shortcuts',
    'session',
  ]

  return order
    .map(id => ({
      id,
      access: getSectionAccess(role, id),
      label: SECTION_LABELS[id],
    }))
    .filter(s => s.access !== 'none')
}

export function canEditSection(role: UserRole, section: SettingsSectionId) {
  return getSectionAccess(role, section) === 'edit'
}

export { SECTION_LABELS }
