'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { AccentUnderline, SectionBackdrop } from '@/components/marketing/section-header'
import { ScrollReveal, ScrollSection } from '@/components/motion/scroll-effects'

const HIGHLIGHTS = [
  {
    icon: Building2,
    title: 'Espace dédié à votre école',
    text: 'Environnement isolé, sécurisé et configuré pour votre établissement.',
  },
  {
    icon: Users,
    title: 'Équipe & inscriptions',
    text: 'Personnel, inscriptions et validations centralisés.',
  },
  {
    icon: BarChart3,
    title: 'Pilotage en temps réel',
    text: 'Effectifs, notes, finances et alertes en un coup d\'œil.',
  },
  {
    icon: Shield,
    title: 'Confiance & conformité',
    text: 'Données protégées, rôles granulaires et traçabilité.',
  },
] as const

export function EstablishmentLeaderSection() {
  return (
    <ScrollSection
      id="responsable-etablissement"
      className="relative overflow-hidden bg-gradient-to-b from-white via-[#f0f9e8]/35 to-white py-16 sm:py-24"
    >
      <SectionBackdrop />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#7AB832]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#1B3A6B]/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14 xl:gap-16">
          {/* Colonne texte — même hauteur que l'illustration */}
          <ScrollReveal direction="left" className="flex h-full">
            <div className="flex h-full w-full flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#1a4d2e]/15 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a4d2e] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Responsable d&apos;établissement
              </span>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-[2.5rem]">
                Vous êtes responsable{' '}
                <AccentUnderline>d&apos;établissement</AccentUnderline> ?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                EduNation est pensé pour les directeurs, proviseurs et fondateurs qui veulent
                moderniser leur école sans complexité. Centralisez la gestion, gagnez du temps
                et offrez une expérience professionnelle à toute votre communauté scolaire.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {HIGHLIGHTS.map(item => {
                  const Icon = item.icon
                  return (
                    <li
                      key={item.title}
                      className="group flex h-full gap-3 rounded-2xl border border-gray-100/80 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm transition duration-300 hover:border-[#7AB832]/25 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a4d2e]/10 to-[#7AB832]/15 text-[#1a4d2e]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{item.text}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register/school"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a4d2e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a4d2e]/25 transition hover:bg-[#2d6a4f]"
                >
                  Inscrire mon établissement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a4d2e]/20 bg-white px-6 py-3 text-sm font-bold text-[#1a4d2e] transition hover:bg-[#f0f9e8]"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f9e8] px-3 py-1.5 text-[#1a4d2e]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Essai 14 jours
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Sans engagement</span>
                <span className="rounded-full bg-gray-100 px-3 py-1.5">Support local</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Illustration — ratio 4:3 naturel, sans étirement */}
          <ScrollReveal direction="right" className="flex w-full items-center justify-center">
            <div className="relative w-full max-w-xl lg:max-w-none">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#7AB832]/20 via-[#1B3A6B]/10 to-[#f5c842]/15 blur-sm" />

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-white/60 bg-[#f0f4f8] shadow-2xl shadow-[#1B3A6B]/15 ring-1 ring-black/5">
                <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#1a4d2e] via-[#7AB832] to-[#f5c842]" />

                <Image
                  src="/img-section/hero.png"
                  alt="Responsable d'établissement utilisant EduNation sur son bureau"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                <div className="absolute right-4 top-4 z-10 rounded-2xl border border-white/60 bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a4d2e]">
                    Tableau de bord
                  </p>
                  <p className="text-sm font-black text-gray-900">Vue proviseur</p>
                </div>

                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a4d2e] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Prêt en moins de 24 h</p>
                    <p className="text-[11px] text-gray-500">Configuration guidée</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </ScrollSection>
  )
}
