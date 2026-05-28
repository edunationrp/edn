'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLockupDark, LogoSVG } from '@/components/brand/logo'
import { LogOut, Menu } from 'lucide-react'
import { WatermarkBackground } from '@/components/schools/watermark-background'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home,
  BookOpen,
  FileText,
  UserX,
  CreditCard,
  Users,
  Megaphone,
  Mail,
} from 'lucide-react'
import { ChildSwitcher } from '@/components/parent/child-switcher'
import type { ParentChildSummary } from '@/lib/parent/parent-context'
import {
  ParentNotificationBell,
  ParentNotificationsPanel,
  type ParentNotificationItem,
} from '@/features/parent/parent-notifications-panel'

const NAV_ITEMS = [
  { href: '/parent', label: 'Accueil', icon: Home, exact: true },
  { href: '/parent/communications', label: 'Communications', icon: Megaphone },
  { href: '/parent/messages', label: 'Messagerie', icon: Mail },
  { href: '/parent/notes', label: 'Notes', icon: BookOpen },
  { href: '/parent/bulletins', label: 'Bulletins', icon: FileText },
  { href: '/parent/absences', label: 'Absences', icon: UserX },
  { href: '/parent/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/parent/enfants', label: 'Mes enfants', icon: Users },
]

const PAGE_TITLES: Record<string, string> = {
  '/parent': 'Accueil',
  '/parent/communications': 'Communications',
  '/parent/messages': 'Messagerie',
  '/parent/notes': 'Notes',
  '/parent/bulletins': 'Bulletins',
  '/parent/absences': 'Absences',
  '/parent/paiements': 'Paiements',
  '/parent/enfants': 'Mes enfants',
  '/parent/notifications': 'Notifications',
}

type ParentShellProps = {
  children: React.ReactNode
  userId: string
  parentName: string
  parentChildren: ParentChildSummary[]
  activeChild: ParentChildSummary | null
  notifications?: ParentNotificationItem[]
  unreadNotifications?: number
}

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function getPageTitle(pathname: string) {
  return PAGE_TITLES[pathname] ?? 'Espace parent'
}

export function ParentShell({
  children,
  userId,
  parentName,
  parentChildren,
  activeChild,
  notifications = [],
  unreadNotifications = 0,
}: ParentShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [liveUnread, setLiveUnread] = useState(unreadNotifications)

  const initials = parentName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    setLiveUnread(unreadNotifications)
  }, [unreadNotifications])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login/parent')
  }

  function sidebarContent() {
    return (
      <>
        <div className="flex-shrink-0 border-b border-white/10 px-5 pt-5 pb-4">
          <Link
            href="/parent"
            title="EduNation Parent"
            className="rounded-xl transition-opacity hover:opacity-90"
            onClick={() => setMobileOpen(false)}
          >
            <BrandLockupDark />
          </Link>
        </div>

        <div className="mx-3 mt-3 mb-1">
          <ChildSwitcher linkedChildren={parentChildren} activeChild={activeChild} />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          <div className="select-none px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
            Suivi scolarité
          </div>
          {NAV_ITEMS.map(item => {
            const active = isNavActive(pathname, item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#7AB832] text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-white/60')} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex-shrink-0 space-y-1 border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold leading-tight text-white">{parentName}</div>
              <div className="truncate text-[10px] leading-tight text-white/40">Compte parent</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-[#F0F4F8]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[min(88vw,280px)] flex-col overflow-y-auto bg-[#1B3A6B] text-white shadow-xl transition-transform duration-200 lg:w-[240px] lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent()}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-[100dvh] min-w-0 w-full flex-1 flex-col lg:ml-[240px]">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)] backdrop-blur-md sm:px-4">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <ParentNotificationBell
            unreadCount={liveUnread}
            onClick={() => setNotifOpen(true)}
          />
          <div className="min-w-0 flex-1 lg:hidden">
            <ChildSwitcher linkedChildren={parentChildren} activeChild={activeChild} compact />
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-semibold text-gray-900">{pageTitle}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {activeChild
                ? `${activeChild.fullName} · ${activeChild.schoolName}`
                : 'Aucun enfant sélectionné'}
            </p>
          </div>
          <div className="hidden shrink-0 lg:flex">
            <div className="rounded-lg bg-[#1B3A6B]/5 px-2.5 py-1">
              <LogoSVG width={22} height={22} />
            </div>
          </div>
        </header>

        <ParentNotificationsPanel
          open={notifOpen}
          onOpenChange={setNotifOpen}
          userId={userId}
          initialNotifications={notifications}
          initialUnreadCount={unreadNotifications}
          onUnreadChange={setLiveUnread}
        />

        <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-5 lg:px-8 lg:py-7">
          <WatermarkBackground
            logoUrl={activeChild?.schoolLogoUrl}
            opacity={activeChild?.schoolWatermarkOpacity}
          />
          <div className="relative z-[1] mx-auto w-full min-w-0 max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
