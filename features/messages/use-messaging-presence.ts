'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMessagingPresence(schoolId: string, currentUserId: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!schoolId || !currentUserId) {
      setOnlineUserIds(new Set())
      return
    }

    const supabase = createClient()
    const channel = supabase.channel(`messaging:online:${schoolId}`, {
      config: { presence: { key: currentUserId } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ user_id?: string }>()
      const ids = new Set<string>()
      for (const presences of Object.values(state)) {
        for (const presence of presences) {
          if (presence.user_id) ids.add(presence.user_id)
        }
      }
      setOnlineUserIds(ids)
    })

    void channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() })
      }
    })

    return () => {
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [schoolId, currentUserId])

  function isUserOnline(userId: string) {
    return onlineUserIds.has(userId)
  }

  return { onlineUserIds, isUserOnline }
}
