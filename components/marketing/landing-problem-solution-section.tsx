'use client'

import { AlertTriangle, CheckCircle, Sparkles } from 'lucide-react'
import { LANDING_PROBLEMS, LANDING_SOLUTIONS } from '@/lib/marketing/landing-content'
import { AccentUnderline, SectionBackdrop, SectionHeader } from '@/components/marketing/section-header'
import { ScrollItem, ScrollReveal, ScrollSection, ScrollStagger } from '@/components/motion/scroll-effects'

export function LandingProblemSolutionSection() {
  return (
    <ScrollSection className="relative overflow-hidden bg-[#f8fafc] py-20 sm:py-24">
      <SectionBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Problème & Solution"
            badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
            title={
              <>
                Les défis des écoles africaines,{' '}
                <AccentUnderline>notre réponse concrète</AccentUnderline>
              </>
            }
            description="EduNation transforme les obstacles quotidiens des établissements en processus numériques simples, fiables et adaptés au contexte burkinabè."
          />
        </ScrollReveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <ScrollReveal direction="left">
            <article className="h-full rounded-3xl border border-red-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">Constat</p>
                  <h3 className="text-xl font-bold text-gray-900">Le problème aujourd&apos;hui</h3>
                </div>
              </div>

              <ScrollStagger className="space-y-3">
                {LANDING_PROBLEMS.map(item => (
                  <ScrollItem key={item}>
                    <div className="flex items-start gap-3 rounded-xl bg-red-50/50 px-4 py-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                      <p className="text-sm leading-relaxed text-gray-700">{item}</p>
                    </div>
                  </ScrollItem>
                ))}
              </ScrollStagger>
            </article>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <article className="relative h-full overflow-hidden rounded-3xl border border-[#7AB832]/20 bg-gradient-to-br from-[#1a4d2e] via-[#1B3A6B] to-[#0f2447] p-6 text-white shadow-xl shadow-[#1a4d2e]/20 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#7AB832]/20 blur-2xl" />

              <div className="relative mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-[#f5c842]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7AB832]">EduNation</p>
                  <h3 className="text-xl font-bold">Notre solution</h3>
                </div>
              </div>

              <ScrollStagger className="relative space-y-3">
                {LANDING_SOLUTIONS.map(item => (
                  <ScrollItem key={item}>
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c842]" />
                      <p className="text-sm leading-relaxed text-green-50">{item}</p>
                    </div>
                  </ScrollItem>
                ))}
              </ScrollStagger>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </ScrollSection>
  )
}
