'use client'

import Link from 'next/link'
import { Bell, ExternalLink, Mail, Menu, PanelLeft, PanelLeftClose } from 'lucide-react'
import { BrandLockupLight } from '@/components/brand/logo'
import { DashboardCommandSearch } from '@/components/layout/dashboard-command-search'
import { cn } from '@/lib/utils'

interface TopbarProps {
  userName?: string
  userTitle?: string
  userInitials?: string
  userRole?: string
  schoolName?: string
  schoolYear?: string
  unreadNotifications?: number
  unreadMessages?: number
  collapsed?: boolean
  onMenuClick?: () => void
  onToggleSidebar?: () => void
}

export function Topbar({
  userName = 'Utilisateur',
  userTitle = '',
  userInitials,
  userRole = 'PROVISEUR',
  schoolName = 'Mon établissement',
  unreadNotifications = 0,
  unreadMessages = 0,
  collapsed = false,
  onMenuClick,
  onToggleSidebar,
}: TopbarProps) {
  const initials =
    userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-20 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3 shadow-sm transition-[left] duration-200 sm:gap-3 sm:px-4',
        collapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'
      )}
    >
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        onClick={onToggleSidebar}
        title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 lg:flex"
      >
        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <Link
        href="/"
        title="Page d'accueil du site"
        className="hidden h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 sm:flex"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Accueil site
      </Link>

      <div className="shrink-0 lg:hidden">
        <BrandLockupLight size="sm" />
      </div>

      <DashboardCommandSearch userRole={userRole} className="min-w-0 md:flex-1" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Link
          href="/"
          title="Page d'accueil"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 sm:hidden"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>

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
