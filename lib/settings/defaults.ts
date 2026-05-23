import type { NotificationPreferences, UserPreferences } from './types'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  in_app_enabled: true,
  types: {
    payment: true,
    grade: true,
    attendance: true,
    announcement: true,
    message: true,
    system: true,
  },
  digest: 'instant',
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
  teaching: {
    notify_grade_submissions: true,
    notify_attendance_reminders: true,
    compact_grade_entry: false,
  },
  parent: {
    simplified_interface: false,
    notify_sms_fallback: false,
  },
  language: 'fr',
}

export function mergeUserPreferences(raw: unknown): UserPreferences {
  const base = structuredClone(DEFAULT_USER_PREFERENCES)
  if (!raw || typeof raw !== 'object') return base

  const data = raw as Partial<UserPreferences>

  if (data.notifications && typeof data.notifications === 'object') {
    base.notifications = {
      ...base.notifications,
      ...data.notifications,
      types: {
        ...base.notifications.types,
        ...(data.notifications.types ?? {}),
      },
    }
  }

  if (data.teaching) {
    base.teaching = { ...base.teaching!, ...data.teaching }
  }

  if (data.parent) {
    base.parent = { ...base.parent!, ...data.parent }
  }

  if (typeof data.language === 'string') {
    base.language = data.language
  }

  return base
}
