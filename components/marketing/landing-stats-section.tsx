'use client'

import { LANDING_STATS } from '@/lib/marketing/landing-content'
import { ScrollItem, ScrollReveal, ScrollSection, ScrollStagger } from '@/components/motion/scroll-effects'

export function LandingStatsSection() {
  return (
    <ScrollSection className="relative overflow-hidden bg-white py-14 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7AB832]/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a4d2e]/70">
            Impact mesurable
          </p>
          <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
            Des résultats concrets pour votre établissement
          </h2>
        </ScrollReveal>

        <ScrollStagger className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {LANDING_STATS.map(stat => {
            const Icon = stat.icon
            return (
              <ScrollItem key={stat.label}>
                <article className="group flex h-full items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#7AB832]/25 hover:shadow-md hover:shadow-[#1a4d2e]/8 sm:p-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} transition group-hover:scale-105`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className={`text-lg font-black leading-tight sm:text-xl ${stat.accent}`}>
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-600 sm:text-xs">
                      {stat.label}
                    </p>
                  </div>
                </article>
              </ScrollItem>
            )
          })}
        </ScrollStagger>
      </div>
    </ScrollSection>
  )
}
