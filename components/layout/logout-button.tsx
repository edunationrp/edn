'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Déconnexion</span>
    </button>
  )
}
