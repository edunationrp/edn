import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// ATTENTION : N'utiliser que côté serveur (API routes, Edge Functions, Server Actions)
// Ne jamais exposer côté client
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variables Supabase admin manquantes')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
