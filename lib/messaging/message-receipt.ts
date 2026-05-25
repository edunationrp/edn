export type MessageReceiptStatus = 'sent' | 'delivered' | 'read'

export function getMessageReceiptStatus(
  messageCreatedAt: string,
  otherLastReadAt: string | null,
  otherUserOnline: boolean
): MessageReceiptStatus {
  if (!otherUserOnline) return 'sent'
  if (otherLastReadAt && new Date(otherLastReadAt) >= new Date(messageCreatedAt)) {
    return 'read'
  }
  return 'delivered'
}
