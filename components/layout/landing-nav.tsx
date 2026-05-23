'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  LogIn,
  Newspaper,
  School,
  Sparkles,
  X,
} from 'lucide-react'
import { LogoSVG } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  {
    href: '/cours-sujets',
    label: 'Cours & Sujets gratuits',
    description: 'PDF cours, examens, devoirs & TD',
    icon: BookOpen,
    isPage: true,
  },
  {
    href: '/actualites',
    label: 'Actualités',
    description: 'Éducation, événements & nouveautés',
    icon: Newspaper,
    isPage: true,
  },
  {
    href: '/etablissements',
    label: 'Établissements',
    description: 'Écoles connectées au Burkina',
    icon: Building2,
    isPage: true,
  },
  {
    href: '/#fonctionnalites',
    label: 'Fonctionnalités',
    description: 'Notes, bulletins, finances & plus',
    icon: Sparkles,
    isPage: false,
  },
] as const

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative flex h-5 w-6 flex-col items-center justify-center">
      <motion.span
        animate={open ? { rotate: 45, y: 0, width: 22 } : { rotate: 0, y: -6, width: 22 }}
        className="absolute h-0.5 rounded-full bg-current"
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        className="absolute h-0.5 w-[18px] rounded-full bg-current"
        transition={{ duration: 0.18 }}
      />
      <motion.span
        animate={open ? { rotate: -45, y: 0, width: 22 } : { rotate: 0, y: 6, width: 14 }}
        className="absolute h-0.5 rounded-full bg-current origin-center"
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const close = useCallback(() => setOpen(false), [])

  const isLinkActive = (href: string) => {
    if (href.startsWith('/#')) {
      return pathname === '/'
    }
    return pathname === href
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  return (
    <>
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl supports-backdrop-filter:bg-white/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <div className="flex items-center justify-center rounded-xl bg-[#1B3A6B] p-1.5 shadow-sm transition-transform group-hover:scale-105">
              <LogoSVG width={26} height={26} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#1B3A6B]">
              Edu<span className="text-[#7AB832]">Nation</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="landing-menu"
            onClick={() => setOpen(current => !current)}
            className={cn(
              'relative z-60 flex h-11 items-center justify-center gap-2.5 rounded-2xl border px-3.5 transition-all sm:px-4',
              open
                ? 'border-[#1B3A6B]/15 bg-[#1B3A6B] text-white shadow-lg shadow-[#1B3A6B]/20'
                : 'border-gray-200 bg-white text-[#1B3A6B] shadow-sm hover:border-[#1a4d2e]/20 hover:bg-gray-50'
            )}
          >
            <BurgerIcon open={open} />
            <span className="hidden text-sm font-semibold sm:inline">{open ? 'Fermer' : 'Menu'}</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-[#0f2447]/45 backdrop-blur-md"
            />

            <motion.aside
              id="landing-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 right-0 z-55 flex w-[min(100vw,420px)] flex-col overflow-hidden border-l border-white/10 bg-white shadow-2xl shadow-[#1B3A6B]/20"
            >
              <div className="relative shrink-0 overflow-hidden bg-linear-to-br from-[#0f2447] via-[#1B3A6B] to-[#24508f] px-4 py-3.5 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#7AB832]/20 blur-2xl" />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">
                      <GraduationCap className="h-3 w-3 text-[#7AB832]" />
                      Burkina Faso
                    </div>
                    <p className="text-lg font-extrabold leading-tight tracking-tight">
                      Former les leaders{' '}
                      <span className="text-[#7AB832]">de demain</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Fermer"
                    onClick={close}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-3 py-3 sm:px-4">
                <div className="space-y-1.5">
                  {NAV_LINKS.map((link, index) => {
                    const Icon = link.icon
                    const active = isLinkActive(link.href)
                    const className = cn(
                      'group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition active:scale-[0.98]',
                      active
                        ? 'border-[#7AB832]/40 bg-[#f0f9e8]/80'
                        : 'border-gray-100 bg-gray-50/70 hover:border-[#7AB832]/30 hover:bg-[#f0f9e8]/60'
                    )
                    const inner = (
                      <>
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 transition',
                            active
                              ? 'bg-[#1a4d2e] text-white ring-[#1a4d2e]/20'
                              : 'bg-white text-[#1B3A6B] ring-gray-100 group-hover:text-[#1a4d2e]'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold leading-tight text-gray-900">{link.label}</div>
                          <div className="truncate text-[11px] leading-tight text-gray-500">{link.description}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#7AB832]" />
                      </>
                    )

                    return link.isPage ? (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + index * 0.05, duration: 0.28 }}
                      >
                        <Link href={link.href} onClick={close} className={className}>
                          {inner}
                        </Link>
                      </motion.div>
                    ) : (
                      <motion.a
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + index * 0.05, duration: 0.28 }}
                        className={className}
                      >
                        {inner}
                      </motion.a>
                    )
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.28 }}
                  className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#7AB832]/20 bg-[#f0f9e8]/60 px-2.5 py-2"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a4d2e] text-white">
                    <School className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[11px] leading-snug text-gray-700">
                    <span className="font-semibold text-gray-900">Essai gratuit 14 jours</span>
                    {' '}— inscrivez votre établissement.
                  </p>
                </motion.div>
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#1a4d2e]/20 hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Connexion
                  </Link>
                  <Link
                    href="/register/school"
                    onClick={close}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1a4d2e] px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-[#1a4d2e]/20 transition hover:bg-[#2d6a4f] active:scale-[0.98]"
                  >
                    Inscrire
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
