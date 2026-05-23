'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { HeroMotionItem, LandingHeroMotion } from '@/components/motion/scroll-effects'
import { RotatingBannerBackground } from '@/components/marketing/rotating-banner-background'

export function LandingHeroSection() {
  return (
    <section className="relative isolate overflow-hidden text-white">
      {/* Arrière-plan photo — derrière tout le contenu */}
      <RotatingBannerBackground />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[#0f2447]/65 via-[#1a4d2e]/50 to-[#1B3A6B]/60"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-20 top-10 z-[1] h-72 w-72 rounded-full bg-[#7AB832]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-20 z-[1] h-56 w-56 rounded-full bg-[#f5c842]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <LandingHeroMotion className="mx-auto max-w-4xl text-center">
          <HeroMotionItem>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#f5c842]" />
              <GraduationCap className="h-4 w-4 text-[#7AB832]" />
              Plateforme scolaire · Burkina Faso
            </div>
          </HeroMotionItem>

          <HeroMotionItem>
            <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Former aujourd&apos;hui les{' '}
              <span className="text-[#f5c842]">leaders de demain</span>
            </h1>
          </HeroMotionItem>

          <HeroMotionItem>
            <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-white/90 sm:text-xl">
              L&apos;éducation est le socle sur lequel se construisent les générations capables
              d&apos;innover, de diriger et de transformer le monde. EduNation accompagne chaque
              établissement vers l&apos;excellence.
            </p>
          </HeroMotionItem>

          <HeroMotionItem>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5c842] px-8 py-4 text-lg font-bold text-[#1a4d2e] shadow-lg shadow-black/20 transition hover:bg-yellow-400"
              >
                Accéder à la plateforme
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/register/school"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Inscrire mon école
              </Link>
            </div>
          </HeroMotionItem>

          <HeroMotionItem>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider text-white/70">
              {['Essai 14 jours', 'Sans engagement', 'Support local'].map(item => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </HeroMotionItem>
        </LandingHeroMotion>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L1440 80L1440 20C1440 20 1200 60 720 60C240 60 0 20 0 20L0 80Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}
