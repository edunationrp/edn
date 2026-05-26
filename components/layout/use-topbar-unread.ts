'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isMessagingNotificationType } from '@/lib/notifications/categories'

type TopbarUnreadCounts = {
  messages: number
  notifications: number
}

export function useTopbarUnreadCounts(
  initial: TopbarUnreadCounts,
  userId: string
) {
  const [counts, setCounts] = useState(initial)

  useEffect(() => {
    setCounts(initial)
  }, [initial.messages, initial.notifications])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    async function refreshMessageCount() {
      const { data } = await supabase.rpc('get_my_unread_chat_count')
      if (typeof data === 'number') {
        setCounts(prev => ({ ...prev, messages: data }))
      }
    }

    const chatChannel = supabase
      .channel(`topbar-unread-chat:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const row = payload.new as { sender_id?: string }
          if (row.sender_id && row.sender_id !== userId) void refreshMessageCount()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participant_state', filter: `user_id=eq.${userId}` },
        () => {
          void refreshMessageCount()
        }
      )
      .subscribe()

    const notifChannel = supabase
      .channel(`topbar-unread-notif:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as { type?: string; is_read?: boolean }
          if (row.type && !isMessagingNotificationType(row.type) && !row.is_read) {
            setCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as { type?: string; is_read?: boolean }
          if (row.type && !isMessagingNotificationType(row.type) && row.is_read) {
            setCounts(prev => ({
              ...prev,
              notifications: Math.max(0, prev.notifications - 1),
            }))
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(chatChannel)
      void supabase.removeChannel(notifChannel)
    }
  }, [userId])

  return counts
}
