'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, MapPin, Search, Users } from 'lucide-react'
import { FEATURED_SCHOOLS, SCHOOL_REGIONS } from '@/lib/marketing/content'
import { ScrollItem, ScrollReveal, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

export function SchoolsExplorer() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('Toutes')

  const filtered = useMemo(() => {
    return FEATURED_SCHOOLS.filter(school => {
      const matchesRegion = region === 'Toutes' || school.region === region
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        school.name.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q) ||
        school.typeLabel.toLowerCase().includes(q)
      return matchesRegion && matchesQuery
    })
  }, [query, region])

  const totalStudents = FEATURED_SCHOOLS.reduce((sum, school) => sum + school.students, 0)
  const cities = new Set(FEATURED_SCHOOLS.map(school => school.city)).size

  return (
    <div className="space-y-12">
      <ScrollStagger className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Établissements', value: FEATURED_SCHOOLS.length, icon: Building2 },
          { label: 'Villes couvertes', value: cities, icon: MapPin },
          { label: 'Élèves suivis', value: `${totalStudents.toLocaleString('fr-FR')}+`, icon: Users },
        ].map(stat => (
          <ScrollItem key={stat.label}>
          <div
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#7AB832]/25 hover:shadow-md"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B3A6B]/10 text-[#1B3A6B]">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-black text-[#1a4d2e]">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
          </ScrollItem>
        ))}
      </ScrollStagger>

      <ScrollReveal>
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Rechercher un établissement, une ville…"
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#1a4d2e]/30 focus:bg-white focus:ring-2 focus:ring-[#7AB832]/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SCHOOL_REGIONS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setRegion(item)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  region === item
                    ? 'bg-[#1a4d2e] text-white shadow-md shadow-[#1a4d2e]/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {filtered.length === 0 ? (
        <ScrollReveal>
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">Aucun établissement trouvé</p>
          <p className="mt-2 text-gray-500">Essayez un autre mot-clé ou sélectionnez une autre région.</p>
        </div>
        </ScrollReveal>
      ) : (
        <ScrollStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(school => (
            <ScrollItem key={school.slug}>
            <article
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#7AB832]/30 hover:shadow-lg hover:shadow-[#1B3A6B]/10"
            >
              <div className={`relative bg-gradient-to-br ${school.color} px-6 py-7 text-white`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                        school.accessLevel === 'public'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#7AB832]/25 text-[#ecfccb]'
                      )}
                    >
                      {school.accessLevel === 'public' ? 'Public' : 'Privé'}
                    </span>
                    <p className="mt-3 text-sm text-white/75">{school.typeLabel}</p>
                  </div>
                  <span className="text-4xl">{school.emoji}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold text-gray-900 transition group-hover:text-[#1a4d2e]">
                  {school.name}
                </h3>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {school.city} · {school.region}
                </p>

                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm leading-relaxed text-gray-600">{school.highlight}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold text-[#1B3A6B]">{school.students.toLocaleString('fr-FR')}</p>
                    <p className="text-gray-500">élèves</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1a4d2e]">Depuis {school.since}</p>
                    <p className="text-gray-500">sur EduNation</p>
                  </div>
                </div>
              </div>
            </article>
            </ScrollItem>
          ))}
        </ScrollStagger>
      )}

      <ScrollReveal direction="fade">
      <section className="overflow-hidden rounded-3xl border border-[#7AB832]/20 bg-gradient-to-br from-[#f0f9e8] via-white to-[#eef3fa] p-8 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1a4d2e]">Rejoignez le réseau</p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">
              Votre établissement mérite sa propre vitrine numérique
            </h3>
            <p className="mt-3 max-w-2xl text-gray-600">
              Inscrivez votre collège ou lycée sur EduNation et rejoignez les établissements qui modernisent
              la gestion scolaire au Burkina Faso.
            </p>
          </div>
          <Link
            href="/register/school"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a4d2e] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1a4d2e]/20 transition hover:bg-[#2d6a4f]"
          >
            Inscrire mon école
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}
