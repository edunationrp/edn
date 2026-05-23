import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Mail,
  MapPin,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react'
import { LogoSVG } from '@/components/brand/logo'
import { ScrollReveal } from '@/components/motion/scroll-effects'

const PLATFORM_LINKS = [
  { href: '/cours-sujets', label: 'Cours & Sujets gratuits', icon: BookOpen },
  { href: '/actualites', label: 'Actualités', icon: Newspaper },
  { href: '/etablissements', label: 'Établissements', icon: Building2 },
  { href: '/#fonctionnalites', label: 'Fonctionnalités', icon: Sparkles },
] as const

const ACCOUNT_LINKS = [
  { href: '/register/school', label: 'Inscrire mon école' },
  { href: '/login', label: 'Connexion' },
  { href: '/parent-simple', label: 'Interface parents' },
] as const

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-[#0a1628] text-gray-400">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#1a4d2e]/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#1B3A6B]/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7AB832]/8 blur-3xl" />
      </div>

      <div className="relative border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <ScrollReveal direction="scale">
          <div className="overflow-hidden rounded-3xl border border-[#7AB832]/20 bg-linear-to-br from-[#1a4d2e]/90 via-[#1B3A6B]/90 to-[#0f2447] p-6 shadow-2xl shadow-black/20 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7AB832]">
                Rejoignez le mouvement
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                Digitalisez votre établissement dès aujourd&apos;hui
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                Essai gratuit 14 jours · Notes, bulletins, finances et communication parents — tout en un seul espace.
              </p>
            </div>
            <Link
              href="/register/school"
              className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f5c842] px-6 py-3.5 text-sm font-bold text-[#1a4d2e] transition hover:bg-yellow-400 lg:mt-0"
            >
              Inscrire mon école
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid min-w-0 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-4">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B3A6B] shadow-lg shadow-black/20 transition group-hover:scale-105">
                <LogoSVG width={28} height={28} />
              </div>
              <div>
                <span className="block text-xl font-extrabold tracking-tight text-white">
                  Edu<span className="text-[#7AB832]">Nation</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Éduquer · Gérer · Connecter
                </span>
              </div>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-gray-400">
              Former aujourd&apos;hui les leaders de demain. Plateforme numérique multi-établissements conçue pour
              les collèges et lycées du Burkina Faso.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300">
              <MapPin className="h-3.5 w-3.5 text-[#7AB832]" />
              Ouagadougou · Burkina Faso
            </div>
          </div>

          <div className="min-w-0 lg:col-span-2 lg:col-start-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Plateforme</h3>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map(link => {
                const Icon = link.icon
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2.5 text-sm text-gray-400 transition hover:text-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-500 ring-1 ring-white/8 transition group-hover:bg-[#7AB832]/15 group-hover:text-[#7AB832] group-hover:ring-[#7AB832]/20">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Compte</h3>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-[#7AB832]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Contact</h3>
            <div className="mt-4 space-y-4">
              <a
                href="mailto:support@algocodebf.com"
                className="group flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4 transition hover:border-[#7AB832]/25 hover:bg-white/6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a4d2e]/30 text-[#7AB832]">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold leading-snug text-white">
                    support@algocodebf.com
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">Réponse sous 24 h ouvrées</p>
                </div>
              </a>
              <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B3A6B]/50 text-[#7AB832]">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-white">Données strictement isolées</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                    Chaque établissement dispose de son propre espace sécurisé
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/8 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500 sm:text-left">
            © {year} EduNation. Tous droits réservés. Conçu pour les établissements du Burkina Faso.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <Link href="/login" className="text-gray-500 transition hover:text-white">
              Connexion
            </Link>
            <Link href="/register/school" className="text-gray-500 transition hover:text-white">
              Inscription école
            </Link>
            <Link href="/parent-simple" className="inline-flex items-center gap-1.5 text-gray-500 transition hover:text-white">
              <Users className="h-3.5 w-3.5" />
              Espace parents
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
