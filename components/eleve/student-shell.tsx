'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLockupDark, LogoSVG } from '@/components/brand/logo'
import { LogOut, Menu, ChevronDown } from 'lucide-react'
import { WatermarkBackground } from '@/components/schools/watermark-background'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home, BookOpen, FileText, UserX, Calendar, Settings, GraduationCap, Sparkles,
} from 'lucide-react'
import {
  StudentNotificationBell,
  StudentNotificationsPanel,
  type StudentNotificationItem,
} from '@/features/eleve/student-notifications-panel'

const NAV_ITEMS = [
  { href: '/eleve', label: 'Accueil', icon: Home, exact: true },
  { href: '/eleve/notes', label: 'Mes notes', icon: BookOpen },
  { href: '/eleve/bulletins', label: 'Bulletins', icon: FileText },
  { href: '/eleve/absences', label: 'Absences', icon: UserX },
  { href: '/eleve/cours', label: 'Cours', icon: GraduationCap },
  { href: '/eleve/tuteur', label: 'EduBot', icon: Sparkles },
  { href: '/eleve/emploi-du-temps', label: 'Emploi du temps', icon: Calendar },
  { href: '/eleve/parametres', label: 'Paramètres', icon: Settings },
]

const PAGE_TITLES: Record<string, string> = {
  '/eleve': 'Accueil',
  '/eleve/notes': 'Mes notes',
  '/eleve/bulletins': 'Bulletins',
  '/eleve/absences': 'Absences',
  '/eleve/cours': 'Cours',
  '/eleve/tuteur': 'EduBot',
  '/eleve/emploi-du-temps': 'Emploi du temps',
  '/eleve/parametres': 'Paramètres',
  '/eleve/notifications': 'Notifications',
}

type StudentShellProps = {
  children: React.ReactNode
  userId: string
  studentName: string
  iun: string
  className: string | null
  schoolName: string
  schoolYear: string | null
  schoolLogoUrl?: string | null
  schoolWatermarkOpacity?: number | null
  notifications?: StudentNotificationItem[]
  unreadNotifications?: number
}

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.keys(PAGE_TITLES)
    .filter(key => key !== '/eleve')
    .find(key => pathname.startsWith(`${key}/`))
  return match ? PAGE_TITLES[match] : 'Mon espace'
}

export function StudentShell({
  children,
  userId,
  studentName,
  iun,
  className,
  schoolName,
  schoolYear,
  schoolLogoUrl,
  schoolWatermarkOpacity,
  notifications = [],
  unreadNotifications = 0,
}: StudentShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [liveUnread, setLiveUnread] = useState(unreadNotifications)

  const initials = studentName
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
    router.push('/login/eleve')
  }

  function sidebarContent(collapsed = false) {
    return (
      <>
        <div className={cn('flex-shrink-0 border-b border-white/10', collapsed ? 'px-2 py-4' : 'px-5 pt-5 pb-4')}>
          <Link
            href="/eleve"
            title="EduNation"
            className={cn('rounded-xl transition-opacity hover:opacity-90', collapsed && 'flex justify-center p-1')}
            onClick={() => setMobileOpen(false)}
          >
            {collapsed ? (
              <div className="rounded-xl bg-white/15 p-2">
                <LogoSVG width={26} height={26} />
              </div>
            ) : (
              <BrandLockupDark />
            )}
          </Link>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#7AB832]/40 bg-[#7AB832]/20">
              {schoolLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schoolLogoUrl} alt="" className="h-full w-full object-contain p-0.5" />
              ) : (
                <span className="text-xs font-black text-[#7AB832]">
                  {schoolName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold leading-tight text-white">{schoolName}</div>
              <div className="text-[10px] leading-tight text-white/50">
                {schoolYear ? `Année ${schoolYear}` : 'Année scolaire'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40" />
          </div>
        )}

        <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed && (
            <div className="select-none px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
              Mon espace
            </div>
          )}
          {NAV_ITEMS.map(item => {
            const active = isNavActive(pathname, item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2',
                  active
                    ? 'bg-[#7AB832] text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4', active ? 'text-white' : 'text-white/60')} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={cn('flex-shrink-0 space-y-1 border-t border-white/10', collapsed ? 'p-2' : 'p-3')}>
          <div
            className={cn(
              'flex items-center rounded-lg',
              collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2 py-2',
            )}
            title={collapsed ? studentName : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold leading-tight text-white">{studentName}</div>
                <div className="truncate text-[10px] leading-tight text-white/40">
                  {className ? `${className} · ${iun}` : iun}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'flex w-full items-center rounded-lg text-xs font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400',
              collapsed ? 'justify-center px-2 py-2' : 'gap-2 px-3 py-1.5',
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>Déconnexion</span>}
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
        {sidebarContent(false)}
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
          <StudentNotificationBell
            unreadCount={liveUnread}
            onClick={() => setNotifOpen(true)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{pageTitle}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {className ? `${className} · ${studentName}` : studentName}
            </p>
          </div>
        </header>

        <StudentNotificationsPanel
          open={notifOpen}
          onOpenChange={setNotifOpen}
          userId={userId}
          initialNotifications={notifications}
          initialUnreadCount={unreadNotifications}
          onUnreadChange={setLiveUnread}
        />

        <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-5 lg:px-8 lg:py-7">
          <WatermarkBackground logoUrl={schoolLogoUrl} opacity={schoolWatermarkOpacity} />
          <div className="relative z-[1] mx-auto w-full min-w-0 max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
