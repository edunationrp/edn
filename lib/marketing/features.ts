import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  GraduationCap,
  Shield,
  Smartphone,
  Users,
  ClipboardList,
} from 'lucide-react'

export type FeatureModule = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  accent: string
  iconBg: string
  tag: string
  highlights: string[]
  preview: 'grades' | 'students' | 'finance' | 'attendance' | 'dashboard' | 'messages'
  size: 'large' | 'medium'
}

export const FEATURE_MODULES: FeatureModule[] = [
  {
    id: 'notes',
    title: 'Notes & bulletins',
    description:
      'Saisie par classe et matière, calcul automatique des moyennes, bulletins PDF avec QR code vérifiable.',
    icon: BookOpen,
    accent: 'from-[#1B3A6B] to-[#24508f]',
    iconBg: 'bg-blue-100 text-blue-700',
    tag: 'Pédagogie',
    highlights: ['Sur 10 ou sur 20', 'Trimestres & séquences', 'Export PDF instantané'],
    preview: 'grades',
    size: 'medium',
  },
  {
    id: 'eleves',
    title: 'Dossiers élèves',
    description: 'Inscriptions, IUN, historique scolaire et validation parentale en un clic.',
    icon: GraduationCap,
    accent: 'from-[#1a4d2e] to-[#2d6a4f]',
    iconBg: 'bg-green-100 text-green-700',
    tag: 'Administration',
    highlights: ['Fiche complète', 'Photo & contacts', 'Par classe'],
    preview: 'students',
    size: 'medium',
  },
  {
    id: 'finance',
    title: 'Finances scolaires',
    description: 'Frais de scolarité, encaissements, reçus officiels et suivi des arriérés.',
    icon: CreditCard,
    accent: 'from-[#b45309] to-[#d97706]',
    iconBg: 'bg-amber-100 text-amber-800',
    tag: 'Finance',
    highlights: ['Reçus PDF', 'XOF / FCFA', 'Rappels automatiques'],
    preview: 'finance',
    size: 'medium',
  },
  {
    id: 'presence',
    title: 'Présences & vie scolaire',
    description: 'Appel en classe, suivi des absences et retards, avec alertes automatiques aux parents.',
    icon: ClipboardList,
    accent: 'from-[#7c3aed] to-[#6d28d9]',
    iconBg: 'bg-purple-100 text-purple-700',
    tag: 'Vie scolaire',
    highlights: ['Appel rapide', 'Alertes parents', 'Historique'],
    preview: 'attendance',
    size: 'medium',
  },
  {
    id: 'dashboard',
    title: 'Tableau de bord direction',
    description: 'Vue consolidée : effectifs, résultats, finances et alertes pour le proviseur.',
    icon: BarChart3,
    accent: 'from-[#0f766e] to-[#115e59]',
    iconBg: 'bg-teal-100 text-teal-800',
    tag: 'Pilotage',
    highlights: ['KPIs temps réel', 'Par établissement', 'Export rapports'],
    preview: 'dashboard',
    size: 'medium',
  },
  {
    id: 'messages',
    title: 'Communication parents',
    description: 'SMS, notifications et messagerie — les familles restent informées au quotidien.',
    icon: Bell,
    accent: 'from-[#be185d] to-[#9d174d]',
    iconBg: 'bg-rose-100 text-rose-700',
    tag: 'Communication',
    highlights: ['Push & email', 'Français + langues locales', 'Historique'],
    preview: 'messages',
    size: 'medium',
  },
]

export const FEATURE_TRUST_ITEMS = [
  { icon: Shield, label: 'Données isolées par établissement' },
  { icon: Users, label: 'Accès par rôle (direction, prof, parent)' },
  { icon: Smartphone, label: 'Utilisable sur mobile & tablette' },
]
