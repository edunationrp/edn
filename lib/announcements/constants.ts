export const ANNOUNCEMENTS_BUCKET = 'school-announcements'

export type AnnouncementCategory = 'general' | 'event' | 'info' | 'urgent'

export const ANNOUNCEMENT_CATEGORIES: {
  value: AnnouncementCategory
  label: string
}[] = [
  { value: 'general', label: 'Actualité' },
  { value: 'event', label: 'Événement' },
  { value: 'info', label: 'Vie scolaire' },
  { value: 'urgent', label: 'Important' },
]

export const ANNOUNCEMENT_TARGET_OPTIONS = [
  { value: 'all', label: 'Toute l\'école (parents et personnel)' },
  { value: 'parents', label: 'Tous les parents' },
  { value: 'class', label: 'Une classe' },
] as const

export type AnnouncementTargetType = (typeof ANNOUNCEMENT_TARGET_OPTIONS)[number]['value']

export function categoryLabel(category: AnnouncementCategory): string {
  return ANNOUNCEMENT_CATEGORIES.find(c => c.value === category)?.label ?? 'Actualité'
}

export function categoryTone(category: AnnouncementCategory): AnnouncementCategory {
  return category
}
