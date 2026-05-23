'use client'

import { useMemo, useState } from 'react'
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Search,
  Sparkles,
  Unlock,
} from 'lucide-react'
import {
  getResourceDownloadUrl,
  getResourcePreviewUrl,
  RESOURCE_LEVELS,
  RESOURCE_SUBJECTS,
  RESOURCE_TYPES,
  STUDY_RESOURCES,
} from '@/lib/marketing/resources'
import { ScrollItem, ScrollReveal, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

function formatDownloads(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function ResourcesExplorer() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [level, setLevel] = useState('all')
  const [subject, setSubject] = useState('all')

  const featured = STUDY_RESOURCES.find(resource => resource.featured)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STUDY_RESOURCES.filter(resource => {
      if (resource.featured) return false
      if (type !== 'all' && resource.type !== type) return false
      if (level !== 'all' && resource.level !== level) return false
      if (subject !== 'all' && resource.subject !== subject) return false
      if (!q) return true
      return (
        resource.title.toLowerCase().includes(q) ||
        resource.subjectLabel.toLowerCase().includes(q) ||
        resource.levelLabel.toLowerCase().includes(q) ||
        resource.typeLabel.toLowerCase().includes(q) ||
        resource.tags.some(tag => tag.toLowerCase().includes(q))
      )
    })
  }, [query, type, level, subject])

  const totalDownloads = STUDY_RESOURCES.reduce((sum, r) => sum + r.downloads, 0)
  const subjectsCount = new Set(STUDY_RESOURCES.map(r => r.subject)).size

  return (
    <div className="space-y-12">
      <ScrollStagger className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Documents gratuits', value: STUDY_RESOURCES.length, icon: FileText },
          { label: 'Matières couvertes', value: subjectsCount, icon: BookOpen },
          { label: 'Téléchargements', value: `${formatDownloads(totalDownloads)}+`, icon: Download },
        ].map(stat => (
          <ScrollItem key={stat.label}>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#7AB832]/25 hover:shadow-md">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f9e8] text-[#1a4d2e]">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-[#1B3A6B]">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          </ScrollItem>
        ))}
      </ScrollStagger>

      {featured && (
        <ScrollReveal direction="scale">
          <article className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-[#1B3A6B]/5 transition duration-300 hover:shadow-2xl">
            <div className="grid lg:grid-cols-2">
              <div
                className={`relative min-h-[280px] bg-gradient-to-br ${featured.accent} p-8 text-white lg:min-h-full`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-[#7AB832]" />À la une
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7AB832] px-3 py-1 text-xs font-bold text-[#0f2447]">
                      <Unlock className="h-3 w-3" />
                      100 % gratuit
                    </span>
                  </div>
                  <div className="text-6xl">{featured.emoji}</div>
                </div>
              </div>

              <div className="flex flex-col justify-center p-8 sm:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-[#f0f9e8] px-3 py-1 font-semibold text-[#1a4d2e]">
                    {featured.typeLabel}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                    {featured.subjectLabel}
                  </span>
                  <span className="rounded-full bg-[#1B3A6B]/10 px-3 py-1 font-semibold text-[#1B3A6B]">
                    {featured.levelLabel}
                  </span>
                </div>
                <h2 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{featured.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-gray-600">{featured.description}</p>
                <p className="mt-3 text-sm text-gray-500">
                  {featured.pages} pages · {featured.fileSize} · {formatDownloads(featured.downloads)} téléchargements
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={getResourceDownloadUrl(featured.slug)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1a4d2e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2d6a4f]"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le PDF
                  </a>
                  <a
                    href={getResourcePreviewUrl(featured.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#1a4d2e]/30 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    Aperçu
                  </a>
                </div>
              </div>
            </div>
          </article>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#7AB832]/20 bg-[#f0f9e8]/60 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a4d2e] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Accès libre pour tous les élèves</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Aucune inscription requise. Collège, lycée, BEPC ou BAC — téléchargez cours, sujets d&apos;examen,
                devoirs et TD en PDF depuis n&apos;importe où au Burkina Faso.
              </p>
            </div>
          </div>

          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Rechercher un cours, un sujet, une matière…"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#1a4d2e]/30 focus:bg-white focus:ring-2 focus:ring-[#7AB832]/20"
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Type</p>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      type === item.id
                        ? 'bg-[#1B3A6B] text-white shadow-md shadow-[#1B3A6B]/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Niveau</p>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_LEVELS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                      level === item.id
                        ? 'bg-[#1a4d2e] text-white shadow-md shadow-[#1a4d2e]/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Matière</p>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_SUBJECTS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubject(item.id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                      subject === item.id
                        ? 'bg-[#7AB832] text-[#0f2447] shadow-md shadow-[#7AB832]/25'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {filtered.length === 0 ? (
        <ScrollReveal>
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-gray-900">Aucun document trouvé</p>
            <p className="mt-2 text-gray-500">Modifiez vos filtres ou essayez un autre mot-clé.</p>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(resource => (
            <ScrollItem key={resource.slug}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#7AB832]/30 hover:shadow-lg hover:shadow-[#1a4d2e]/10">
                <div className={`relative bg-gradient-to-br ${resource.accent} px-6 py-7 text-white`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_60%)]" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        {resource.typeLabel}
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold">
                        {resource.levelLabel}
                      </span>
                    </div>
                    <span className="text-3xl">{resource.emoji}</span>
                  </div>
                  <h3 className="relative mt-4 text-lg font-bold leading-snug">{resource.title}</h3>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm leading-relaxed text-gray-600">{resource.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {resource.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="font-semibold text-[#1B3A6B]">{resource.subjectLabel}</span>
                    <span>·</span>
                    <span>{resource.pages} p.</span>
                    <span>·</span>
                    <span>{resource.fileSize}</span>
                    <span>·</span>
                    <span>{formatDownloads(resource.downloads)} dl.</span>
                  </div>

                  <div className="mt-auto flex gap-2 pt-5">
                    <a
                      href={getResourceDownloadUrl(resource.slug)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1a4d2e] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#2d6a4f]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </a>
                    <a
                      href={getResourcePreviewUrl(resource.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      aria-label={`Aperçu ${resource.title}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            </ScrollItem>
          ))}
        </ScrollStagger>
      )}
    </div>
  )
}
