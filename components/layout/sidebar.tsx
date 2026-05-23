'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLockupDark } from '@/components/brand/logo'
import { LogoutButton } from '@/components/layout/logout-button'
import { resolveNavRole } from '@/lib/dashboard/resolve-role-nav'
import { cn } from '@/lib/utils'
import {
  Users, UserPlus, FileCheck,
  Wallet, Mail, Settings, BarChart2, Link2, Calendar,
  UserX, AlertTriangle, GraduationCap,
  FileText, Building2, Shield, TrendingUp,
  ChevronDown, Folder, Award,
  UserCheck, BookMarked, Send, Book, Compass, Heart,
  Home, Clock, Grid,
} from 'lucide-react'
const ICON_MAP: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  chart: <BarChart2 className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  userPlus: <UserPlus className="h-4 w-4" />,
  fileCheck: <FileCheck className="h-4 w-4" />,
  award: <Award className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
  mail: <Mail className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  school: <Building2 className="h-4 w-4" />,
  trend: <TrendingUp className="h-4 w-4" />,
  grid: <Grid className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  userX: <UserX className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
  truck: <FileText className="h-4 w-4" />,
  box: <Folder className="h-4 w-4" />,
  utensils: <BookMarked className="h-4 w-4" />,
  fileText: <FileText className="h-4 w-4" />,
  compass: <Compass className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  folder: <Folder className="h-4 w-4" />,
  book: <Book className="h-4 w-4" />,
  userCheck: <UserCheck className="h-4 w-4" />,
  send: <Send className="h-4 w-4" />,
  user: <GraduationCap className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
}

// Configurations des rôles (identiques au HTML)
const ROLE_NAV: Record<string, { label: string; nav: Array<{ group: string; items: Array<{ id: string; label: string; icon: string; href: string; badge?: string; badgeColor?: string }> }> }> = {
  SUPER_ADMIN_EDUNATION: {
    label: 'Super Admin',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'rapports', label: 'Rapports globaux', icon: 'chart', href: '/dashboard/finance' },
      ]},
      { group: 'Établissements', items: [
        { id: 'schools', label: 'Établissements', icon: 'school', href: '/dashboard/staff' },
        { id: 'personnel', label: 'Utilisateurs', icon: 'users', href: '/dashboard/staff' },
      ]},
      { group: 'Système', items: [
        { id: 'audit-logs', label: 'Journaux d\'audit', icon: 'shield', href: '/dashboard/audit-logs' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  PROVISEUR: {
    label: 'Proviseur',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'rapports', label: 'Rapports & analyses', icon: 'chart', href: '/dashboard/finance' },
      ]},
      { group: 'École', items: [
        { id: 'personnel', label: 'Personnel', icon: 'users', href: '/dashboard/staff' },
        { id: 'invitations', label: 'Liens d\'inscription', icon: 'link', href: '/dashboard/staff' },
        { id: 'inscriptions', label: 'Inscriptions élèves', icon: 'userPlus', href: '/dashboard/students' },
      ]},
      { group: 'Pédagogie', items: [
        { id: 'notes', label: 'Validation des notes', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'bulletins', label: 'Bulletins & attestations', icon: 'award', href: '/dashboard/report-cards' },
        { id: 'classes', label: 'Classes & matières', icon: 'grid', href: '/dashboard/classes' },
      ]},
      { group: 'Finances', items: [
        { id: 'budget', label: 'Finance', icon: 'wallet', href: '/dashboard/finance' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages', badge: '5', badgeColor: 'red' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  DIRECTEUR_ADJOINT: {
    label: 'Directeur adjoint',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'École', items: [
        { id: 'personnel', label: 'Personnel', icon: 'users', href: '/dashboard/staff' },
        { id: 'inscriptions', label: 'Inscriptions élèves', icon: 'userPlus', href: '/dashboard/students' },
        { id: 'classes', label: 'Classes & matières', icon: 'grid', href: '/dashboard/classes' },
      ]},
      { group: 'Pédagogie', items: [
        { id: 'notes', label: 'Notes', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'bulletins', label: 'Bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  CENSEUR: {
    label: 'Censeur',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Organisation', items: [
        { id: 'edt', label: 'Emplois du temps', icon: 'grid', href: '/dashboard/classes' },
        { id: 'classes', label: 'Classes & affectations', icon: 'users', href: '/dashboard/classes' },
        { id: 'examens', label: 'Examens', icon: 'calendar', href: '/dashboard/grades' },
      ]},
      { group: 'Discipline & assiduité', items: [
        { id: 'absences', label: 'Absences du jour', icon: 'userX', href: '/dashboard/attendance' },
        { id: 'sanctions', label: 'Sanctions', icon: 'alert', href: '/dashboard/attendance' },
      ]},
      { group: 'Notes', items: [
        { id: 'consultation-notes', label: 'Consultation des notes', icon: 'fileCheck', href: '/dashboard/grades' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  INTENDANT: {
    label: 'Intendant',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Caisse', items: [
        { id: 'paiements', label: 'Paiements élèves', icon: 'wallet', href: '/dashboard/finance' },
        { id: 'nouveau-paiement', label: 'Nouveau paiement', icon: 'userPlus', href: '/dashboard/finance/payments/new' },
      ]},
      { group: 'Gestion', items: [
        { id: 'budget-int', label: 'Budget', icon: 'chart', href: '/dashboard/finance' },
        { id: 'structures', label: 'Structures tarifaires', icon: 'fileText', href: '/dashboard/finance' },
      ]},
      { group: 'Reporting', items: [
        { id: 'rapports-int', label: 'Rapports financiers', icon: 'fileText', href: '/dashboard/finance' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  CONSEILLER_EDUCATION: {
    label: 'Conseiller',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Suivi élèves', items: [
        { id: 'dossiers', label: 'Dossiers élèves', icon: 'users', href: '/dashboard/students' },
        { id: 'alertes', label: 'Élèves en alerte', icon: 'alert', href: '/dashboard/students/pending' },
        { id: 'absences-c', label: 'Absences', icon: 'userX', href: '/dashboard/attendance' },
      ]},
      { group: 'Pédagogie', items: [
        { id: 'notes-c', label: 'Notes & résultats', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'bulletins-c', label: 'Bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  SECRETAIRE: {
    label: 'Secrétaire',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Élèves & dossiers', items: [
        { id: 'inscriptions-s', label: 'Inscriptions', icon: 'userPlus', href: '/dashboard/students' },
        { id: 'pending', label: 'En attente validation', icon: 'clock', href: '/dashboard/students/pending' },
      ]},
      { group: 'Documents', items: [
        { id: 'attestations', label: 'Attestations', icon: 'fileCheck', href: '/dashboard/report-cards' },
        { id: 'bulletins-s', label: 'Bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'send', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  SURVEILLANT_GENERAL: {
    label: 'Vie Scolaire',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Assiduité', items: [
        { id: 'absences-v', label: 'Absences à traiter', icon: 'userX', href: '/dashboard/attendance' },
        { id: 'appel', label: 'Faire l\'appel', icon: 'userCheck', href: '/dashboard/attendance/take' },
      ]},
      { group: 'Communication', items: [
        { id: 'notif-parents', label: 'Notifications parents', icon: 'mail', href: '/dashboard/notifications' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'send', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  PROFESSEUR: {
    label: 'Professeur',
    nav: [
      { group: "Aujourd'hui", items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'edt-p', label: 'Mon emploi du temps', icon: 'calendar', href: '/dashboard/classes' },
      ]},
      { group: 'Enseignement', items: [
        { id: 'classes', label: 'Mes classes', icon: 'users', href: '/dashboard/classes' },
        { id: 'saisie-notes', label: 'Saisie des notes', icon: 'fileCheck', href: '/dashboard/grades/entry' },
        { id: 'appel', label: 'Appel des élèves', icon: 'userCheck', href: '/dashboard/attendance/take' },
      ]},
      { group: 'Communication', items: [
        { id: 'parents', label: 'Messages', icon: 'mail', href: '/dashboard/messages' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/notifications' },
      ]},
    ],
  },
  PARENT: {
    label: 'Parent',
    nav: [
      { group: 'Mon espace', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'enfants', label: 'Mes enfants', icon: 'user', href: '/dashboard' },
      ]},
      { group: 'Scolarité', items: [
        { id: 'notes-p', label: 'Notes & résultats', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'absences-p', label: 'Absences', icon: 'userX', href: '/dashboard/attendance' },
        { id: 'bulletins-p', label: 'Bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
      { group: 'Finances', items: [
        { id: 'paiements-p', label: 'Mes paiements', icon: 'wallet', href: '/dashboard/finance' },
      ]},
      { group: 'Communication', items: [
        { id: 'messages-p', label: 'Messages', icon: 'mail', href: '/dashboard/messages' },
      ]},
    ],
  },
  ELEVE: {
    label: 'Élève',
    nav: [
      { group: 'Mon espace', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'edt-e', label: 'Emploi du temps', icon: 'calendar', href: '/dashboard/classes' },
      ]},
      { group: 'Scolarité', items: [
        { id: 'notes-e', label: 'Mes notes', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'absences-e', label: 'Mes absences', icon: 'userX', href: '/dashboard/attendance' },
        { id: 'bulletins-e', label: 'Mes bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
    ],
  },
}

interface SidebarProps {
  userRole: string
  schoolName?: string
  schoolYear?: string
  userName?: string
  userInitials?: string
  userTitle?: string
  mobileOpen?: boolean
  onNavigate?: () => void
}

export function Sidebar({
  userRole,
  schoolName = 'Mon établissement',
  schoolYear = '2025 — 2026',
  userName = 'Utilisateur',
  userInitials = 'U',
  userTitle = '',
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname()
  const roleCfg = ROLE_NAV[resolveNavRole(userRole)] ?? ROLE_NAV.PROVISEUR
  const initials = userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-[min(88vw,240px)] flex-col overflow-y-auto bg-[#1B3A6B] text-white shadow-xl transition-transform duration-200 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLockupDark />
      </div>

      {/* School pill */}
      <div className="mx-3 mt-3 mb-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 cursor-pointer hover:bg-white/15 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[#7AB832]/20 border border-[#7AB832]/40 flex items-center justify-center text-[#7AB832] font-black text-xs flex-shrink-0">
          {schoolName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold truncate leading-tight">{schoolName}</div>
          <div className="text-white/50 text-[10px] leading-tight">Année {schoolYear}</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {roleCfg.nav.map((section, i) => (
          <div key={i} className="mb-1">
            <div className="px-2 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-white/35 select-none">
              {section.group}
            </div>
            {section.items.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-[#7AB832] text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {ICON_MAP[item.icon] ?? <Home className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      item.badgeColor === 'red'
                        ? 'bg-red-500 text-white'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/15 text-white/70'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer utilisateur */}
      <div className="flex-shrink-0 border-t border-white/10 p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate leading-tight">{userName}</div>
            <div className="text-white/40 text-[10px] leading-tight">{userTitle || roleCfg.label}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
