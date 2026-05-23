'use client'

import Link from 'next/link'
import { ArrowRight, Bell, BookOpen, CreditCard, Globe, Users, Volume2 } from 'lucide-react'
import { LANDING_ACCESSIBILITY_FEATURES } from '@/lib/marketing/landing-content'
import { AccentUnderline, SectionBackdrop, SectionHeader } from '@/components/marketing/section-header'
import { ScrollItem, ScrollReveal, ScrollSection, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

const PARENT_BUTTONS = [
  { icon: BookOpen, label: 'Notes', color: 'from-blue-500 to-blue-600' },
  { icon: Users, label: 'Absences', color: 'from-orange-500 to-orange-600' },
  { icon: Bell, label: 'Messages', color: 'from-green-500 to-green-600' },
  { icon: CreditCard, label: 'Paiements', color: 'from-purple-500 to-purple-600' },
] as const

export function LandingAccessibilitySection() {
  return (
    <ScrollSection
      id="accessibilite"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-[#f8fafc] py-20 sm:py-24"
    >
      <SectionBackdrop />
      <div className="pointer-events-none absolute right-0 top-1/4 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal direction="left">
            <SectionHeader
              align="left"
              className="mb-8"
              badge="Inclusion & accessibilité"
              badgeIcon={<Globe className="h-3.5 w-3.5" />}
              title={
                <>
                  Interface dédiée aux{' '}
                  <AccentUnderline>parents illettrés</AccentUnderline>
                </>
              }
              description="Nous ne laissons personne de côté. Une interface ultra-simplifiée avec gros boutons, icônes intuitives et lecture audio des informations importantes."
            />

            <ScrollStagger className="space-y-3">
              {LANDING_ACCESSIBILITY_FEATURES.map(item => (
                <ScrollItem key={item}>
                  <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Volume2 className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-relaxed text-gray-700">{item}</p>
                  </div>
                </ScrollItem>
              ))}
            </ScrollStagger>

            <Link
              href="/parent-simple"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
            >
              Voir l&apos;interface simplifiée
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-200/40 to-[#7AB832]/20 blur-sm" />
              <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-orange-500/10 sm:p-8">
                <div className="mb-6 text-center">
                  <p className="text-lg font-black text-gray-900">EduNation</p>
                  <p className="text-sm font-medium text-gray-500">Espace Parent Simplifié</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PARENT_BUTTONS.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      className={cn(
                        'flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br p-5 text-white shadow-md transition hover:scale-[1.02] hover:opacity-95',
                        item.color
                      )}
                    >
                      <item.icon className="h-8 w-8" />
                      <span className="text-base font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  <Volume2 className="h-4 w-4 text-orange-500" />
                  Lire cette page
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </ScrollSection>
  )
}
