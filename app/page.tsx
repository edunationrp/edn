import Link from 'next/link'
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  FileText,
  Wifi,
  WifiOff,
  Globe,
  CheckCircle,
  ArrowRight,
  Shield,
  Smartphone,
  BarChart3,
  Bell,
  ChevronRight,
} from 'lucide-react'
import { LogoSVG } from '@/components/brand/logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EduNation — Plateforme Scolaire Numérique du Burkina Faso',
  description: 'EduNation numérise la gestion scolaire des collèges et lycées du Burkina Faso. Notes, bulletins, absences, paiements et plus encore.',
}

const features = [
  {
    icon: GraduationCap,
    title: 'Gestion des élèves',
    description: 'Inscriptions, dossiers, IUN unique, validation physique des parents.',
    color: 'bg-green-100 text-green-700',
  },
  {
    icon: BookOpen,
    title: 'Notes & Bulletins',
    description: 'Saisie des notes, calcul automatique, bulletins PDF avec QR code.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Users,
    title: 'Gestion du personnel',
    description: 'Enseignants, administratifs, invitations par lien sécurisé.',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    icon: WifiOff,
    title: 'Mode hors ligne',
    description: 'Saisie des absences sans connexion, synchronisation automatique.',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    icon: CreditCard,
    title: 'Gestion financière',
    description: 'Frais scolaires, paiements, reçus PDF, arriérés, rapports.',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    icon: Globe,
    title: 'Accessibilité multilingue',
    description: 'Interface simplifiée pour parents illettrés : français, mooré, dioula.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Shield,
    title: 'Sécurité RBAC',
    description: 'Contrôle d\'accès strict par rôle, RLS Supabase, audit complet.',
    color: 'bg-red-100 text-red-700',
  },
  {
    icon: BarChart3,
    title: 'Tableaux de bord',
    description: 'KPIs en temps réel, rapports académiques et financiers.',
    color: 'bg-indigo-100 text-indigo-700',
  },
]

const roles = [
  'Proviseur / Directeur',
  'Censeur',
  'Secrétaire',
  'Intendant',
  'Professeur',
  'Vie Scolaire',
  'Conseiller',
  'Parent & Élève',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#1B3A6B] rounded-xl p-1.5 flex items-center justify-center">
                <LogoSVG width={26} height={26} />
              </div>
              <span className="font-extrabold text-xl text-[#1B3A6B] tracking-tight">
                Edu<span className="text-[#7AB832]">Nation</span>
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#fonctionnalites" className="hover:text-[#1a4d2e] transition-colors">Fonctionnalités</a>
            <a href="#roles" className="hover:text-[#1a4d2e] transition-colors">Rôles</a>
            <a href="#accessibilite" className="hover:text-[#1a4d2e] transition-colors">Accessibilité</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-[#1a4d2e] transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register/student"
              className="bg-[#1a4d2e] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2d6a4f] transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a4d2e] via-[#2d6a4f] to-[#1a4d2e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-[#f5c842] animate-pulse" />
              Plateforme conçue pour le Burkina Faso
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              La gestion scolaire{' '}
              <span className="text-[#f5c842]">numérique</span>{' '}
              pour vos établissements
            </h1>
            <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              EduNation connecte les proviseurs, enseignants, parents et élèves
              des collèges et lycées du Burkina Faso sur une seule plateforme
              sécurisée, moderne et accessible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#f5c842] text-[#1a4d2e] font-bold px-8 py-4 rounded-xl hover:bg-yellow-400 transition-colors text-lg"
              >
                Accéder à la plateforme
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/register/student"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Inscrire un élève
              </Link>
            </div>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1440 20 1200 60 720 60C240 60 0 20 0 20L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats rapides */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '12', label: 'Rôles utilisateurs' },
              { value: '43', label: 'Tables de données' },
              { value: '17', label: 'Modules fonctionnels' },
              { value: '100%', label: 'Web responsive' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-black text-[#1a4d2e]">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problème & Solution */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Le problème des écoles africaines aujourd&apos;hui
              </h2>
              <div className="space-y-3">
                {[
                  'Gestion manuelle sur papier, erreurs fréquentes',
                  'Bulletins imprimés en retard ou perdus',
                  'Parents non informés des absences de leurs enfants',
                  'Paiements sans reçus officiels, litiges financiers',
                  'Données dispersées, aucune vue consolidée',
                  'Zones à faible connectivité Internet',
                  'Parents illettrés exclus du suivi scolaire',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                    <p className="text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1a4d2e] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4 text-[#f5c842]">Notre solution</h3>
              <div className="space-y-3">
                {[
                  'Tout numérique : inscriptions, notes, bulletins',
                  'Génération automatique des bulletins PDF avec QR code',
                  'Notifications SMS et push aux parents en temps réel',
                  'Paiements traçables avec reçus PDF officiels',
                  'Dashboards consolidés pour la direction',
                  'Mode hors ligne pour zones sans connexion stable',
                  'Interface simplifiée pour parents illettrés',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#f5c842] mt-0.5 flex-shrink-0" />
                    <p className="text-green-100">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tous les modules dont vous avez besoin</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Une plateforme SaaS multi-établissements complète, sécurisée et évolutive.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(feature => (
              <div key={feature.title} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rôles */}
      <section id="roles" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Un accès adapté à chaque rôle</h2>
            <p className="text-muted-foreground mt-2">
              Contrôle d&apos;accès strict — chaque utilisateur voit uniquement ce dont il a besoin.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roles.map(role => (
              <div key={role} className="bg-white rounded-xl border p-4 text-center hover:border-[#1a4d2e]/30 transition-colors">
                <p className="font-medium text-sm text-gray-800">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibilité */}
      <section id="accessibilite" className="py-16 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Globe className="h-4 w-4" />
                Fonctionnalité unique
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Interface dédiée aux parents illettrés
              </h2>
              <p className="text-gray-600 mb-6">
                Nous ne laissons personne de côté. EduNation propose une interface web ultra-simplifiée
                pour les parents qui ne savent pas lire, avec des gros boutons, des icônes intuitives
                et la lecture audio des informations importantes.
              </p>
              <div className="space-y-3">
                {[
                  '4 gros boutons : Notes, Absences, Messages, Paiements',
                  'Lecture audio automatique des messages (TTS navigateur)',
                  'Support français, mooré, dioula et fulfuldé',
                  'Envoi de messages vocaux depuis le navigateur',
                  'Navigation ultra-simple, pas de menus complexes',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <p className="text-gray-700 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/parent-simple"
                className="inline-flex items-center gap-2 mt-6 bg-orange-500 text-white font-medium px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Voir l&apos;interface simplifiée
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto">
              <div className="text-center mb-6">
                <p className="text-lg font-bold text-gray-900">EduNation</p>
                <p className="text-sm text-muted-foreground">Espace Parent</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: 'Notes', color: 'bg-blue-500' },
                  { icon: Users, label: 'Absences', color: 'bg-orange-500' },
                  { icon: Bell, label: 'Messages', color: 'bg-green-500' },
                  { icon: CreditCard, label: 'Paiements', color: 'bg-purple-500' },
                ].map(item => (
                  <button
                    key={item.label}
                    className={`${item.color} text-white rounded-2xl p-6 flex flex-col items-center gap-3 hover:opacity-90 transition-opacity`}
                  >
                    <item.icon className="h-8 w-8" />
                    <span className="font-bold text-lg">{item.label}</span>
                  </button>
                ))}
              </div>
              <button className="mt-4 w-full bg-gray-100 text-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 text-sm hover:bg-gray-200 transition-colors">
                🔊 Lire cette page
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#1a4d2e] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à numériser votre établissement ?</h2>
          <p className="text-green-200 mb-8 max-w-xl mx-auto">
            Rejoignez EduNation et transformez la gestion scolaire de votre collège ou lycée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#f5c842] text-[#1a4d2e] font-bold px-8 py-4 rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register/student"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/30 font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors"
            >
              Inscrire un élève
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1a4d2e] flex items-center justify-center">
                <span className="text-white font-black text-sm">E</span>
              </div>
              <span className="text-white font-bold">EduNation</span>
            </div>
            <p className="text-sm">© 2024 EduNation. Conçu pour les établissements du Burkina Faso.</p>
            <div className="flex gap-4 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
              <Link href="/parent-simple" className="hover:text-white transition-colors">Interface parents</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
