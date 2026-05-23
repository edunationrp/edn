'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
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
      title={collapsed ? 'Déconnexion' : undefined}
      className={`flex w-full items-center rounded-lg text-xs font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400 ${
        collapsed ? 'justify-center px-2 py-2' : 'gap-2 px-3 py-1.5'
      }`}
    >
      <LogOut className="h-3.5 w-3.5" />
      {!collapsed && <span>Déconnexion</span>}
    </button>
  )
}
