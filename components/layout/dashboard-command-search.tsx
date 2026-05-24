'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { flattenRoleNav } from '@/components/layout/sidebar'
import {
  searchDashboardEntities,
  type DashboardEntityResult,
} from '@/lib/actions/dashboard-search'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'edunation-recent-searches'
const MAX_RECENT = 5

type SearchItem = {
  id: string
  title: string
  subtitle?: string
  href: string
  group: string
  keywords?: string[]
}

type ResultGroup = {
  id: string
  label: string
  items: SearchItem[]
}

const EXTRA_ACTIONS: SearchItem[] = [
  {
    id: 'action-new-student',
    title: 'Inscrire un nouvel élève',
    subtitle: 'Formulaire d\'inscription',
    href: '/dashboard/students/new',
    group: 'Actions rapides',
    keywords: ['inscription', 'élève', 'nouveau', 'iun'],
  },
  {
    id: 'action-new-payment',
    title: 'Enregistrer un paiement',
    subtitle: 'Finance · caisse',
    href: '/dashboard/finance/payments/new',
    group: 'Actions rapides',
    keywords: ['paiement', 'finance', 'caisse', 'frais'],
  },
  {
    id: 'action-attendance',
    title: 'Prendre les présences',
    subtitle: 'Appel du jour',
    href: '/dashboard/attendance/take',
    group: 'Actions rapides',
    keywords: ['présence', 'appel', 'absence'],
  },
  {
    id: 'action-compose',
    title: 'Rédiger un message',
    subtitle: 'Messagerie interne',
    href: '/dashboard/messages',
    group: 'Actions rapides',
    keywords: ['message', 'mail', 'contacter'],
  },
  {
    id: 'action-notifications',
    title: 'Voir les notifications',
    subtitle: 'Alertes et rappels',
    href: '/dashboard/notifications',
    group: 'Actions rapides',
    keywords: ['notification', 'alerte', 'rappel'],
  },
]

const NAV_KEYWORDS: Record<string, string[]> = {
  inscriptions: ['élève', 'eleve', 'inscription', 'iun', 'scolarité'],
  personnel: ['staff', 'équipe', 'employé', 'enseignant'],
  notes: ['note', 'évaluation', 'grade', 'moyenne'],
  bulletins: ['bulletin', 'relevé', 'attestation'],
  classes: ['classe', 'matière', 'niveau', 'salle'],
  budget: ['finance', 'paiement', 'frais', 'caisse'],
  messages: ['message', 'mail', 'discussion'],
  settings: ['paramètre', 'profil', 'compte', 'réglage'],
  rapports: ['rapport', 'statistique', 'analyse', 'graphique'],
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchesQuery(item: SearchItem, query: string) {
  if (!query) return true
  const haystack = normalizeText(
    [item.title, item.subtitle, item.group, ...(item.keywords ?? [])].filter(Boolean).join(' ')
  )
  return normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every(token => haystack.includes(token))
}

function entityToItem(entity: DashboardEntityResult): SearchItem {
  const group =
    entity.type === 'student'
      ? 'Élèves'
      : entity.type === 'staff'
        ? 'Personnel'
        : entity.type === 'class'
          ? 'Classes'
          : 'Matières'

  return {
    id: entity.id,
    title: entity.title,
    subtitle: entity.subtitle,
    href: entity.href,
    group,
  }
}

function readRecent(): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SearchItem[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function writeRecent(item: SearchItem) {
  try {
    const current = readRecent().filter(entry => entry.href !== item.href || entry.title !== item.title)
    const next = [{ ...item, group: 'Récents' }, ...current].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

function GroupIcon({ group }: { group: string }) {
  if (group === 'Élèves') return <GraduationCap className="h-4 w-4 text-[#7AB832]" />
  if (group === 'Personnel') return <Users className="h-4 w-4 text-[#1B3A6B]" />
  if (group === 'Classes' || group === 'Matières') return <BookOpen className="h-4 w-4 text-amber-600" />
  if (group === 'Actions rapides') return <Zap className="h-4 w-4 text-violet-600" />
  if (group === 'Récents') return <Clock3 className="h-4 w-4 text-gray-400" />
  return <Sparkles className="h-4 w-4 text-[#7AB832]" />
}

interface DashboardCommandSearchProps {
  userRole: string
  className?: string
}

export function DashboardCommandSearch({ userRole, className }: DashboardCommandSearchProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [entityResults, setEntityResults] = useState<DashboardEntityResult[]>([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [recent, setRecent] = useState<SearchItem[]>([])
  const [isMac, setIsMac] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K'

  const navItems = useMemo<SearchItem[]>(() => {
    return flattenRoleNav(userRole).map(item => ({
      id: `nav-${item.id}`,
      title: item.label,
      subtitle: item.group,
      href: item.href,
      group: 'Pages',
      keywords: NAV_KEYWORDS[item.id] ?? [],
    }))
  }, [userRole])

  const quickActions = useMemo(() => {
    const navPaths = navItems.map(item => item.href.split('?')[0])
    return EXTRA_ACTIONS.filter(action => {
      if (action.href === '/dashboard/messages' || action.href === '/dashboard/notifications') {
        return navPaths.some(path => path.includes('/dashboard/messages') || path.includes('/dashboard'))
      }
      const root = action.href.split('/').slice(0, 3).join('/')
      return navPaths.some(path => path === root || path.startsWith(`${root}/`))
    })
  }, [navItems])

  const staticItems = useMemo(() => [...navItems, ...quickActions], [navItems, quickActions])

  const filteredStatic = useMemo(
    () => staticItems.filter(item => matchesQuery(item, query)),
    [staticItems, query]
  )

  const entityItems = useMemo(
    () => entityResults.map(entityToItem).filter(item => matchesQuery(item, query)),
    [entityResults, query]
  )

  const groups = useMemo(() => {
    const map = new Map<string, SearchItem[]>()

    if (!query.trim() && recent.length > 0) {
      map.set('Récents', recent)
    }

    for (const item of filteredStatic) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }

    for (const item of entityItems) {
      const list = map.get(item.group) ?? []
      if (!list.some(existing => existing.id === item.id)) {
        list.push(item)
        map.set(item.group, list)
      }
    }

    const order = ['Récents', 'Pages', 'Actions rapides', 'Élèves', 'Personnel', 'Classes', 'Matières']
    const ordered: ResultGroup[] = []

    for (const id of order) {
      const items = map.get(id)
      if (items?.length) ordered.push({ id, label: id, items })
    }

    for (const [id, items] of map.entries()) {
      if (!order.includes(id) && items.length) ordered.push({ id, label: id, items })
    }

    return ordered
  }, [filteredStatic, entityItems, query, recent])

  const flatItems = useMemo(() => groups.flatMap(group => group.items), [groups])

  const openPalette = useCallback(() => {
    setOpen(true)
    setActiveIndex(0)
    setRecent(readRecent())
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    setEntityResults([])
    setActiveIndex(0)
  }, [])

  const selectItem = useCallback(
    (item: SearchItem) => {
      writeRecent(item)
      closePalette()
      router.push(item.href)
    },
    [closePalette, router]
  )

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, groups.length])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) closePalette()
        else openPalette()
        return
      }

      if (!open) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closePalette()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(index => (flatItems.length ? (index + 1) % flatItems.length : 0))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(index =>
          flatItems.length ? (index - 1 + flatItems.length) % flatItems.length : 0
        )
        return
      }

      if (event.key === 'Enter' && flatItems[activeIndex]) {
        event.preventDefault()
        selectItem(flatItems[activeIndex])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closePalette, openPalette, flatItems, activeIndex, selectItem])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setEntityResults([])
      setIsLoadingEntities(false)
      return
    }

    let cancelled = false
    setIsLoadingEntities(true)

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchDashboardEntities(query)
        if (!cancelled) setEntityResults(results)
      } catch {
        if (!cancelled) setEntityResults([])
      } finally {
        if (!cancelled) setIsLoadingEntities(false)
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, query])

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  let runningIndex = -1

  return (
    <div className={className}>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Rechercher"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 md:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <button
        type="button"
        onClick={openPalette}
        className="hidden min-w-0 w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-[#7AB832]/40 hover:bg-white md:flex"
      >
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate text-sm text-gray-400">Rechercher pages, élèves, classes…</span>
        <kbd className="ml-auto hidden shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 lg:inline">
          {shortcutLabel}
        </kbd>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-[12vh] sm:p-6 sm:pt-[10vh]">
            <button
              type="button"
              aria-label="Fermer la recherche"
              className="absolute inset-0 bg-[#0f172a]/45 backdrop-blur-[2px]"
              onClick={closePalette}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Recherche globale"
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)] animate-in fade-in-0 zoom-in-95 duration-200"
            >
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
              <Search className="h-5 w-5 shrink-0 text-[#7AB832]" />
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Rechercher une page, un élève, une classe…"
                className="min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
                autoComplete="off"
                spellCheck={false}
              />
              {isLoadingEntities && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Effacer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-400 sm:inline">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[min(58vh,520px)] overflow-y-auto px-2 py-2 sm:px-3">
              {flatItems.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {query.trim() ? 'Aucun résultat' : 'Que souhaitez-vous faire ?'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {query.trim()
                      ? 'Essayez un autre mot-clé ou vérifiez l’orthographe.'
                      : 'Tapez pour filtrer les pages ou cherchez un élève par nom / IUN.'}
                  </p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.id} className="pb-1">
                    <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {group.label}
                    </div>
                    <ul className="space-y-0.5">
                      {group.items.map(item => {
                        runningIndex += 1
                        const index = runningIndex
                        const isActive = index === activeIndex

                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              data-active={isActive}
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => selectItem(item)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                                isActive ? 'bg-[#7AB832]/10 ring-1 ring-[#7AB832]/25' : 'hover:bg-gray-50'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                  isActive ? 'bg-white shadow-sm' : 'bg-gray-100'
                                )}
                              >
                                <GroupIcon group={item.group} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-gray-900">{item.title}</div>
                                {item.subtitle && (
                                  <div className="truncate text-xs text-gray-500">{item.subtitle}</div>
                                )}
                              </div>
                              <ArrowRight
                                className={cn(
                                  'h-4 w-4 shrink-0 text-gray-300 transition',
                                  isActive && 'translate-x-0.5 text-[#7AB832]'
                                )}
                              />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 text-[11px] text-gray-500 sm:px-5">
              <span>
                <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-medium">↑↓</kbd>{' '}
                naviguer
              </span>
              <span>
                <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-medium">↵</kbd>{' '}
                ouvrir
              </span>
              <span>
                <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-medium">Esc</kbd>{' '}
                fermer
              </span>
              <span className="ml-auto hidden sm:inline">
                <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-medium">{shortcutLabel}</kbd>{' '}
                raccourci
              </span>
            </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
