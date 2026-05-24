import type { Permission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { ROLE_PERMISSIONS, hasPermission } from '@/types/permissions'
import { ROLE_LABELS, ROLE_COLORS, STAFF_ROLES, ADMIN_ROLES } from '@/types/roles'

export type PermissionGroupId =
  | 'school'
  | 'staff'
  | 'students'
  | 'parents'
  | 'classes'
  | 'grades'
  | 'attendance'
  | 'discipline'
  | 'timetable'
  | 'finance'
  | 'report_cards'
  | 'communication'
  | 'documents'
  | 'reports'
  | 'audit'
  | 'admin'

export type PermissionMeta = {
  key: Permission
  label: string
  description: string
}

export type PermissionGroup = {
  id: PermissionGroupId
  label: string
  description: string
  permissions: PermissionMeta[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'school',
    label: 'Établissement',
    description: 'Identité, configuration et paramètres généraux',
    permissions: [
      { key: 'schools:read', label: 'Consulter', description: 'Voir les informations de l\'établissement' },
      { key: 'schools:update', label: 'Modifier', description: 'Mettre à jour nom, contact, logo, paramètres' },
      { key: 'schools:create', label: 'Créer', description: 'Ajouter un nouvel établissement (organisation)' },
      { key: 'schools:delete', label: 'Supprimer', description: 'Supprimer un établissement' },
    ],
  },
  {
    id: 'staff',
    label: 'Personnel & accès',
    description: 'Gestion de l\'équipe et des invitations',
    permissions: [
      { key: 'staff:read', label: 'Consulter', description: 'Voir la liste du personnel et leurs rôles' },
      { key: 'staff:invite', label: 'Inviter', description: 'Envoyer des liens d\'invitation sécurisés' },
      { key: 'staff:activate', label: 'Activer', description: 'Réactiver un compte personnel' },
      { key: 'staff:deactivate', label: 'Désactiver', description: 'Suspendre l\'accès d\'un membre' },
    ],
  },
  {
    id: 'students',
    label: 'Élèves',
    description: 'Inscriptions, dossiers et validations',
    permissions: [
      { key: 'students:read', label: 'Consulter', description: 'Voir les dossiers élèves' },
      { key: 'students:create', label: 'Inscrire', description: 'Créer de nouvelles inscriptions' },
      { key: 'students:update', label: 'Modifier', description: 'Mettre à jour les informations élèves' },
      { key: 'students:validate', label: 'Valider', description: 'Valider les inscriptions en attente' },
      { key: 'students:delete', label: 'Supprimer', description: 'Retirer un dossier élève' },
    ],
  },
  {
    id: 'parents',
    label: 'Parents',
    description: 'Comptes parents et liaisons familiales',
    permissions: [
      { key: 'parents:read', label: 'Consulter', description: 'Voir les comptes parents' },
      { key: 'parents:validate', label: 'Valider', description: 'Valider l\'identité des parents' },
      { key: 'parents:link_student', label: 'Lier un élève', description: 'Associer parent et élève' },
    ],
  },
  {
    id: 'classes',
    label: 'Classes & matières',
    description: 'Structure pédagogique de l\'école',
    permissions: [
      { key: 'classes:read', label: 'Consulter classes', description: 'Voir les classes et niveaux' },
      { key: 'classes:manage', label: 'Gérer classes', description: 'Créer et organiser les classes' },
      { key: 'subjects:read', label: 'Consulter matières', description: 'Voir le catalogue des matières' },
      { key: 'subjects:manage', label: 'Gérer matières', description: 'Ajouter ou modifier les matières' },
    ],
  },
  {
    id: 'grades',
    label: 'Notes & évaluations',
    description: 'Saisie, contrôle et validation des notes',
    permissions: [
      { key: 'grades:read_own', label: 'Ses propres notes', description: 'Notes des classes assignées' },
      { key: 'grades:read_class', label: 'Notes de classe', description: 'Consultation par classe' },
      { key: 'grades:read_all', label: 'Toutes les notes', description: 'Vue globale établissement' },
      { key: 'grades:create', label: 'Saisir', description: 'Créer des évaluations et notes' },
      { key: 'grades:update', label: 'Modifier', description: 'Corriger des notes non verrouillées' },
      { key: 'grades:lock', label: 'Verrouiller', description: 'Bloquer une période de saisie' },
      { key: 'grades:validate', label: 'Valider', description: 'Approuver les notes avant bulletins' },
    ],
  },
  {
    id: 'attendance',
    label: 'Présences & absences',
    description: 'Suivi quotidien et justificatifs',
    permissions: [
      { key: 'attendance:read', label: 'Consulter', description: 'Voir les registres de présence' },
      { key: 'attendance:create', label: 'Enregistrer', description: 'Marquer présences en cours' },
      { key: 'attendance:justify', label: 'Justifier', description: 'Soumettre ou traiter des justificatifs' },
      { key: 'attendance:manage', label: 'Gérer', description: 'Administration complète des absences' },
    ],
  },
  {
    id: 'discipline',
    label: 'Discipline',
    description: 'Incidents et sanctions',
    permissions: [
      { key: 'discipline:read', label: 'Consulter', description: 'Voir les incidents disciplinaires' },
      { key: 'discipline:manage', label: 'Gérer', description: 'Créer et suivre incidents/sanctions' },
    ],
  },
  {
    id: 'timetable',
    label: 'Emploi du temps',
    description: 'Planning des cours',
    permissions: [
      { key: 'timetable:read', label: 'Consulter', description: 'Voir les emplois du temps' },
      { key: 'timetable:manage', label: 'Gérer', description: 'Modifier le planning' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Frais, paiements et reçus',
    permissions: [
      { key: 'finance:read', label: 'Consulter', description: 'Voir les finances et soldes' },
      { key: 'finance:manage', label: 'Gérer', description: 'Enregistrer paiements et grilles' },
      { key: 'finance:receipts', label: 'Reçus', description: 'Générer et imprimer les reçus' },
    ],
  },
  {
    id: 'report_cards',
    label: 'Bulletins',
    description: 'Génération et publication',
    permissions: [
      { key: 'report_cards:read', label: 'Consulter', description: 'Voir les bulletins' },
      { key: 'report_cards:generate', label: 'Générer', description: 'Lancer la génération' },
      { key: 'report_cards:validate', label: 'Valider', description: 'Contrôler avant publication' },
      { key: 'report_cards:publish', label: 'Publier', description: 'Rendre disponibles aux familles' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Messages et annonces',
    permissions: [
      { key: 'messages:read', label: 'Lire messages', description: 'Consulter la messagerie' },
      { key: 'messages:send', label: 'Envoyer messages', description: 'Contacter équipe ou familles' },
      { key: 'announcements:read', label: 'Lire annonces', description: 'Voir les annonces' },
      { key: 'announcements:create', label: 'Publier annonces', description: 'Diffuser une annonce' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Attestations et exports',
    permissions: [
      { key: 'documents:read', label: 'Consulter', description: 'Accéder aux documents' },
      { key: 'documents:generate', label: 'Générer', description: 'Créer attestations et exports' },
    ],
  },
  {
    id: 'reports',
    label: 'Rapports',
    description: 'Analyses et tableaux de bord',
    permissions: [
      { key: 'reports:read', label: 'Rapports généraux', description: 'Statistiques globales' },
      { key: 'reports:financial', label: 'Rapports financiers', description: 'Analyses de recouvrement' },
      { key: 'reports:academic', label: 'Rapports pédagogiques', description: 'Performance académique' },
    ],
  },
  {
    id: 'audit',
    label: 'Audit',
    description: 'Traçabilité des actions sensibles',
    permissions: [
      { key: 'audit_logs:read', label: 'Journaux d\'audit', description: 'Historique des actions admin' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    description: 'Droits système avancés',
    permissions: [
      { key: 'admin:school', label: 'Admin établissement', description: 'Contrôle total de l\'école' },
      { key: 'admin:platform', label: 'Admin plateforme', description: 'Super administration EduNation' },
    ],
  },
]

/** Rôles affichés dans la matrice (directeur voit tout le spectre) */
export const MATRIX_ROLES: UserRole[] = [
  'PROVISEUR',
  'CENSEUR',
  'CONSEILLER',
  'INTENDANT',
  'SECRETAIRE',
  'VIE_SCOLAIRE',
  'PROFESSEUR',
  'PARENT',
  'ELEVE',
]

export const INVITABLE_ROLES = STAFF_ROLES

export const ROLE_DESCRIPTIONS: Partial<Record<UserRole, string>> = {
  PROVISEUR: 'Direction complète : personnel, pédagogie, finances, bulletins et paramètres.',
  CENSEUR: 'Supervision pédagogique, discipline, présences et validation académique.',
  CONSEILLER: 'Suivi des élèves, orientation et accompagnement éducatif.',
  INTENDANT: 'Gestion financière, frais scolaires, paiements et reçus.',
  SECRETAIRE: 'Inscriptions, dossiers élèves/parents, documents administratifs.',
  VIE_SCOLAIRE: 'Présences, absences, discipline et vie quotidienne.',
  PROFESSEUR: 'Saisie des notes et présences pour ses classes assignées.',
  PARENT: 'Suivi des enfants : notes, absences, paiements et messages.',
  ELEVE: 'Consultation personnelle : notes, emploi du temps et bulletins.',
}

export function getAllPermissions(): Permission[] {
  return PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key))
}

export function countRolePermissions(role: UserRole) {
  return getAllPermissions().filter(p => hasPermission(role, p)).length
}

export function getPermissionCoverage(role: UserRole) {
  const total = getAllPermissions().length
  const granted = countRolePermissions(role)
  return { granted, total, percent: total > 0 ? Math.round((granted / total) * 100) : 0 }
}

export function roleHasPermission(role: UserRole, permission: Permission) {
  return hasPermission(role, permission)
}

export { ROLE_LABELS, ROLE_COLORS, ADMIN_ROLES }
