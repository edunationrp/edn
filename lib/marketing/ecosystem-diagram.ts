import type { LucideIcon } from 'lucide-react'
import { BarChart3, GraduationCap, School, Users, UsersRound } from 'lucide-react'

export type EcosystemNode = {
  id: string
  title: string
  description: string
  color: string
  ring: string
  icon: LucideIcon
  /** Position du libellé par rapport au cercle */
  labelPosition: 'top' | 'bottom'
}

export const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: 'ecoles',
    title: 'Écoles',
    description: 'Gérez votre établissement avec efficacité',
    color: '#EAB308',
    ring: '#CA8A04',
    icon: School,
    labelPosition: 'top',
  },
  {
    id: 'enseignants',
    title: 'Enseignants',
    description: 'Organisez, enseignez et suivez vos classes',
    color: '#F97316',
    ring: '#EA580C',
    icon: UsersRound,
    labelPosition: 'bottom',
  },
  {
    id: 'eleves',
    title: 'Élèves',
    description: 'Apprenez, progressez et restez informés',
    color: '#1B3A6B',
    ring: '#152F58',
    icon: GraduationCap,
    labelPosition: 'top',
  },
  {
    id: 'parents',
    title: 'Parents',
    description: 'Suivez, échangez et accompagnez au quotidien',
    color: '#9333EA',
    ring: '#7E22CE',
    icon: Users,
    labelPosition: 'bottom',
  },
  {
    id: 'administration',
    title: 'Administration',
    description: 'Pilotez, analysez et prenez les bonnes décisions',
    color: '#0EA5E9',
    ring: '#0284C7',
    icon: BarChart3,
    labelPosition: 'top',
  },
]

export const ECOSYSTEM_ACCENT_BAR = ECOSYSTEM_NODES.map(node => node.color)

/** Points du parcours (viewBox 1000×380) — alternance bas / haut */
export const ECOSYSTEM_PATH_POINTS = [
  { x: 90, y: 268 },
  { x: 265, y: 112 },
  { x: 500, y: 268 },
  { x: 735, y: 112 },
  { x: 910, y: 268 },
] as const

export function buildEcosystemPath() {
  const [p0, p1, p2, p3, p4] = ECOSYSTEM_PATH_POINTS
  return [
    `M ${p0.x} ${p0.y}`,
    `C ${p0.x + 70} ${p0.y}, ${p1.x - 70} ${p1.y}, ${p1.x} ${p1.y}`,
    `S ${p2.x - 70} ${p2.y}, ${p2.x} ${p2.y}`,
    `S ${p3.x - 70} ${p3.y}, ${p3.x} ${p3.y}`,
    `S ${p4.x - 70} ${p4.y}, ${p4.x} ${p4.y}`,
  ].join(' ')
}
