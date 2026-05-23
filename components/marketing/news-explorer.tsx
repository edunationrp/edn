'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, Sparkles } from 'lucide-react'
import { NEWS_ARTICLES, NEWS_CATEGORIES } from '@/lib/marketing/content'
import { ScrollItem, ScrollReveal, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function NewsExplorer() {
  const [category, setCategory] = useState<string>('all')
  const featured = NEWS_ARTICLES.find(article => article.featured)
  const articles = useMemo(
    () =>
      NEWS_ARTICLES.filter(article => {
        if (article.featured) return false
        if (category === 'all') return true
        return article.category === category
      }),
    [category]
  )

  return (
    <div className="space-y-12">
      {featured && (
        <ScrollReveal direction="scale">
        <article className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-[#1B3A6B]/5 transition duration-300 hover:shadow-2xl hover:shadow-[#1B3A6B]/10">
          <div className="grid lg:grid-cols-2">
            <div
              className={`relative min-h-[260px] bg-gradient-to-br ${featured.imageGradient} p-8 text-white lg:min-h-full`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-[#7AB832]" />
                  À la une
                </span>
                <div className="text-6xl">{featured.emoji}</div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="rounded-full bg-[#f0f9e8] px-3 py-1 font-semibold text-[#1a4d2e]">
                  {featured.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(featured.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {featured.readTime}
                </span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{featured.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">{featured.excerpt}</p>
              <button
                type="button"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-[#1a4d2e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2d6a4f]"
              >
                Lire l&apos;article
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
        </ScrollReveal>
      )}

      <ScrollReveal>
      <div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dernières publications</h2>
            <p className="mt-1 text-gray-500">Actualités éducatives, événements et nouveautés EduNation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {NEWS_CATEGORIES.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  category === item.id
                    ? 'bg-[#1B3A6B] text-white shadow-md shadow-[#1B3A6B]/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map(article => (
            <ScrollItem key={article.slug}>
            <article
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#7AB832]/30 hover:shadow-lg hover:shadow-[#1a4d2e]/10"
            >
              <div className={`relative bg-gradient-to-br ${article.imageGradient} px-6 py-8 text-white`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_60%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                    {article.categoryLabel}
                  </span>
                  <span className="text-3xl">{article.emoji}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(article.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-snug text-gray-900 transition group-hover:text-[#1a4d2e]">
                  {article.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{article.excerpt}</p>
                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1B3A6B] transition group-hover:gap-3"
                >
                  Lire la suite
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
            </ScrollItem>
          ))}
        </ScrollStagger>
      </div>
      </ScrollReveal>

      <ScrollReveal direction="fade">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4d2e] to-[#1B3A6B] p-8 text-white sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#7AB832]">Newsletter éducative</p>
            <h3 className="mt-2 text-2xl font-black">Restez informé de l&apos;éducation numérique au Burkina</h3>
            <p className="mt-3 max-w-xl text-white/75">
              Recevez nos articles, retours d&apos;expérience et annonces de nouvelles fonctionnalités EduNation.
            </p>
          </div>
          <Link
            href="/register/school"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c842] px-6 py-3.5 text-sm font-bold text-[#1a4d2e] transition hover:bg-yellow-400"
          >
            Rejoindre EduNation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}
