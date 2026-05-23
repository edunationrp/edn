export type SiteImage = {
  src: string
  alt: string
}

/** Images présentes dans public/images/ — source unique pour la bannière */
export const SITE_IMAGES: SiteImage[] = [
  { src: '/images/eleves.jpeg', alt: 'Élèves en classe au Burkina Faso' },
  { src: '/images/eleve1.jpeg', alt: 'Élève scolarisé avec EduNation' },
  { src: '/images/eleve2.jpeg', alt: 'Élève en activité scolaire' },
]

/** Temps entre deux fondus (pause + transition) */
export const BANNER_INTERVAL_MS = 6500
/** Durée du fondu entrant/sortant */
export const BANNER_TRANSITION_MS = 2800
/** Courbe ultra douce type ease-out premium */
export const BANNER_TRANSITION_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
