'use client'

import type { ReactNode } from 'react'
import { HeroMotionItem, LandingHeroMotion } from '@/components/motion/scroll-effects'

type PageHeroProps = {
  badge: string
  title: ReactNode
  description: string
  gradient?: string
}

export function PageHero({
  badge,
  title,
  description,
  gradient = 'from-[#0f2447] via-[#1B3A6B] to-[#1a4d2e]',
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7AB832]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <LandingHeroMotion className="max-w-3xl">
          <HeroMotionItem>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7AB832] animate-pulse" />
              {badge}
            </div>
          </HeroMotionItem>
          <HeroMotionItem>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">{title}</h1>
          </HeroMotionItem>
          <HeroMotionItem>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{description}</p>
          </HeroMotionItem>
        </LandingHeroMotion>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 64L1440 64L1440 16C1440 16 1080 48 720 48C360 48 0 16 0 16L0 64Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}
