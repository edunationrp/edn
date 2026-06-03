import type { UserRole } from '@/types/roles'

export type OrgChartBranchId =
  | 'PROVISEUR'
  | 'CENSEUR'
  | 'PROFESSEUR'
  | 'VIE_SCOLAIRE'
  | 'SECRETAIRE'
  | 'INTENDANT'
  | 'CONSEILLER'

export type OrgChartBranchDef = {
  id: OrgChartBranchId
  label: string
  roleCodes: UserRole[]
  color: string
  lightBg: string
  lightBorder: string
  missions: string[]
}

/** Branches affichées sur l'organigramme radial (staff uniquement, sans élèves). */
export const ORG_CHART_BRANCHES: OrgChartBranchDef[] = [
  {
    id: 'PROVISEUR',
    label: 'Proviseur',
    roleCodes: ['PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR'],
    color: '#1B3A6B',
    lightBg: '#EEF3FA',
    lightBorder: '#C5D4EB',
    missions: [
      'Pilotage et stratégie',
      'Gestion administrative',
      'Représentation de l\'établissement',
    ],
  },
  {
    id: 'CENSEUR',
    label: 'Censeur',
    roleCodes: ['CENSEUR'],
    color: '#15803D',
    lightBg: '#ECFDF3',
    lightBorder: '#BBF7D0',
    missions: [
      'Organisation de la vie scolaire',
      'Suivi de la discipline et du règlement',
      'Gestion des emplois du temps',
      'Suivi des absences et retards',
      'Liaison enseignants et familles',
    ],
  },
  {
    id: 'PROFESSEUR',
    label: 'Enseignants',
    roleCodes: ['PROFESSEUR'],
    color: '#C2410C',
    lightBg: '#FFF7ED',
    lightBorder: '#FED7AA',
    missions: [
      'Enseignement',
      'Suivi pédagogique des élèves',
      'Évaluation',
      'Orientation et conseil',
      'Projets pédagogiques et activités',
    ],
  },
  {
    id: 'VIE_SCOLAIRE',
    label: 'Vie scolaire',
    roleCodes: ['VIE_SCOLAIRE', 'SURVEILLANT_GENERAL'],
    color: '#A16207',
    lightBg: '#FEFCE8',
    lightBorder: '#FEF08A',
    missions: [
      'Accueil et suivi des élèves',
      'Gestion des déplacements et sorties',
      'Surveillance et encadrement',
      'Médiation et écoute',
      'Animation de la vie collégienne / lycéenne',
    ],
  },
  {
    id: 'SECRETAIRE',
    label: 'Secrétaire',
    roleCodes: ['SECRETAIRE'],
    color: '#7E22CE',
    lightBg: '#FAF5FF',
    lightBorder: '#E9D5FF',
    missions: [
      'Accueil et information',
      'Gestion des documents',
      'Suivi administratif des élèves',
      'Gestion financière et budgétaire',
      'Communication écoles, familles, administration',
    ],
  },
  {
    id: 'INTENDANT',
    label: 'Intendant',
    roleCodes: ['INTENDANT'],
    color: '#0E7490',
    lightBg: '#ECFEFF',
    lightBorder: '#A5F3FC',
    missions: [
      'Gestion financière',
      'Suivi des frais scolaires',
      'Budget et fournisseurs',
      'Reçus et pièces comptables',
    ],
  },
  {
    id: 'CONSEILLER',
    label: 'Conseiller',
    roleCodes: ['CONSEILLER', 'CONSEILLER_EDUCATION'],
    color: '#0891B2',
    lightBg: '#ECFEFF',
    lightBorder: '#BAE6FD',
    missions: [
      'Suivi des élèves en difficulté',
      'Orientation et fiches conseil',
      'Préparation des conseils de classe',
      'Liaison pédagogique',
    ],
  },
]

const BRANCH_BY_ROLE = new Map<UserRole, OrgChartBranchId>()

for (const branch of ORG_CHART_BRANCHES) {
  for (const roleCode of branch.roleCodes) {
    BRANCH_BY_ROLE.set(roleCode, branch.id)
  }
}

export function resolveOrgChartBranch(roleCode: UserRole): OrgChartBranchId | null {
  return BRANCH_BY_ROLE.get(roleCode) ?? null
}

export function getOrgChartBranch(id: OrgChartBranchId): OrgChartBranchDef {
  const branch = ORG_CHART_BRANCHES.find(b => b.id === id)
  if (!branch) throw new Error(`Unknown org chart branch: ${id}`)
  return branch
}

export type OrgChartMember = {
  id: string
  userId: string
  roleCode: UserRole
  fullName: string
  email: string | null
  phone: string | null
  isActive: boolean
}

export type OrgChartBranchData = OrgChartBranchDef & {
  members: OrgChartMember[]
  activeCount: number
}

export type SchoolOrgChartData = {
  schoolName: string
  schoolLogoUrl: string | null
  branches: OrgChartBranchData[]
  totalStaff: number
  totalActive: number
}
