export type NewsCategory = 'education' | 'plateforme' | 'evenement' | 'temoignage'

export type NewsArticle = {
  slug: string
  title: string
  excerpt: string
  category: NewsCategory
  categoryLabel: string
  date: string
  readTime: string
  featured?: boolean
  imageGradient: string
  emoji: string
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: 'digitalisation-ecoles-burkina',
    title: 'La digitalisation scolaire s\'accélère au Burkina Faso',
    excerpt:
      'De plus en plus d\'établissements adoptent des outils numériques pour moderniser la gestion des élèves, des notes et de la communication avec les parents.',
    category: 'education',
    categoryLabel: 'Éducation',
    date: '2026-05-18',
    readTime: '4 min',
    featured: true,
    imageGradient: 'from-[#1B3A6B] to-[#1a4d2e]',
    emoji: '🌍',
  },
  {
    slug: 'lancement-edunation-2026',
    title: 'EduNation : une plateforme pensée pour les réalités africaines',
    excerpt:
      'Interface multilingue, bulletins PDF avec QR code et communication parents — EduNation répond aux défis concrets des collèges et lycées burkinabè.',
    category: 'plateforme',
    categoryLabel: 'Plateforme',
    date: '2026-05-12',
    readTime: '5 min',
    imageGradient: 'from-[#1a4d2e] to-[#2d6a4f]',
    emoji: '🚀',
  },
  {
    slug: 'parents-connectes',
    title: 'Comment informer les parents en temps réel sur la scolarité',
    excerpt:
      'Absences, notes, messages : les familles restent connectées à la vie scolaire de leurs enfants, même dans les zones à faible connectivité.',
    category: 'education',
    categoryLabel: 'Éducation',
    date: '2026-05-08',
    readTime: '3 min',
    imageGradient: 'from-[#7c3aed] to-[#1B3A6B]',
    emoji: '👨‍👩‍👧',
  },
  {
    slug: 'forum-directeurs-ouaga',
    title: 'Forum des directeurs d\'établissement à Ouagadougou',
    excerpt:
      'Retour sur les échanges autour de la gouvernance scolaire, de la qualité des enseignements et des outils de pilotage numérique.',
    category: 'evenement',
    categoryLabel: 'Événement',
    date: '2026-04-28',
    readTime: '6 min',
    imageGradient: 'from-[#ea580c] to-[#c2410c]',
    emoji: '📅',
  },
  {
    slug: 'temoignage-lycee-horizon',
    title: '« Nos bulletins sont prêts en quelques clics » — Lycée Horizon',
    excerpt:
      'Le proviseur du Lycée Horizon partage son expérience après trois mois d\'utilisation d\'EduNation pour la gestion académique.',
    category: 'temoignage',
    categoryLabel: 'Témoignage',
    date: '2026-04-20',
    readTime: '4 min',
    imageGradient: 'from-[#0891b2] to-[#1B3A6B]',
    emoji: '💬',
  },
  {
    slug: 'securite-donnees-scolaires',
    title: 'Sécurité des données : l\'enjeu numéro un des écoles connectées',
    excerpt:
      'Isolation par établissement, contrôle d\'accès par rôle et traçabilité : pourquoi la protection des données scolaires est non négociable.',
    category: 'plateforme',
    categoryLabel: 'Plateforme',
    date: '2026-04-14',
    readTime: '5 min',
    imageGradient: 'from-[#dc2626] to-[#1B3A6B]',
    emoji: '🔒',
  },
]

export type SchoolType = 'primaire' | 'secondaire' | 'lycee' | 'formation'

export type FeaturedSchool = {
  slug: string
  name: string
  city: string
  region: string
  type: SchoolType
  typeLabel: string
  students: number
  accessLevel: 'public' | 'prive'
  since: string
  highlight: string
  emoji: string
  color: string
}

export const FEATURED_SCHOOLS: FeaturedSchool[] = [
  {
    slug: 'college-saint-jean',
    name: 'Collège Saint-Jean',
    city: 'Ouagadougou',
    region: 'Centre',
    type: 'secondaire',
    typeLabel: 'Secondaire',
    students: 842,
    accessLevel: 'prive',
    since: '2025',
    highlight: 'Bulletins automatisés & suivi parental actif',
    emoji: '🏫',
    color: 'from-[#1B3A6B] to-[#24508f]',
  },
  {
    slug: 'lycee-horizon',
    name: 'Lycée Horizon',
    city: 'Bobo-Dioulasso',
    region: 'Hauts-Bassins',
    type: 'lycee',
    typeLabel: 'Lycée',
    students: 1205,
    accessLevel: 'public',
    since: '2025',
    highlight: 'Pilotage académique en temps réel',
    emoji: '🎓',
    color: 'from-[#1a4d2e] to-[#2d6a4f]',
  },
  {
    slug: 'institut-prive-savoir',
    name: 'Institut Privé Savoir',
    city: 'Koudougou',
    region: 'Centre-Ouest',
    type: 'secondaire',
    typeLabel: 'Secondaire',
    students: 516,
    accessLevel: 'prive',
    since: '2026',
    highlight: 'Gestion financière & reçus numériques',
    emoji: '📚',
    color: 'from-[#7c3aed] to-[#5b21b6]',
  },
  {
    slug: 'ecole-excellence-fada',
    name: 'École Excellence',
    city: 'Fada N\'Gourma',
    region: 'Est',
    type: 'primaire',
    typeLabel: 'Primaire',
    students: 384,
    accessLevel: 'prive',
    since: '2026',
    highlight: 'Interface parents multilingue déployée',
    emoji: '✨',
    color: 'from-[#ea580c] to-[#c2410c]',
  },
  {
    slug: 'complexe-scolaire-gaoua',
    name: 'Complexe Scolaire du Sud',
    city: 'Gaoua',
    region: 'Sud-Ouest',
    type: 'secondaire',
    typeLabel: 'Secondaire',
    students: 628,
    accessLevel: 'public',
    since: '2025',
    highlight: 'Suivi des présences en temps réel',
    emoji: '🌿',
    color: 'from-[#0891b2] to-[#0e7490]',
  },
  {
    slug: 'centre-formation-pro',
    name: 'Centre de Formation Pro',
    city: 'Ouahigouya',
    region: 'Nord',
    type: 'formation',
    typeLabel: 'Formation',
    students: 210,
    accessLevel: 'prive',
    since: '2026',
    highlight: 'Suivi des parcours professionnels',
    emoji: '🛠️',
    color: 'from-[#be185d] to-[#9d174d]',
  },
]

export const SCHOOL_REGIONS = ['Toutes', ...Array.from(new Set(FEATURED_SCHOOLS.map(s => s.region)))]

export const NEWS_CATEGORIES = [
  { id: 'all', label: 'Toutes' },
  { id: 'education', label: 'Éducation' },
  { id: 'plateforme', label: 'Plateforme' },
  { id: 'evenement', label: 'Événements' },
  { id: 'temoignage', label: 'Témoignages' },
] as const
