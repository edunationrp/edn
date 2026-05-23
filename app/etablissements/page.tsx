import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/layout/landing-nav'
import { LandingFooter } from '@/components/layout/landing-footer'
import { ScrollReveal } from '@/components/motion/scroll-effects'
import { MarketingMotionProvider } from '@/components/providers/marketing-motion-provider'
import { SchoolsExplorer } from '@/components/marketing/schools-explorer'
import { PageHero } from '@/components/marketing/page-hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Établissements — EduNation',
  description:
    'Découvrez les collèges, lycées et centres de formation qui utilisent EduNation pour moderniser leur gestion scolaire au Burkina Faso.',
}

export default function EtablissementsPage() {
  return (
    <MarketingMotionProvider>
    <div className="min-h-screen bg-white">
      <LandingNav />

      <PageHero
        badge="Établissements"
        title={
          <>
            Les écoles qui construisent
            <span className="block text-[#7AB832]">l&apos;avenir numérique</span>
          </>
        }
        description="Explorez les établissements accompagnés par EduNation à travers le Burkina Faso — collèges, lycées et centres de formation."
        gradient="from-[#1a4d2e] via-[#1B3A6B] to-[#0f2447]"
      />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SchoolsExplorer />
      </main>

      <ScrollReveal direction="scale">
      <section className="bg-[#1B3A6B] py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Votre établissement n&apos;est pas encore listé ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Créez votre espace EduNation en quelques minutes et rejoignez le réseau des établissements connectés.
          </p>
          <Link
            href="/register/school"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7AB832] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#6aa32b] duration-300"
          >
            Inscrire mon école
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      </ScrollReveal>

      <LandingFooter />
    </div>
    </MarketingMotionProvider>
  )
}
