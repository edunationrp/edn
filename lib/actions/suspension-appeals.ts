'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type RpcClient = {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}

export async function submitSuspensionAppeal(message: string, schoolId?: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expirée.' }
  if (!message.trim()) return { error: 'Message requis.' }

  const rpcClient = supabase as unknown as RpcClient
  const { error } = await rpcClient.rpc('submit_my_suspension_appeal', {
    p_message: message.trim(),
    p_school_id: schoolId ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/suspended')
  return { success: true as const }
}
