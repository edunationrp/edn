/** Types de notifications gérés par la messagerie (badge enveloppe, pas la cloche). */
export const MESSAGING_NOTIFICATION_TYPES = ['message', 'chat'] as const

export type MessagingNotificationType = (typeof MESSAGING_NOTIFICATION_TYPES)[number]

export function isMessagingNotificationType(type: string) {
  return (MESSAGING_NOTIFICATION_TYPES as readonly string[]).includes(type)
}

type FilterableQuery<T> = {
  neq: (column: string, value: string) => T
}

export function excludeMessagingNotificationTypes<T extends FilterableQuery<T>>(query: T): T {
  let next = query
  for (const type of MESSAGING_NOTIFICATION_TYPES) {
    next = next.neq('type', type)
  }
  return next
}
