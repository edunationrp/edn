'use client'

import Link from 'next/link'
import { ArrowRight, LogIn, School } from 'lucide-react'
import { ScrollReveal, ScrollSection } from '@/components/motion/scroll-effects'

export function LandingCtaSection() {
  return (
    <ScrollSection className="relative overflow-hidden bg-gradient-to-br from-[#1a4d2e] via-[#1B3A6B] to-[#0f2447] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"
        aria-hidden="true"
      />

      <ScrollReveal direction="scale" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30">
          <School className="h-7 w-7 text-[#f5c842] drop-shadow-md" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl">
          Prêt à inscrire votre établissement ?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:text-lg">
          Créez l&apos;espace numérique de votre collège ou lycée sur EduNation. L&apos;inscription
          des élèves se fait ensuite depuis votre tableau de bord — essai gratuit 14 jours.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/register/school"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c842] px-8 py-4 text-sm font-bold text-[#1a4d2e] shadow-lg shadow-black/20 transition hover:bg-yellow-400"
          >
            Inscrire mon école
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/25 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-black/15 backdrop-blur-md transition hover:bg-white/35"
          >
            <LogIn className="h-4 w-4" />
            J&apos;ai déjà un compte
          </Link>
        </div>
      </ScrollReveal>
    </ScrollSection>
  )
}
