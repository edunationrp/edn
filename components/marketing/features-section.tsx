'use client'

import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { FEATURE_MODULES, FEATURE_TRUST_ITEMS, type FeatureModule } from '@/lib/marketing/features'
import { AccentUnderline, SectionBackdrop, SectionHeader } from '@/components/marketing/section-header'
import { ScrollItem, ScrollReveal, ScrollSection, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

function GradesPreview() {
  return (
    <div className="rounded-lg border border-white/20 bg-white/95 p-2 shadow-sm">
      <div className="mb-1 flex items-center justify-between text-[9px] font-semibold text-gray-500">
        <span>3ème A · Maths</span>
        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-green-700">T2</span>
      </div>
      <div className="space-y-1">
        {[
          { name: 'Aminata K.', score: '16/20' },
          { name: 'Ibrahim S.', score: '12/20' },
        ].map(row => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-[9px]"
          >
            <span className="font-medium text-gray-800">{row.name}</span>
            <span className="font-bold text-[#1a4d2e]">{row.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentsPreview() {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a4d2e] text-[8px] font-bold text-white">
          FK
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-bold text-gray-900">Fatoumata Koné</p>
          <p className="text-[8px] text-gray-500">3ème A · Actif</p>
        </div>
      </div>
    </div>
  )
}

function FinancePreview() {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[8px] text-gray-500">Paiement reçu</p>
          <p className="text-xs font-black text-[#1a4d2e]">75 000 FCFA</p>
        </div>
        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[8px] font-bold text-green-700">
          OK
        </span>
      </div>
    </div>
  )
}

function AttendancePreview() {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
      <div className="flex gap-1.5">
        {[
          { label: 'P', value: '28', color: 'bg-green-500' },
          { label: 'A', value: '2', color: 'bg-red-400' },
          { label: 'R', value: '1', color: 'bg-amber-400' },
        ].map(item => (
          <div key={item.label} className="flex-1 rounded bg-gray-50 px-1 py-1 text-center">
            <div className={cn('mx-auto mb-0.5 h-0.5 w-4 rounded-full', item.color)} />
            <p className="text-[10px] font-black text-gray-900">{item.value}</p>
            <p className="text-[7px] text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: 'Élèves', value: '842' },
          { label: 'Classes', value: '24' },
        ].map(stat => (
          <div key={stat.label} className="rounded bg-gray-50 p-1">
            <p className="text-[7px] text-gray-500">{stat.label}</p>
            <p className="text-[10px] font-black text-[#1B3A6B]">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessagesPreview() {
  return (
    <div className="rounded-lg border border-[#7AB832]/30 bg-[#f0f9e8]/80 px-2 py-1.5 text-[9px]">
      <p className="font-semibold text-gray-800">Direction</p>
      <p className="truncate text-gray-600">Réunion parents 3ème A — vendredi</p>
    </div>
  )
}

function FeaturePreview({ type }: { type: FeatureModule['preview'] }) {
  switch (type) {
    case 'grades':
      return <GradesPreview />
    case 'students':
      return <StudentsPreview />
    case 'finance':
      return <FinancePreview />
    case 'attendance':
      return <AttendancePreview />
    case 'dashboard':
      return <DashboardPreview />
    case 'messages':
      return <MessagesPreview />
  }
}

function FeatureCard({ module }: { module: FeatureModule }) {
  const Icon = module.icon

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7AB832]/25 hover:shadow-md">
      <div
        className={cn(
          'relative flex items-center justify-between gap-2 overflow-hidden bg-linear-to-br px-3 py-2.5 text-white',
          module.accent
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative min-w-0">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider">
            {module.tag}
          </span>
          <h3 className="mt-1 truncate text-sm font-bold leading-tight">{module.title}</h3>
        </div>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="mb-2 overflow-hidden">
          <FeaturePreview type={module.preview} />
        </div>

        <p className="line-clamp-2 text-[11px] leading-snug text-gray-600">{module.description}</p>

        <ul className="mt-2 flex flex-wrap gap-1">
          {module.highlights.map(item => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-[#f0f9e8] px-2 py-0.5 text-[9px] font-medium text-[#1a4d2e]"
            >
              <Check className="h-2.5 w-2.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export function FeaturesSection() {
  return (
    <ScrollSection id="fonctionnalites" className="relative overflow-hidden bg-[#f8fafc] py-14 sm:py-16">
      <SectionBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Fonctionnalités"
            badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
            className="mb-8"
            title={
              <>
                Tout ce qu&apos;une école moderne{' '}
                <AccentUnderline>utilise au quotidien</AccentUnderline>
              </>
            }
            description="Des modules conçus pour la réalité des collèges et lycées burkinabè — notes en FCFA, bulletins officiels, présences et communication avec les familles."
          />
        </ScrollReveal>

        <ScrollStagger className="mx-auto grid max-w-4xl grid-cols-2 gap-3 lg:max-w-5xl lg:grid-cols-3 lg:gap-4">
          {FEATURE_MODULES.map(module => (
            <ScrollItem key={module.id}>
              <FeatureCard module={module} />
            </ScrollItem>
          ))}
        </ScrollStagger>

        <ScrollReveal delay={0.1} className="mx-auto mt-8 max-w-4xl lg:max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#7AB832]/20 bg-[#f0f9e8]/70 p-6 shadow-sm sm:flex-row sm:p-8">
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {FEATURE_TRUST_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-full border border-white/60 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-[#1a4d2e]" />
                    {item.label}
                  </div>
                )
              })}
            </div>
            <Link
              href="/register/school"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1a4d2e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a4d2e]/20 transition hover:bg-[#2d6a4f]"
            >
              Essayer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </ScrollSection>
  )
}
