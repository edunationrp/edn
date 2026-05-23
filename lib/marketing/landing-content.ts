import type { LucideIcon } from 'lucide-react'
import { BarChart3, Clock, Shield, Zap } from 'lucide-react'

export type LandingStat = {
  value: string
  label: string
  icon: LucideIcon
  accent: string
  iconBg: string
}

export const LANDING_STATS: LandingStat[] = [
  {
    value: '+30%',
    label: "d'amélioration du suivi des élèves",
    icon: BarChart3,
    accent: 'text-[#1a4d2e]',
    iconBg: 'bg-[#f0f9e8] text-[#1a4d2e]',
  },
  {
    value: '0',
    label: 'perte de notes ou informations scolaires',
    icon: Shield,
    accent: 'text-[#1B3A6B]',
    iconBg: 'bg-blue-50 text-[#1B3A6B]',
  },
  {
    value: 'Temps réel',
    label: 'pour les résultats et évaluations',
    icon: Zap,
    accent: 'text-[#ea580c]',
    iconBg: 'bg-orange-50 text-orange-700',
  },
  {
    value: '1',
    label: "seul espace pour toute la gestion de l'école",
    icon: Clock,
    accent: 'text-[#7c3aed]',
    iconBg: 'bg-violet-50 text-violet-700',
  },
]

export const LANDING_PROBLEMS = [
  'Gestion manuelle sur papier, erreurs fréquentes',
  'Bulletins imprimés en retard ou perdus',
  'Parents non informés des absences de leurs enfants',
  'Paiements sans reçus officiels, litiges financiers',
  'Données dispersées, aucune vue consolidée',
  'Zones à faible connectivité Internet',
  'Parents illettrés exclus du suivi scolaire',
]

export const LANDING_SOLUTIONS = [
  'Tout numérique : inscriptions, notes, bulletins',
  'Génération automatique des bulletins PDF avec QR code',
  'Notifications SMS et push aux parents en temps réel',
  'Paiements traçables avec reçus PDF officiels',
  'Dashboards consolidés pour la direction',
  'Présences et absences enregistrées en quelques clics',
  'Interface simplifiée pour parents illettrés',
]

export const LANDING_ACCESSIBILITY_FEATURES = [
  '4 gros boutons : Notes, Absences, Messages, Paiements',
  'Lecture audio automatique des messages (TTS navigateur)',
  'Support français, mooré, dioula et fulfuldé',
  'Envoi de messages vocaux depuis le navigateur',
  'Navigation ultra-simple, pas de menus complexes',
]
