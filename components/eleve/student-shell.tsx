'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, BookOpen, FileText, UserX, Calendar, Settings, GraduationCap, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/eleve', label: 'Accueil', icon: Home, exact: true },
  { href: '/eleve/notes', label: 'Mes notes', icon: BookOpen },
  { href: '/eleve/bulletins', label: 'Bulletins', icon: FileText },
  { href: '/eleve/absences', label: 'Absences', icon: UserX },
  { href: '/eleve/cours', label: 'Cours', icon: GraduationCap },
  { href: '/eleve/emploi-du-temps', label: 'Emploi du temps', icon: Calendar },
  { href: '/eleve/parametres', label: 'Paramètres', icon: Settings },
]

type StudentShellProps = {
  children: React.ReactNode
  studentName: string
  iun: string
  className: string | null
  schoolName: string
  schoolYear: string | null
}

export function StudentShell({
  children,
  studentName,
  iun,
  className,
  schoolName,
  schoolYear,
}: StudentShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login/eleve')
  }

  return (
    <div className="flex min-h-dvh bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-white lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <GraduationCap className="h-5 w-5 text-[#1B3A6B]" />
          <span className="text-sm font-bold text-[#1B3A6B]">EduNation</span>
        </div>

        <div className="border-b px-4 py-3">
          <p className="truncate text-sm font-semibold text-gray-900">{studentName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{iun}</p>
          {className && (
            <span className="mt-1 inline-block rounded bg-[#1B3A6B]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#1B3A6B]">
              {className}
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-[#1B3A6B] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t px-2 py-3">
          <p className="truncate px-3 text-[10px] text-muted-foreground">{schoolName}</p>
          {schoolYear && (
            <p className="truncate px-3 text-[10px] text-muted-foreground">A.S. {schoolYear}</p>
          )}
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white lg:hidden">
        <nav className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.slice(0, 5).map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors',
                  active ? 'text-[#1B3A6B]' : 'text-gray-500'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'fill-[#1B3A6B]/10')} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-12 items-center border-b bg-white px-4 lg:hidden">
          <GraduationCap className="mr-2 h-4 w-4 text-[#1B3A6B]" />
          <span className="text-sm font-bold text-[#1B3A6B]">EduNation</span>
          <span className="ml-auto text-xs text-muted-foreground">{iun}</span>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
