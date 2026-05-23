import { LandingNav } from '@/components/layout/landing-nav'
import { LandingFooter } from '@/components/layout/landing-footer'
import { FeaturesSection } from '@/components/marketing/features-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { LandingAccessibilitySection } from '@/components/marketing/landing-accessibility-section'
import { LandingCtaSection } from '@/components/marketing/landing-cta-section'
import { LandingHeroSection } from '@/components/marketing/landing-hero-section'
import { LandingProblemSolutionSection } from '@/components/marketing/landing-problem-solution-section'
import { LandingStatsSection } from '@/components/marketing/landing-stats-section'
import { MarketingMotionProvider } from '@/components/providers/marketing-motion-provider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EduNation — Plateforme Scolaire Numérique · Burkina Faso',
  description:
    'Plateforme de gestion scolaire pour collèges et lycées du Burkina Faso. Chaque établissement dispose de son espace isolé : élèves, notes, finances et bulletins.',
}

export default function LandingPage() {
  return (
    <MarketingMotionProvider>
      <div className="min-h-screen bg-white">
        <LandingNav />
        <LandingHeroSection />
        <LandingStatsSection />
        <LandingProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <LandingAccessibilitySection />
        <LandingCtaSection />
        <LandingFooter />
      </div>
    </MarketingMotionProvider>
  )
}
