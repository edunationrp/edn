export type ResourceType = 'cours' | 'sujet' | 'devoir' | 'td' | 'corrige'

export type ResourceSubject =
  | 'mathematiques'
  | 'physique'
  | 'svt'
  | 'francais'
  | 'anglais'
  | 'histoire-geo'
  | 'philosophie'
  | 'eps'

export type ResourceLevel =
  | '6eme'
  | '5eme'
  | '4eme'
  | '3eme'
  | 'seconde'
  | 'premiere'
  | 'terminale'
  | 'bepc'
  | 'bac'

export type StudyResource = {
  slug: string
  title: string
  description: string
  type: ResourceType
  typeLabel: string
  subject: ResourceSubject
  subjectLabel: string
  level: ResourceLevel
  levelLabel: string
  year: string
  pages: number
  fileSize: string
  fileName: string
  downloads: number
  featured?: boolean
  accent: string
  emoji: string
  tags: string[]
}

export const RESOURCE_TYPES = [
  { id: 'all', label: 'Tous' },
  { id: 'cours', label: 'Cours' },
  { id: 'sujet', label: "Sujets d'examen" },
  { id: 'devoir', label: 'Devoirs' },
  { id: 'td', label: 'TD' },
  { id: 'corrige', label: 'Corrigés' },
] as const

export const RESOURCE_LEVELS = [
  { id: 'all', label: 'Tous niveaux' },
  { id: '6eme', label: '6ème' },
  { id: '5eme', label: '5ème' },
  { id: '4eme', label: '4ème' },
  { id: '3eme', label: '3ème' },
  { id: 'seconde', label: 'Seconde' },
  { id: 'premiere', label: 'Première' },
  { id: 'terminale', label: 'Terminale' },
  { id: 'bepc', label: 'BEPC' },
  { id: 'bac', label: 'BAC' },
] as const

export const RESOURCE_SUBJECTS = [
  { id: 'all', label: 'Toutes matières' },
  { id: 'mathematiques', label: 'Mathématiques' },
  { id: 'physique', label: 'Physique-Chimie' },
  { id: 'svt', label: 'SVT' },
  { id: 'francais', label: 'Français' },
  { id: 'anglais', label: 'Anglais' },
  { id: 'histoire-geo', label: 'Histoire-Géo' },
  { id: 'philosophie', label: 'Philosophie' },
  { id: 'eps', label: 'EPS' },
] as const

export const STUDY_RESOURCES: StudyResource[] = [
  {
    slug: 'cours-trigonometrie-3eme',
    title: 'Cours complet — Trigonométrie (3ème)',
    description:
      'Définitions, formules essentielles, exercices guidés et fiches mémo pour le brevet des collèges.',
    type: 'cours',
    typeLabel: 'Cours',
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: '3eme',
    levelLabel: '3ème',
    year: '2025-2026',
    pages: 24,
    fileSize: '1,8 Mo',
    fileName: 'cours-trigonometrie-3eme.pdf',
    downloads: 2840,
    featured: true,
    accent: 'from-[#1B3A6B] to-[#24508f]',
    emoji: '📐',
    tags: ['BEPC', 'Formules', 'Exercices'],
  },
  {
    slug: 'sujet-bepc-maths-2024',
    title: "Sujet BEPC — Mathématiques session 2024",
    description: "Épreuve officielle type BEPC avec barème et durée d'examen (4 h).",
    type: 'sujet',
    typeLabel: "Sujet d'examen",
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: 'bepc',
    levelLabel: 'BEPC',
    year: '2024',
    pages: 6,
    fileSize: '420 Ko',
    fileName: 'sujet-bepc-maths-2024.pdf',
    downloads: 5120,
    accent: 'from-[#1a4d2e] to-[#2d6a4f]',
    emoji: '📝',
    tags: ['Officiel', 'Session 2024'],
  },
  {
    slug: 'corrige-bepc-maths-2024',
    title: 'Corrigé détaillé — BEPC Mathématiques 2024',
    description: 'Correction pas à pas avec méthodes et astuces pour chaque exercice.',
    type: 'corrige',
    typeLabel: 'Corrigé',
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: 'bepc',
    levelLabel: 'BEPC',
    year: '2024',
    pages: 12,
    fileSize: '980 Ko',
    fileName: 'corrige-bepc-maths-2024.pdf',
    downloads: 3890,
    accent: 'from-[#0f766e] to-[#115e59]',
    emoji: '✅',
    tags: ['Corrigé', 'Méthodes'],
  },
  {
    slug: 'cours-physique-electricite-4eme',
    title: 'Cours — Électricité et circuits (4ème)',
    description: 'Loi d\'Ohm, schémas électriques, mesures et applications concrètes.',
    type: 'cours',
    typeLabel: 'Cours',
    subject: 'physique',
    subjectLabel: 'Physique-Chimie',
    level: '4eme',
    levelLabel: '4ème',
    year: '2025-2026',
    pages: 18,
    fileSize: '2,1 Mo',
    fileName: 'cours-electricite-4eme.pdf',
    downloads: 1650,
    accent: 'from-[#7c3aed] to-[#6d28d9]',
    emoji: '⚡',
    tags: ['Schémas', 'Loi d\'Ohm'],
  },
  {
    slug: 'devoir-francais-redaction-3eme',
    title: 'Devoir surveillé — Rédaction & orthographe (3ème)',
    description: 'Sujet de rédaction, dictée et questions de grammaire — durée 2 h.',
    type: 'devoir',
    typeLabel: 'Devoir',
    subject: 'francais',
    subjectLabel: 'Français',
    level: '3eme',
    levelLabel: '3ème',
    year: '2025-2026',
    pages: 4,
    fileSize: '310 Ko',
    fileName: 'devoir-francais-3eme.pdf',
    downloads: 920,
    accent: 'from-[#be185d] to-[#9d174d]',
    emoji: '📖',
    tags: ['Rédaction', 'Dictée'],
  },
  {
    slug: 'td-maths-equations-2nd-degre',
    title: 'TD — Équations du second degré (Première C)',
    description: 'Série de 15 exercices progressifs avec discriminant et factorisation.',
    type: 'td',
    typeLabel: 'TD',
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: 'premiere',
    levelLabel: 'Première',
    year: '2025-2026',
    pages: 8,
    fileSize: '540 Ko',
    fileName: 'td-equations-second-degre.pdf',
    downloads: 1340,
    accent: 'from-[#1B3A6B] to-[#1a4d2e]',
    emoji: '🔢',
    tags: ['Exercices', 'Première C'],
  },
  {
    slug: 'sujet-bac-philo-2023',
    title: 'Sujet BAC — Philosophie session 2023',
    description: 'Épreuve écrite philosophie série D — sujet complet avec consignes.',
    type: 'sujet',
    typeLabel: "Sujet d'examen",
    subject: 'philosophie',
    subjectLabel: 'Philosophie',
    level: 'bac',
    levelLabel: 'BAC',
    year: '2023',
    pages: 3,
    fileSize: '280 Ko',
    fileName: 'sujet-bac-philo-2023.pdf',
    downloads: 2100,
    accent: 'from-[#b45309] to-[#d97706]',
    emoji: '🎓',
    tags: ['Série D', 'Session 2023'],
  },
  {
    slug: 'cours-svt-reproduction-3eme',
    title: 'Cours — Reproduction humaine (3ème SVT)',
    description: 'Schémas annotés, vocabulaire et QCM de révision pour le brevet.',
    type: 'cours',
    typeLabel: 'Cours',
    subject: 'svt',
    subjectLabel: 'SVT',
    level: '3eme',
    levelLabel: '3ème',
    year: '2025-2026',
    pages: 16,
    fileSize: '3,2 Mo',
    fileName: 'cours-svt-reproduction-3eme.pdf',
    downloads: 1780,
    accent: 'from-[#059669] to-[#047857]',
    emoji: '🧬',
    tags: ['Schémas', 'QCM'],
  },
  {
    slug: 'devoir-anglais-composition-seconde',
    title: 'Devoir — Composition anglaise (Seconde)',
    description: 'Rédaction en anglais sur le thème « Education and society » — 1 h 30.',
    type: 'devoir',
    typeLabel: 'Devoir',
    subject: 'anglais',
    subjectLabel: 'Anglais',
    level: 'seconde',
    levelLabel: 'Seconde',
    year: '2025-2026',
    pages: 3,
    fileSize: '250 Ko',
    fileName: 'devoir-anglais-seconde.pdf',
    downloads: 640,
    accent: 'from-[#0891b2] to-[#0e7490]',
    emoji: '🇬🇧',
    tags: ['Rédaction', 'Seconde'],
  },
  {
    slug: 'sujet-bepc-histoire-geo-2024',
    title: 'Sujet BEPC — Histoire-Géographie 2024',
    description: 'Cartes, documents et questions de synthèse — épreuve complète.',
    type: 'sujet',
    typeLabel: "Sujet d'examen",
    subject: 'histoire-geo',
    subjectLabel: 'Histoire-Géo',
    level: 'bepc',
    levelLabel: 'BEPC',
    year: '2024',
    pages: 8,
    fileSize: '1,1 Mo',
    fileName: 'sujet-bepc-histoire-geo-2024.pdf',
    downloads: 2450,
    accent: 'from-[#ea580c] to-[#c2410c]',
    emoji: '🗺️',
    tags: ['Cartes', 'Documents'],
  },
  {
    slug: 'cours-maths-fractions-6eme',
    title: 'Cours — Fractions et nombres décimaux (6ème)',
    description: 'Opérations, comparaisons et problèmes contextualisés pour débutants.',
    type: 'cours',
    typeLabel: 'Cours',
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: '6eme',
    levelLabel: '6ème',
    year: '2025-2026',
    pages: 14,
    fileSize: '1,4 Mo',
    fileName: 'cours-fractions-6eme.pdf',
    downloads: 1980,
    accent: 'from-[#1a4d2e] to-[#7AB832]',
    emoji: '➗',
    tags: ['Bases', '6ème'],
  },
  {
    slug: 'td-physique-mecanique-terminale',
    title: 'TD — Mécanique du point (Terminale D)',
    description: 'Cinématique, dynamique et travail-énergie — 12 exercices corrigés.',
    type: 'td',
    typeLabel: 'TD',
    subject: 'physique',
    subjectLabel: 'Physique-Chimie',
    level: 'terminale',
    levelLabel: 'Terminale',
    year: '2025-2026',
    pages: 10,
    fileSize: '720 Ko',
    fileName: 'td-mecanique-terminale.pdf',
    downloads: 890,
    accent: 'from-[#4338ca] to-[#3730a3]',
    emoji: '🎯',
    tags: ['Terminale D', 'Mécanique'],
  },
  {
    slug: 'sujet-bac-maths-2024',
    title: 'Sujet BAC — Mathématiques série C 2024',
    description: 'Épreuve complète avec exercices d\'analyse, probabilités et géométrie.',
    type: 'sujet',
    typeLabel: "Sujet d'examen",
    subject: 'mathematiques',
    subjectLabel: 'Mathématiques',
    level: 'bac',
    levelLabel: 'BAC',
    year: '2024',
    pages: 7,
    fileSize: '480 Ko',
    fileName: 'sujet-bac-maths-2024.pdf',
    downloads: 4200,
    accent: 'from-[#1B3A6B] to-[#0f2447]',
    emoji: '📊',
    tags: ['Série C', 'Session 2024'],
  },
  {
    slug: 'devoir-eps-volleyball-5eme',
    title: 'Devoir — Évaluation EPS Volleyball (5ème)',
    description: 'Grille d\'évaluation technique et tactique + consignes pour les élèves.',
    type: 'devoir',
    typeLabel: 'Devoir',
    subject: 'eps',
    subjectLabel: 'EPS',
    level: '5eme',
    levelLabel: '5ème',
    year: '2025-2026',
    pages: 2,
    fileSize: '180 Ko',
    fileName: 'devoir-eps-volleyball-5eme.pdf',
    downloads: 420,
    accent: 'from-[#dc2626] to-[#b91c1c]',
    emoji: '🏐',
    tags: ['Volleyball', 'Grille'],
  },
  {
    slug: 'cours-francais-figure-style-1ere',
    title: 'Cours — Figures de style (Première A)',
    description: 'Métaphore, comparaison, anaphore… définitions, exemples et exercices.',
    type: 'cours',
    typeLabel: 'Cours',
    subject: 'francais',
    subjectLabel: 'Français',
    level: 'premiere',
    levelLabel: 'Première',
    year: '2025-2026',
    pages: 20,
    fileSize: '1,6 Mo',
    fileName: 'cours-figures-style-1ere.pdf',
    downloads: 1120,
    accent: 'from-[#be185d] to-[#831843]',
    emoji: '✍️',
    tags: ['Littérature', 'Première A'],
  },
]

export function getResourceBySlug(slug: string): StudyResource | undefined {
  return STUDY_RESOURCES.find(resource => resource.slug === slug)
}

export function getResourceDownloadUrl(slug: string): string {
  return `/api/resources/${slug}/download`
}

export function getResourcePreviewUrl(slug: string): string {
  return `/api/resources/${slug}/download?inline=1`
}
