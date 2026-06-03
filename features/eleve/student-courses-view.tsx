'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HighlightText } from '@/components/ui/highlight-text'
import { Input } from '@/components/ui/input'
import { ExternalLink, FileDown, Search, Sparkles, Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeDate } from '@/lib/utils'
import { isRecentResource } from '@/lib/eleve/course-resource-preferences'
import {
  formatFileSize,
  getResourceTypeConfig,
  getSubjectAccent,
  RESOURCE_TYPE_CONFIG,
} from '@/lib/eleve/course-resource-display'
import { useCourseResourcePreferences } from '@/features/eleve/use-course-resource-preferences'
import type { StudentCourseResource } from '@/lib/eleve/get-student-course-resources'

type SortMode = 'recent' | 'title' | 'subject'

type Props = {
  className: string
  resources: StudentCourseResource[]
}

function sortResources(items: StudentCourseResource[], mode: SortMode) {
  const copy = [...items]
  if (mode === 'recent') {
    return copy.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return tb - ta
    })
  }
  if (mode === 'title') {
    return copy.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
  }
  return copy.sort((a, b) => {
    const sub = a.subjectName.localeCompare(b.subjectName, 'fr')
    if (sub !== 0) return sub
    return a.title.localeCompare(b.title, 'fr')
  })
}

type ResourceCardProps = {
  item: StudentCourseResource
  searchQuery: string
  isFavorite: boolean
  isViewed: boolean
  onToggleFavorite: () => void
  onMarkViewed: () => void
  compact?: boolean
}

function ResourceCard({
  item,
  searchQuery,
  isFavorite,
  isViewed,
  onToggleFavorite,
  onMarkViewed,
  compact = false,
}: ResourceCardProps) {
  const typeConfig = getResourceTypeConfig(item.type)
  const Icon = typeConfig.icon
  const sizeLabel = formatFileSize(item.fileSizeBytes)
  const dateLabel = item.publishedAt ? formatRelativeDate(item.publishedAt) : null
  const isNew = isRecentResource(item.publishedAt)

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md',
        isFavorite ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <button
        type="button"
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onClick={onToggleFavorite}
        className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-500"
      >
        <Star
          className={cn('h-4 w-4', isFavorite && 'fill-amber-400 text-amber-500')}
        />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            compact ? 'h-9 w-9' : 'h-11 w-11',
            typeConfig.iconBg,
          )}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-1.5">
            <h3 className={cn('font-bold leading-snug text-gray-900', compact ? 'text-sm' : 'text-base')}>
              <HighlightText text={item.title} query={searchQuery} />
            </h3>
            {isNew && !isViewed && (
              <span className="rounded-full bg-[#7AB832] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Nouveau
              </span>
            )}
            {isViewed && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                Vu
              </span>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', typeConfig.badge)}>
              {typeConfig.label}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600">
            <HighlightText text={item.teacherName} query={searchQuery} />
          </p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            {dateLabel && <span>{dateLabel}</span>}
            {dateLabel && sizeLabel && <span aria-hidden>·</span>}
            {sizeLabel && <span>{sizeLabel}</span>}
            <span>· {item.subjectName}</span>
          </div>
        </div>
      </div>

      {item.description && (
        <p className={cn('line-clamp-2 flex-1 leading-relaxed text-slate-600', compact ? 'mt-2 text-xs' : 'mt-3 text-sm')}>
          <HighlightText text={item.description} query={searchQuery} />
        </p>
      )}

      <div className={cn('flex flex-wrap gap-2 border-t border-slate-100', compact ? 'mt-3 pt-2' : 'mt-4 pt-3')}>
        <Button
          asChild
          size="sm"
          variant="default"
          className={cn('gap-1.5 bg-[#1B3A6B] hover:bg-[#15305a]', compact ? 'h-8 flex-1 text-xs' : 'h-9 flex-1 sm:flex-none')}
        >
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={item.fileName}
            onClick={onMarkViewed}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ouvrir
          </a>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className={cn('gap-1.5', compact ? 'h-8 flex-1 text-xs' : 'h-9 flex-1 sm:flex-none')}
        >
          <a
            href={item.downloadUrl}
            download={item.fileName}
            target="_blank"
            rel="noopener noreferrer"
            title={`Télécharger ${item.fileName}`}
            onClick={onMarkViewed}
          >
            <FileDown className="h-3.5 w-3.5" />
            Télécharger
          </a>
        </Button>
      </div>
    </article>
  )
}

export function StudentCoursesView({ className, resources }: Props) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => {
    const matiere = searchParams.get('matiere')?.trim()
    if (!matiere) return
    const match = resources.find(
      r => r.subjectName.toLowerCase() === matiere.toLowerCase(),
    )
    if (match) setSubjectFilter(match.subjectName)
  }, [searchParams, resources])
  const [typeFilter, setTypeFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [newOnlyFilter, setNewOnlyFilter] = useState(false)
  const { viewedIds, favoriteIds, markViewed, toggleFavorite } = useCourseResourcePreferences()

  const subjects = useMemo(() => {
    const names = new Set(resources.map(r => r.subjectName))
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [resources])

  const teachers = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of resources) {
      map.set(r.teacherId, r.teacherName)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [resources])

  const typeOptions = useMemo(() => {
    const types = new Set(resources.map(r => r.type))
    return [...types].sort()
  }, [resources])

  const newCount = useMemo(
    () => resources.filter(r => isRecentResource(r.publishedAt) && !viewedIds.has(r.id)).length,
    [resources, viewedIds],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = resources.filter(resource => {
      if (newOnlyFilter && (!isRecentResource(resource.publishedAt) || viewedIds.has(resource.id))) {
        return false
      }
      if (subjectFilter && resource.subjectName !== subjectFilter) return false
      if (typeFilter && resource.type !== typeFilter) return false
      if (teacherFilter && resource.teacherId !== teacherFilter) return false
      if (!q) return true
      return (
        resource.title.toLowerCase().includes(q)
        || resource.subjectName.toLowerCase().includes(q)
        || resource.teacherName.toLowerCase().includes(q)
        || (resource.description?.toLowerCase().includes(q) ?? false)
      )
    })
    return sortResources(list, sortMode)
  }, [resources, query, subjectFilter, typeFilter, teacherFilter, sortMode, newOnlyFilter, viewedIds])

  const favoriteResources = useMemo(
    () => sortResources(resources.filter(r => favoriteIds.has(r.id)), 'recent'),
    [resources, favoriteIds],
  )

  const grouped = useMemo(() => {
    const bySubject: Record<string, StudentCourseResource[]> = {}
    for (const resource of filtered) {
      const key = resource.subjectName
      if (!bySubject[key]) bySubject[key] = []
      bySubject[key].push(resource)
    }
    return Object.keys(bySubject)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map(subject => ({ subject, items: bySubject[subject] }))
  }, [filtered])

  const hasActiveFilters = Boolean(
    query.trim() || subjectFilter || typeFilter || teacherFilter || newOnlyFilter,
  )
  const searchQuery = query.trim()

  function clearFilters() {
    setQuery('')
    setSubjectFilter('')
    setTypeFilter('')
    setTeacherFilter('')
    setNewOnlyFilter(false)
  }

  const subjectCount = new Set(filtered.map(r => r.subjectName)).size

  function cardProps(item: StudentCourseResource, compact?: boolean) {
    return {
      item,
      searchQuery,
      compact,
      isFavorite: favoriteIds.has(item.id),
      isViewed: viewedIds.has(item.id),
      onToggleFavorite: () => toggleFavorite(item.id),
      onMarkViewed: () => markViewed(item.id),
    }
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Cours & ressources</h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
          Documents publiés par tes professeurs pour{' '}
          <span className="font-semibold text-[#1B3A6B]">{className}</span>.
          Ouvre ou télécharge chaque fichier en un clic.
        </p>
        {resources.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {resources.length} document{resources.length !== 1 ? 's' : ''} · {subjects.length} matière
            {subjects.length !== 1 ? 's' : ''}
            {favoriteIds.size > 0 && ` · ${favoriteIds.size} favori${favoriteIds.size !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {resources.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un cours, un exercice…"
              className="h-10 w-full pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSubjectFilter('')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                !subjectFilter ? 'bg-[#1B3A6B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              Toutes
            </button>
            {subjects.map(subject => {
              const accent = getSubjectAccent(subject)
              const active = subjectFilter === subject
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setSubjectFilter(active ? '' : subject)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    active ? 'bg-[#1B3A6B] text-white' : accent.chip,
                  )}
                >
                  {subject}
                </button>
              )
            })}
            {newCount > 0 && (
              <button
                type="button"
                onClick={() => setNewOnlyFilter(prev => !prev)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  newOnlyFilter
                    ? 'bg-[#7AB832] text-white'
                    : 'bg-[#7AB832]/15 text-[#5a8f26] hover:bg-[#7AB832]/25',
                )}
              >
                <Sparkles className="h-3 w-3" />
                Nouveautés
                <span
                  className={cn(
                    'min-w-[1.125rem] rounded-full px-1 text-[10px] font-bold',
                    newOnlyFilter ? 'bg-white/25 text-white' : 'bg-[#7AB832]/20 text-[#5a8f26]',
                  )}
                >
                  {newCount}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-xl border bg-white px-3 text-xs sm:max-w-[9rem] sm:flex-none sm:text-sm"
            >
              <option value="">Tous les types</option>
              {typeOptions.map(type => (
                <option key={type} value={type}>
                  {RESOURCE_TYPE_CONFIG[type]?.label ?? type}
                </option>
              ))}
            </select>
            <select
              value={teacherFilter}
              onChange={e => setTeacherFilter(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-xl border bg-white px-3 text-xs sm:max-w-[11rem] sm:flex-none sm:text-sm"
            >
              <option value="">Tous les professeurs</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="h-9 min-w-0 flex-1 rounded-xl border bg-white px-3 text-xs sm:max-w-[10rem] sm:flex-none sm:text-sm"
            >
              <option value="recent">Plus récent</option>
              <option value="title">Titre A → Z</option>
              <option value="subject">Par matière</option>
            </select>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" className="h-9 gap-1 px-2 text-xs" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Effacer
              </Button>
            )}
          </div>

          {(hasActiveFilters || filtered.length !== resources.length) && (
            <p className="text-xs font-medium text-slate-600">
              {filtered.length} document{filtered.length !== 1 ? 's' : ''}
              {subjectCount > 0 && ` · ${subjectCount} matière${subjectCount !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      )}

      {favoriteResources.length > 0 && !hasActiveFilters && !newOnlyFilter && (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900">Mes favoris</h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {favoriteResources.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteResources.map(item => (
              <ResourceCard key={`fav-${item.id}`} {...cardProps(item, true)} />
            ))}
          </div>
        </section>
      )}

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">Aucune ressource pour le moment</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tes professeurs publieront ici leurs cours et documents.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">Aucun résultat</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Essaie un autre mot-clé ou modifie les filtres.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        grouped.map(({ subject, items }) => {
          const accent = getSubjectAccent(subject)
          return (
            <section key={subject} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                <div className={cn('h-8 w-1 shrink-0 rounded-full', accent.bar)} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-gray-900 sm:text-base">{subject}</h2>
                  <p className="text-xs text-slate-500">
                    {items.length} document{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="secondary" className={cn('shrink-0 text-[10px]', accent.chip)}>
                  {subject}
                </Badge>
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-2">
                {items.map(item => (
                  <ResourceCard key={item.id} {...cardProps(item)} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
