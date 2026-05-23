import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/layout/landing-nav'
import { LandingFooter } from '@/components/layout/landing-footer'
import { ScrollReveal } from '@/components/motion/scroll-effects'
import { MarketingMotionProvider } from '@/components/providers/marketing-motion-provider'
import { NewsExplorer } from '@/components/marketing/news-explorer'
import { PageHero } from '@/components/marketing/page-hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Actualités — EduNation',
  description:
    'Actualités éducatives, événements et nouveautés de la plateforme EduNation pour les établissements du Burkina Faso.',
}

export default function ActualitesPage() {
  return (
    <MarketingMotionProvider>
    <div className="min-h-screen bg-white">
      <LandingNav />

      <PageHero
        badge="Actualités"
        title={
          <>
            L&apos;éducation avance,
            <span className="block text-[#7AB832]">EduNation vous informe</span>
          </>
        }
        description="Découvrez les dernières nouvelles sur la digitalisation scolaire, les retours d'expérience des établissements et les évolutions de la plateforme."
      />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <NewsExplorer />
      </main>

      <ScrollReveal direction="scale">
      <section className="bg-[#1a4d2e] py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Prêt à moderniser votre établissement ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-green-100">
            Rejoignez les écoles qui transforment déjà leur gestion scolaire avec EduNation.
          </p>
          <Link
            href="/register/school"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5c842] px-6 py-3.5 text-sm font-bold text-[#1a4d2e] transition hover:bg-yellow-400 duration-300"
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
