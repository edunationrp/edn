'use client'

import Link from 'next/link'
import { Bell, Mail, Menu, Search } from 'lucide-react'
import { BrandLockupLight } from '@/components/brand/logo'

interface TopbarProps {
  userName?: string
  userTitle?: string
  userInitials?: string
  schoolName?: string
  schoolYear?: string
  unreadNotifications?: number
  unreadMessages?: number
  onMenuClick?: () => void
}

export function Topbar({
  userName = 'Utilisateur',
  userTitle = '',
  userInitials,
  schoolName = 'Mon établissement',
  unreadNotifications = 0,
  unreadMessages = 0,
  onMenuClick,
}: TopbarProps) {
  const initials =
    userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3 shadow-sm sm:gap-3 sm:px-4 lg:left-[240px]">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="shrink-0 lg:hidden">
        <BrandLockupLight size="sm" />
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate text-sm text-gray-400">Rechercher…</span>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link
          href="/dashboard/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>

        <Link
          href="/dashboard/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
        >
          <Mail className="h-4.5 w-4.5" />
          {unreadMessages > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#7AB832] ring-2 ring-white" />
          )}
        </Link>

        <Link
          href="/dashboard/settings"
          className="hidden items-center gap-2 rounded-xl px-2 py-1 sm:flex hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="hidden min-w-0 text-left md:block">
            <div className="truncate text-sm font-semibold leading-tight text-gray-800">
              {userName.split(' ').slice(0, 2).join(' ')}
            </div>
            <div className="max-w-[140px] truncate text-[10px] leading-tight text-gray-500">
              {userTitle} · {schoolName}
            </div>
          </div>
        </Link>
      </div>
    </header>
  )
}
