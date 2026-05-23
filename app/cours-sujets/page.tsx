import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LandingNav } from '@/components/layout/landing-nav'
import { LandingFooter } from '@/components/layout/landing-footer'
import { ScrollReveal } from '@/components/motion/scroll-effects'
import { MarketingMotionProvider } from '@/components/providers/marketing-motion-provider'
import { ResourcesExplorer } from '@/components/marketing/resources-explorer'
import { PageHero } from '@/components/marketing/page-hero'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cours & Sujets gratuits — EduNation',
  description:
    'Cours PDF, sujets d\'examen, devoirs et TD gratuits pour tous les élèves du Burkina Faso — collège, lycée, BEPC et BAC. Accès libre sans inscription.',
}

export default function CoursSujetsPage() {
  return (
    <MarketingMotionProvider>
      <div className="min-h-screen bg-white">
        <LandingNav />

        <PageHero
          badge="100 % gratuit · Sans inscription"
          title={
            <>
              Cours &amp; sujets
              <span className="block text-[#7AB832]">pour tous les élèves</span>
            </>
          }
          description="Téléchargez gratuitement des cours PDF, sujets d'examen, devoirs et travaux dirigés — du collège au BAC, toutes matières confondues."
          gradient="from-[#24508f] via-[#1B3A6B] to-[#1a4d2e]"
        />

        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ResourcesExplorer />
        </main>

        <ScrollReveal direction="scale">
          <section className="bg-[#f0f9e8] py-14">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Vous êtes directeur ou enseignant ?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                Publiez vos propres ressources et gérez votre établissement sur EduNation — notes, bulletins et
                communication parents inclus.
              </p>
              <Link
                href="/register/school"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1a4d2e] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#2d6a4f] duration-300"
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
