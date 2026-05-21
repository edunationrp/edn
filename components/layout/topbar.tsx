import Link from 'next/link'
import { Bell, Mail, Search, ChevronDown, Globe } from 'lucide-react'
import { BrandLockupLight } from '@/components/brand/logo'

interface TopbarProps {
  userName?: string
  userTitle?: string
  userInitials?: string
  schoolName?: string
  schoolYear?: string
  unreadNotifications?: number
  unreadMessages?: number
}

export function Topbar({
  userName = 'Utilisateur',
  userTitle = '',
  userInitials,
  schoolName = 'Mon établissement',
  schoolYear = '2025-2026',
  unreadNotifications = 0,
  unreadMessages = 0,
}: TopbarProps) {
  const initials = userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="fixed top-0 right-0 left-[240px] z-20 h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-5 shadow-sm">
      {/* Search */}
      <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-200 hover:border-gray-300 transition-colors max-w-lg cursor-text">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400 flex-1">Rechercher un élève, un professeur, une classe…</span>
        <kbd className="text-[10px] font-mono bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded border border-gray-300 leading-none">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Langue */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium">
          <Globe className="h-4 w-4 text-gray-400" />
          <span>FR</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>

        {/* Notifications */}
        <Link href="/dashboard/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          <Bell className="h-4.5 w-4.5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </Link>

        {/* Messages */}
        <Link href="/dashboard/messages" className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          <Mail className="h-4.5 w-4.5" />
          {unreadMessages > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7AB832] rounded-full ring-2 ring-white" />
          )}
        </Link>

        {/* Séparateur */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Utilisateur */}
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-gray-800 leading-tight">
              {userName.split(' ').slice(0, 2).join(' ')}
            </div>
            <div className="text-[10px] text-gray-500 leading-tight truncate max-w-[140px]">
              {userTitle} · {schoolName}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  )
}
