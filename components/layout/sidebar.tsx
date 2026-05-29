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
  Home, Clock, Grid, Archive,
  Megaphone,
} from 'lucide-react'
import { LogoSVG } from '@/components/brand/logo'
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
  archive: <Archive className="h-4 w-4" />,
  megaphone: <Megaphone className="h-4 w-4" />,
}

// Configurations des rôles (identiques au HTML)
const ROLE_NAV: Record<string, { label: string; nav: Array<{ group: string; items: Array<{ id: string; label: string; icon: string; href: string; badge?: string; badgeColor?: string }> }> }> = {
  SUPER_ADMIN_EDUNATION: {
    label: 'Plateforme SaaS',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'platform', label: 'Vue plateforme', icon: 'shield', href: '/dashboard/platform' },
        { id: 'rapports', label: 'Rapports globaux', icon: 'chart', href: '/dashboard/platform/reports' },
      ]},
      { group: 'Établissements', items: [
        { id: 'schools', label: 'Établissements', icon: 'school', href: '/dashboard/platform/schools' },
        { id: 'organizations', label: 'Organisations', icon: 'grid', href: '/dashboard/platform/organizations' },
        { id: 'users', label: 'Utilisateurs', icon: 'users', href: '/dashboard/platform/users' },
      ]},
      { group: 'Système', items: [
        { id: 'audit-logs', label: 'Journaux d\'audit', icon: 'shield', href: '/dashboard/platform/audit-logs' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/platform/settings' },
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
      { group: 'Admissions', items: [
        { id: 'admission-new', label: 'Créer une demande', icon: 'userPlus', href: '/dashboard/admissions/new-request' },
        { id: 'admission-validate', label: 'Dossiers à valider', icon: 'clock', href: '/dashboard/admissions/to-validate' },
        { id: 'admission-archived', label: 'Archives refusées', icon: 'archive', href: '/dashboard/admissions/archived' },
        { id: 'students-registry', label: 'Liste des élèves', icon: 'users', href: '/dashboard/students' },
      ]},
      { group: 'Organisation', items: [
        { id: 'personnel', label: 'Personnel', icon: 'users', href: '/dashboard/staff' },
        { id: 'roles', label: 'Rôles & permissions', icon: 'shield', href: '/dashboard/staff/roles-permissions' },
        { id: 'edt', label: 'Emplois du temps', icon: 'calendar', href: '/dashboard/timetable' },
        { id: 'classes', label: 'Classes & matières', icon: 'grid', href: '/dashboard/classes' },
      ]},
      { group: 'Finances', items: [
        { id: 'budget', label: 'Synthèse finance', icon: 'wallet', href: '/dashboard/finance' },
        { id: 'tuition-official', label: 'Tarifs officiels', icon: 'fileText', href: '/dashboard/finance/tuition' },
      ]},
      { group: 'Système', items: [
        { id: 'audit-logs', label: 'Journaux d\'audit', icon: 'shield', href: '/dashboard/audit-logs' },
      ]},
      { group: 'Communication', items: [
        { id: 'announcements', label: 'Annonces', icon: 'megaphone', href: '/dashboard/communications/announcements' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
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
        { id: 'edt', label: 'Emplois du temps', icon: 'calendar', href: '/dashboard/timetable' },
        { id: 'classes', label: 'Classes & matières', icon: 'grid', href: '/dashboard/classes' },
      ]},
      { group: 'Pédagogie', items: [
        { id: 'notes', label: 'Notes', icon: 'fileCheck', href: '/dashboard/grades' },
        { id: 'bulletins', label: 'Bulletins', icon: 'award', href: '/dashboard/report-cards' },
      ]},
      { group: 'Communication', items: [
        { id: 'announcements-da', label: 'Annonces', icon: 'megaphone', href: '/dashboard/communications/announcements' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
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
        { id: 'edt', label: 'Emplois du temps', icon: 'calendar', href: '/dashboard/timetable' },
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
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
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
        { id: 'admis-payer', label: 'Admis à encaisser', icon: 'userPlus', href: '/dashboard/admissions/admitted' },
        { id: 'nouveau-paiement', label: 'Nouveau paiement', icon: 'wallet', href: '/dashboard/finance/payments/new' },
        { id: 'paiements', label: 'Historique paiements', icon: 'fileText', href: '/dashboard/finance/payments' },
      ]},
      { group: 'Reporting', items: [
        { id: 'rapports-int', label: 'Rapports financiers', icon: 'fileText', href: '/dashboard/finance' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'mail', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
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
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
      ]},
    ],
  },
  SECRETAIRE: {
    label: 'Secrétaire',
    nav: [
      { group: 'Pilotage', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
      ]},
      { group: 'Admissions & dossiers', items: [
        { id: 'to-process', label: 'Dossiers à traiter', icon: 'clock', href: '/dashboard/admissions/to-process' },
        { id: 'admission-archived', label: 'Archives refusées', icon: 'archive', href: '/dashboard/admissions/archived' },
        { id: 'registre', label: 'Liste des élèves', icon: 'users', href: '/dashboard/students' },
        { id: 'suivi-finance', label: 'Suivi admissions validées', icon: 'wallet', href: '/dashboard/admissions/admitted' },
        { id: 'link-requests', label: 'Rattachements parents', icon: 'link', href: '/dashboard/parents/link-requests' },
      ]},
      { group: 'Documents', items: [
        { id: 'attestations', label: 'Attestations', icon: 'fileCheck', href: '/dashboard/report-cards' },
      ]},
      { group: 'Communication', items: [
        { id: 'announcements-sec', label: 'Annonces', icon: 'megaphone', href: '/dashboard/communications/announcements' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'send', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
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
        { id: 'announcements-v', label: 'Annonces', icon: 'megaphone', href: '/dashboard/communications/announcements' },
        { id: 'notif-parents', label: 'Notifications parents', icon: 'mail', href: '/dashboard/messages' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'messages', label: 'Messagerie', icon: 'send', href: '/dashboard/messages' },
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
      ]},
    ],
  },
  PROFESSEUR: {
    label: 'Professeur',
    nav: [
      { group: "Aujourd'hui", items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'edt-p', label: 'Mon emploi du temps', icon: 'calendar', href: '/dashboard/timetable' },
      ]},
      { group: 'Enseignement', items: [
        { id: 'classes', label: 'Mes classes', icon: 'users', href: '/dashboard/classes' },
        { id: 'saisie-notes', label: 'Saisie des notes', icon: 'fileCheck', href: '/dashboard/grades/entry' },
        { id: 'appel', label: 'Appel des élèves', icon: 'userCheck', href: '/dashboard/attendance/take' },
        { id: 'cours', label: 'Ressources de cours', icon: 'book', href: '/dashboard/cours' },
      ]},
      { group: 'Communication', items: [
        { id: 'parents', label: 'Messages', icon: 'mail', href: '/dashboard/messages' },
      ]},
      { group: 'Espace personnel', items: [
        { id: 'settings', label: 'Paramètres', icon: 'settings', href: '/dashboard/settings' },
      ]},
    ],
  },
  PARENT: {
    label: 'Parent',
    nav: [
      { group: 'Mon espace', items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: 'home', href: '/dashboard' },
        { id: 'enfants', label: 'Mes enfants', icon: 'user', href: '/dashboard/mes-enfants' },
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
}

interface SidebarProps {
  userRole: string
  schoolName?: string
  schoolYear?: string
  userName?: string
  userInitials?: string
  userTitle?: string
  collapsed?: boolean
  mobileOpen?: boolean
  onNavigate?: () => void
}

/** Un seul onglet actif : la route la plus spécifique qui correspond (ex. /payments/new vs /payments). */
function isSidebarNavActive(pathname: string, href: string, allHrefs: string[]): boolean {
  if (pathname === href) return true
  if (href === '/dashboard') return false
  if (!pathname.startsWith(`${href}/`)) return false

  return !allHrefs.some(
    other =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`))
  )
}

export function Sidebar({
  userRole,
  schoolName = 'Mon établissement',
  schoolYear = '2025 — 2026',
  userName = 'Utilisateur',
  userInitials = 'U',
  userTitle = '',
  collapsed = false,
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname()
  const roleCfg = ROLE_NAV[resolveNavRole(userRole)] ?? ROLE_NAV.PROVISEUR
  const allNavHrefs = roleCfg.nav.flatMap(section => section.items.map(item => item.href))
  const initials = userInitials || userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col overflow-y-auto bg-[#1B3A6B] text-white shadow-xl transition-all duration-200 lg:translate-x-0',
        collapsed ? 'w-[72px]' : 'w-[min(88vw,240px)]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand + réduire + accueil site */}
      <div
        className={cn(
          'flex-shrink-0 border-b border-white/10',
          collapsed ? 'px-2 py-4' : 'px-5 pt-5 pb-4'
        )}
      >
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-3' : 'gap-2')}>
          <Link
            href="/"
            title="Retour à l'accueil EduNation"
            className={cn(
              'rounded-xl transition-opacity hover:opacity-90',
              collapsed && 'flex justify-center p-1'
            )}
            onClick={onNavigate}
          >
            {collapsed ? (
              <div className="rounded-xl bg-white/15 p-2">
                <LogoSVG width={26} height={26} />
              </div>
            ) : (
              <BrandLockupDark />
            )}
          </Link>
        </div>

      </div>

      {/* School pill */}
      {!collapsed && (
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
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 py-2 space-y-0.5 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {roleCfg.nav.map((section, i) => (
          <div key={i} className="mb-1">
            {!collapsed && (
            <div className="px-2 py-1.5 text-[10px] font-bold tracking-[0.1em] uppercase text-white/35 select-none">
              {section.group}
            </div>
            )}
            {section.items.map(item => {
              const isActive = isSidebarNavActive(pathname, item.href, allNavHrefs)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-all relative',
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2',
                    isActive
                      ? 'bg-[#7AB832] text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <span
                    className={cn(
                      'flex-shrink-0',
                      collapsed ? '[&_svg]:h-5 [&_svg]:w-5' : '[&_svg]:h-4 [&_svg]:w-4',
                      isActive ? 'text-white' : 'text-white/60'
                    )}
                  >
                    {ICON_MAP[item.icon] ?? <Home className="h-4 w-4" />}
                  </span>
                  {!collapsed && (
                  <>
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
                  </>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

      </nav>

      {/* Footer utilisateur */}
      <div className={cn('flex-shrink-0 border-t border-white/10 space-y-1', collapsed ? 'p-2' : 'p-3')}>
        <div
          className={cn(
            'flex items-center rounded-lg hover:bg-white/10 cursor-pointer transition-colors',
            collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2 py-2'
          )}
          title={collapsed ? userName : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {initials}
          </div>
          {!collapsed && (
          <>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate leading-tight">{userName}</div>
            <div className="text-white/40 text-[10px] leading-tight">{userTitle || roleCfg.label}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          </>
          )}
        </div>
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}

export type RoleNavItem = {
  id: string
  label: string
  icon: string
  href: string
  badge?: string
  badgeColor?: string
}

export function flattenRoleNav(role: string): Array<RoleNavItem & { group: string }> {
  const roleCfg = ROLE_NAV[resolveNavRole(role)] ?? ROLE_NAV.PROVISEUR
  return roleCfg.nav.flatMap(section =>
    section.items.map(item => ({ ...item, group: section.group }))
  )
}
