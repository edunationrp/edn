'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { FEATURE_TRUST_ITEMS } from '@/lib/marketing/features'
import { EcosystemDiagram } from '@/components/marketing/ecosystem-diagram'
import { AccentUnderline, SectionBackdrop, SectionHeader } from '@/components/marketing/section-header'
import { ScrollReveal, ScrollSection } from '@/components/motion/scroll-effects'

export function FeaturesSection() {
  return (
    <ScrollSection id="fonctionnalites" className="relative overflow-hidden bg-[#f8fafc] py-14 sm:py-20">
      <SectionBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Fonctionnalités"
            badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
            className="mb-10"
            title={
              <>
                Tout ce qu&apos;une école moderne{' '}
                <AccentUnderline>utilise au quotidien</AccentUnderline>
              </>
            }
            description="Une plateforme unique qui connecte établissements, enseignants, élèves, parents et administration — du pilotage à la communication, en passant par la pédagogie et les finances."
          />
        </ScrollReveal>

        <EcosystemDiagram />

        <ScrollReveal delay={0.1} className="mx-auto mt-12 max-w-5xl">
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
