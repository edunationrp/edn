'use client'

import Link from 'next/link'
import { Bell, ExternalLink, Mail, Menu, PanelLeft, PanelLeftClose } from 'lucide-react'
import { BrandLockupLight, LogoSVG } from '@/components/brand/logo'
import { DashboardCommandSearch } from '@/components/layout/dashboard-command-search'
import { QaVerificationExitButton } from '@/components/layout/qa-verification-exit-button'
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
  qaVerificationActive?: boolean
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
  qaVerificationActive = false,
}: TopbarProps) {
  const initials =
    userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-2 shadow-[0_1px_3px_rgba(15,23,42,0.06)] backdrop-blur-md transition-[left] duration-200 sm:gap-3 sm:px-4 md:px-5',
        collapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'
      )}
    >
      {/* Gauche : menu + logo compact */}
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
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
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:border-[#7AB832]/30 hover:bg-white sm:flex"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Accueil site
        </Link>

        <Link
          href="/"
          title="EduNation"
          className="flex shrink-0 items-center rounded-lg p-1 transition hover:bg-gray-100 sm:hidden"
        >
          <LogoSVG width={24} height={24} />
        </Link>

        <div className="hidden shrink-0 sm:block lg:hidden">
          <BrandLockupLight size="sm" />
        </div>
      </div>

      {/* Centre : recherche desktop */}
      <DashboardCommandSearch userRole={userRole} className="hidden min-w-0 flex-1 md:block" />

      {/* Droite : actions — jamais compressées */}
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        {qaVerificationActive && (
          <QaVerificationExitButton className="hidden sm:inline-flex" />
        )}
        {qaVerificationActive && (
          <QaVerificationExitButton compact className="sm:hidden" />
        )}

        <DashboardCommandSearch userRole={userRole} className="md:hidden" />

        <Link
          href="/dashboard/notifications"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>

        <Link
          href="/dashboard/messages"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          aria-label="Messages"
        >
          <Mail className="h-[18px] w-[18px]" />
          {unreadMessages > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#7AB832] ring-2 ring-white" />
          )}
        </Link>

        <Link
          href="/dashboard/settings"
          className="hidden shrink-0 items-center gap-2.5 rounded-xl px-2 py-1 transition hover:bg-slate-50 sm:flex"
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
