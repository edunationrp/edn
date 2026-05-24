'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User, Shield, Bell, LogOut, Building2, GraduationCap, Calendar,
  Wallet, Users, BookOpen, Heart, LayoutGrid, ChevronRight, School,
  Mail, Phone, Globe, BadgeCheck, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LogoutButton } from '@/components/layout/logout-button'
import { notify } from '@/lib/feedback/toast'
import { SECTION_LABELS } from '@/lib/settings/permissions'
import type {
  NotificationPreferences,
  NotificationTypeKey,
  SettingsPagePayload,
  SettingsSectionId,
  TeachingPreferences,
} from '@/lib/settings/types'
import {
  createSchoolYear,
  setActiveSchoolYear,
  setActiveTerm,
  toggleSchoolActive,
  updateNotificationPreferences,
  updateOrganization,
  updateParentPreferences,
  updateProfile,
  updateSchoolAcademic,
  updateSchoolFinance,
  updateSchoolIdentity,
  updateTeachingPreferences,
} from '@/lib/actions/settings'
import {
  ACCESS_LEVELS,
  ACADEMIC_FORMATS,
  COUNTRIES,
  CURRENCIES,
  EVALUATION_SYSTEMS,
  LANGUAGES,
  SCHOOL_TYPES,
} from '@/lib/onboarding/constants'

const SECTION_ICONS: Partial<Record<SettingsSectionId, React.ReactNode>> = {
  overview: <LayoutGrid className="h-4 w-4" />,
  profile: <User className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  'school-identity': <Building2 className="h-4 w-4" />,
  'school-academic': <GraduationCap className="h-4 w-4" />,
  'school-calendar': <Calendar className="h-4 w-4" />,
  'school-finance': <Wallet className="h-4 w-4" />,
  organization: <School className="h-4 w-4" />,
  'access-management': <Users className="h-4 w-4" />,
  'parent-space': <Heart className="h-4 w-4" />,
  teaching: <BookOpen className="h-4 w-4" />,
  shortcuts: <ChevronRight className="h-4 w-4" />,
  session: <LogOut className="h-4 w-4" />,
}

const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeKey, string> = {
  payment: 'Paiements & frais',
  grade: 'Notes & bulletins',
  attendance: 'Absences & retards',
  announcement: 'Annonces',
  message: 'Messages',
  system: 'Système & compte',
}

type SettingsClientProps = {
  data: SettingsPagePayload
}

function accessFor(data: SettingsPagePayload, id: SettingsSectionId) {
  return data.sections.find(s => s.id === id)?.access ?? 'none'
}

function ReadOnlyBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <Badge variant="outline" className="text-xs font-normal">
      Lecture seule
    </Badge>
  )
}

function SettingsCard({
  id,
  title,
  description,
  icon,
  readOnly,
  children,
}: {
  id: SettingsSectionId
  title: string
  description?: string
  icon?: React.ReactNode
  readOnly?: boolean
  children: React.ReactNode
}) {
  return (
    <Card id={`settings-${id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          <ReadOnlyBadge show={!!readOnly} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

function ShortcutLink({ href, label, description }: { href: string; label: string; description?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function SettingsClient({ data }: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const defaultTab = data.sections[0]?.id ?? 'profile'

  const [profileForm, setProfileForm] = useState(data.profile)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(data.preferences.notifications)
  const [teachingPrefs, setTeachingPrefs] = useState<TeachingPreferences>(
    data.preferences.teaching ?? {
      notify_grade_submissions: true,
      notify_attendance_reminders: true,
      compact_grade_entry: false,
    }
  )
  const [parentForm, setParentForm] = useState({
    preferredLanguage: data.parentProfile?.preferredLanguage ?? 'fr',
    simplifiedInterface: data.preferences.parent?.simplified_interface ?? data.role === 'PARENT_ILLETRE',
    notifySmsFallback: data.preferences.parent?.notify_sms_fallback ?? false,
  })

  const [schoolIdentity, setSchoolIdentity] = useState({
    name: data.school?.name ?? '',
    structureName: data.school?.structure_name ?? '',
    type: data.school?.type ?? 'lycee',
    address: data.school?.address ?? '',
    city: data.school?.city ?? '',
    province: data.school?.province ?? '',
    country: data.school?.country ?? 'Burkina Faso',
    phone: data.school?.phone ?? '',
    email: data.school?.email ?? '',
    motto: data.school?.motto ?? '',
    logoUrl: data.school?.logo_url ?? '',
    isActive: data.school?.is_active ?? true,
  })

  const [schoolAcademic, setSchoolAcademic] = useState({
    evaluationSystem: data.school?.evaluation_system ?? 'sur_20',
    mainLanguage: data.school?.main_language ?? 'fr',
    academicFormat: data.school?.academic_format ?? 'trimestre',
    accessLevel: data.school?.access_level ?? 'prive',
    estimatedStudents: data.school?.estimated_students?.toString() ?? '',
  })

  const [schoolFinance, setSchoolFinance] = useState({
    currency: data.school?.currency ?? 'XOF',
  })

  const [organizationForm, setOrganizationForm] = useState({
    name: data.organization?.name ?? '',
    logoUrl: data.organization?.logo_url ?? '',
  })

  const [newYear, setNewYear] = useState({ name: '', startDate: '', endDate: '' })

  const activeYear = useMemo(
    () => data.schoolYears.find(y => y.is_active) ?? data.schoolYears[0],
    [data.schoolYears]
  )

  const activeYearTerms = useMemo(
    () => (activeYear ? data.terms.filter(t => t.school_year_id === activeYear.id) : []),
    [data.terms, activeYear]
  )

  function runAction(action: () => Promise<{ error?: string; success?: boolean }>, successMsg: string) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        notify.error(result.error, 'settings')
        return
      }
      notify.success(successMsg)
      router.refresh()
    })
  }

  const roleShortcuts = useMemo(() => {
    const common = [
      { href: '/dashboard/notifications', label: 'Centre de notifications', description: 'Historique des alertes' },
    ]
    const byRole: Record<string, Array<{ href: string; label: string; description?: string }>> = {
      PROVISEUR: [
        { href: '/dashboard/students', label: 'Élèves', description: 'Inscriptions et dossiers' },
        { href: '/dashboard/students/pending', label: 'Inscriptions en attente', description: 'Validation des dossiers' },
        { href: '/dashboard/staff/roles-permissions', label: 'Rôles & permissions', description: 'Matrice des droits' },
        { href: '/dashboard/staff/roles-permissions?tab=invitations', label: 'Invitations personnel', description: 'Accès équipe' },
        { href: '/dashboard/grades/entry', label: 'Saisie des notes', description: 'Saisie directe' },
        { href: '/dashboard/grades/validate', label: 'Validation des notes', description: 'Contrôle pédagogique' },
        { href: '/dashboard/report-cards/generate', label: 'Bulletins', description: 'Génération & publication' },
        { href: '/dashboard/attendance/take', label: 'Faire l\'appel', description: 'Présences du jour' },
        { href: '/dashboard/finance/payments/new', label: 'Nouveau paiement', description: 'Enregistrer un encaissement' },
        { href: '/dashboard/finance', label: 'Finance', description: 'Frais et paiements' },
        { href: '/dashboard/classes', label: 'Classes & matières', description: 'Structure pédagogique' },
        { href: '/dashboard/audit-logs', label: 'Journaux d\'audit', description: 'Historique des actions' },
      ],
      FONDATEUR: [
        { href: '/dashboard/students', label: 'Élèves' },
        { href: '/dashboard/staff/roles-permissions?tab=invitations', label: 'Invitations personnel' },
        { href: '/dashboard/finance', label: 'Finance' },
      ],
      CENSEUR: [
        { href: '/dashboard/grades/validate', label: 'Validation des notes' },
        { href: '/dashboard/report-cards', label: 'Bulletins' },
        { href: '/dashboard/attendance', label: 'Présences' },
      ],
      INTENDANT: [
        { href: '/dashboard/finance', label: 'Tableau finance' },
        { href: '/dashboard/finance/fees/new', label: 'Nouvelle grille de frais' },
        { href: '/dashboard/finance/payments', label: 'Paiements' },
      ],
      SECRETAIRE: [
        { href: '/dashboard/students/new', label: 'Nouvelle inscription' },
        { href: '/dashboard/students', label: 'Liste des élèves' },
        { href: '/dashboard/staff/roles-permissions?tab=invitations', label: 'Invitations (consultation)' },
      ],
      PROFESSEUR: [
        { href: '/dashboard/grades/entry', label: 'Saisie des notes' },
        { href: '/dashboard/attendance/take', label: 'Prise de présence' },
        { href: '/dashboard/messages', label: 'Messages' },
      ],
      PARENT: [
        { href: '/dashboard/grades', label: 'Notes de mes enfants' },
        { href: '/dashboard/finance/payments', label: 'Paiements' },
        { href: '/dashboard/messages', label: 'Messages école' },
      ],
      PARENT_ILLETRE: [
        { href: '/dashboard/grades', label: 'Notes (vue simplifiée)' },
        { href: '/dashboard/finance/payments', label: 'Paiements' },
      ],
      CONSEILLER: [
        { href: '/dashboard/students', label: 'Suivi élèves' },
        { href: '/dashboard/attendance', label: 'Assiduité' },
      ],
      VIE_SCOLAIRE: [
        { href: '/dashboard/attendance', label: 'Présences' },
        { href: '/dashboard/attendance/history', label: 'Historique absences' },
      ],
    }
    return [...(byRole[data.role] ?? []), ...common]
  }, [data.role])

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-1 flex w-full justify-start">
        {data.sections.map(section => (
          <TabsTrigger key={section.id} value={section.id} className="gap-1.5">
            {SECTION_ICONS[section.id]}
            <span className="hidden xs:inline sm:inline">{SECTION_LABELS[section.id]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Vue d'ensemble */}
      {accessFor(data, 'overview') !== 'none' && (
        <TabsContent value="overview">
          <SettingsCard
            id="overview"
            title="Vue d'ensemble"
            description={`Paramètres disponibles pour ${data.roleLabel}`}
            icon={SECTION_ICONS.overview}
          >
            <div className="space-y-4">
              <div className="rounded-xl border bg-gradient-to-br from-blue-50/80 to-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{data.roleLabel}</Badge>
                  <Badge variant="outline">{data.schoolName}</Badge>
                  {data.school && (
                    <Badge variant={data.school.is_active ? 'default' : 'destructive'}>
                      {data.school.is_active ? 'Établissement actif' : 'Établissement inactif'}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {accessFor(data, 'school-identity') === 'edit'
                    ? 'Vous disposez des droits complets sur l\'établissement.'
                    : 'Certaines sections sont en lecture seule selon votre rôle.'}
                </p>
              </div>

              {data.stats && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Élèves', value: data.stats.students },
                    { label: 'Personnel', value: data.stats.staff },
                    { label: 'Classes', value: data.stats.classes },
                    { label: 'Alertes', value: data.stats.unreadNotifications },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg border bg-muted/20 px-3 py-3 text-center">
                      <p className="text-lg font-bold text-[#1B3A6B]">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeYear && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    Année active : <strong>{activeYear.name}</strong>
                    {activeYearTerms.find(t => t.is_active) && (
                      <> — {activeYearTerms.find(t => t.is_active)?.name}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Profil */}
      <TabsContent value="profile">
        <SettingsCard id="profile" title="Mon profil" icon={SECTION_ICONS.profile}>
          <form
            onSubmit={e => {
              e.preventDefault()
              runAction(
                () => updateProfile({
                  fullName: profileForm.fullName,
                  phone: profileForm.phone,
                  country: profileForm.country,
                  preferredLanguage: profileForm.preferredLanguage,
                }),
                'Profil mis à jour'
              )
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={profileForm.fullName}
                onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profileForm.email} disabled className="bg-muted/50" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select
                  value={profileForm.country}
                  onValueChange={v => setProfileForm(p => ({ ...p, country: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.label}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Langue préférée</Label>
              <Select
                value={profileForm.preferredLanguage}
                onValueChange={v => setProfileForm(p => ({ ...p, preferredLanguage: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Rôle : <span className="font-medium text-foreground">{data.roleLabel}</span>
              {' · '}
              Établissement : <span className="font-medium text-foreground">{data.schoolName}</span>
            </div>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Enregistrement…' : 'Enregistrer le profil'}
            </Button>
          </form>
        </SettingsCard>
      </TabsContent>

      {/* Sécurité */}
      <TabsContent value="security">
        <SettingsCard
          id="security"
          title="Sécurité du compte"
          description="Protégez l'accès à votre espace EduNation"
          icon={SECTION_ICONS.security}
        >
          <div className="space-y-4">
            <div className="rounded-lg border px-3 py-3">
              <p className="text-sm font-medium">Mot de passe</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Réinitialisation sécurisée par email — aucun mot de passe en clair n&apos;est stocké.
              </p>
              <Button variant="outline" asChild className="mt-3 w-full sm:w-auto">
                <Link href="/forgot-password">Changer mon mot de passe</Link>
              </Button>
            </div>
            <div className="rounded-lg border px-3 py-3">
              <p className="text-sm font-medium">Email de connexion</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {data.profile.email}
              </p>
            </div>
          </div>
        </SettingsCard>
      </TabsContent>

      {/* Notifications */}
      <TabsContent value="notifications">
        <SettingsCard
          id="notifications"
          title="Préférences d'alertes"
          description="Choisissez comment et quand être informé"
          icon={SECTION_ICONS.notifications}
        >
          <form
            onSubmit={e => {
              e.preventDefault()
              runAction(() => updateNotificationPreferences(notifPrefs), 'Préférences enregistrées')
            }}
            className="space-y-3"
          >
            <ToggleRow
              label="Notifications in-app"
              description="Alertes dans le centre de notifications"
              checked={notifPrefs.in_app_enabled}
              onCheckedChange={v => setNotifPrefs(p => ({ ...p, in_app_enabled: v }))}
            />
            <ToggleRow
              label="Notifications par email"
              description="Résumés et alertes importantes par email"
              checked={notifPrefs.email_enabled}
              onCheckedChange={v => setNotifPrefs(p => ({ ...p, email_enabled: v }))}
            />

            <div className="pt-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Types d&apos;alertes</Label>
              <div className="mt-2 space-y-2">
                {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationTypeKey[]).map(key => (
                  <ToggleRow
                    key={key}
                    label={NOTIFICATION_TYPE_LABELS[key]}
                    checked={notifPrefs.types[key]}
                    onCheckedChange={v =>
                      setNotifPrefs(p => ({
                        ...p,
                        types: { ...p.types, [key]: v },
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Fréquence des emails</Label>
              <Select
                value={notifPrefs.digest}
                onValueChange={v =>
                  setNotifPrefs(p => ({ ...p, digest: v as NotificationPreferences['digest'] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Immédiat</SelectItem>
                  <SelectItem value="daily">Résumé quotidien</SelectItem>
                  <SelectItem value="weekly">Résumé hebdomadaire</SelectItem>
                  <SelectItem value="none">Aucun email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? 'Enregistrement…' : 'Enregistrer les alertes'}
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard/notifications">Voir mes notifications</Link>
              </Button>
            </div>
          </form>
        </SettingsCard>
      </TabsContent>

      {/* Identité établissement */}
      {accessFor(data, 'school-identity') !== 'none' && data.school && (
        <TabsContent value="school-identity">
          <SettingsCard
            id="school-identity"
            title="Identité de l'établissement"
            icon={SECTION_ICONS['school-identity']}
            readOnly={accessFor(data, 'school-identity') === 'view'}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                if (accessFor(data, 'school-identity') !== 'edit') return
                runAction(
                  () => updateSchoolIdentity({
                    name: schoolIdentity.name,
                    structureName: schoolIdentity.structureName,
                    type: schoolIdentity.type,
                    address: schoolIdentity.address,
                    city: schoolIdentity.city,
                    province: schoolIdentity.province,
                    country: schoolIdentity.country,
                    phone: schoolIdentity.phone,
                    email: schoolIdentity.email,
                    motto: schoolIdentity.motto,
                    logoUrl: schoolIdentity.logoUrl,
                  }),
                  'Établissement mis à jour'
                )
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nom officiel</Label>
                  <Input
                    value={schoolIdentity.name}
                    onChange={e => setSchoolIdentity(s => ({ ...s, name: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nom de structure / sigle</Label>
                  <Input
                    value={schoolIdentity.structureName}
                    onChange={e => setSchoolIdentity(s => ({ ...s, structureName: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={schoolIdentity.type}
                    onValueChange={v => setSchoolIdentity(s => ({ ...s, type: v }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Devise (aperçu)</Label>
                  <Input value={data.school.currency} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={schoolIdentity.address}
                    onChange={e => setSchoolIdentity(s => ({ ...s, address: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    value={schoolIdentity.city}
                    onChange={e => setSchoolIdentity(s => ({ ...s, city: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province / Région</Label>
                  <Input
                    value={schoolIdentity.province}
                    onChange={e => setSchoolIdentity(s => ({ ...s, province: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Téléphone</Label>
                  <Input
                    value={schoolIdentity.phone}
                    onChange={e => setSchoolIdentity(s => ({ ...s, phone: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                  <Input
                    type="email"
                    value={schoolIdentity.email}
                    onChange={e => setSchoolIdentity(s => ({ ...s, email: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Slogan / devise scolaire</Label>
                  <Input
                    value={schoolIdentity.motto}
                    onChange={e => setSchoolIdentity(s => ({ ...s, motto: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                    placeholder="Ex. : Excellence et discipline"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>URL du logo</Label>
                  <Input
                    value={schoolIdentity.logoUrl}
                    onChange={e => setSchoolIdentity(s => ({ ...s, logoUrl: e.target.value }))}
                    disabled={accessFor(data, 'school-identity') === 'view'}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {accessFor(data, 'school-identity') === 'edit' && (
                <>
                  <ToggleRow
                    label="Établissement actif"
                    description="Désactiver pour suspendre l'accès (hors super admin)"
                    checked={schoolIdentity.isActive}
                    onCheckedChange={v => {
                      setSchoolIdentity(s => ({ ...s, isActive: v }))
                      runAction(() => toggleSchoolActive(v), v ? 'Établissement activé' : 'Établissement désactivé')
                    }}
                  />
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? 'Enregistrement…' : 'Enregistrer l\'établissement'}
                  </Button>
                </>
              )}
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Pédagogie */}
      {accessFor(data, 'school-academic') !== 'none' && data.school && (
        <TabsContent value="school-academic">
          <SettingsCard
            id="school-academic"
            title="Paramètres pédagogiques"
            icon={SECTION_ICONS['school-academic']}
            readOnly={accessFor(data, 'school-academic') === 'view'}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                if (accessFor(data, 'school-academic') !== 'edit') return
                runAction(
                  () => updateSchoolAcademic({
                    evaluationSystem: schoolAcademic.evaluationSystem,
                    mainLanguage: schoolAcademic.mainLanguage,
                    academicFormat: schoolAcademic.academicFormat,
                    accessLevel: schoolAcademic.accessLevel,
                    estimatedStudents: schoolAcademic.estimatedStudents
                      ? Number(schoolAcademic.estimatedStudents)
                      : null,
                  }),
                  'Paramètres pédagogiques enregistrés'
                )
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Système d&apos;évaluation</Label>
                  <Select
                    value={schoolAcademic.evaluationSystem}
                    onValueChange={v => setSchoolAcademic(s => ({ ...s, evaluationSystem: v }))}
                    disabled={accessFor(data, 'school-academic') === 'view'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVALUATION_SYSTEMS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format académique</Label>
                  <Select
                    value={schoolAcademic.academicFormat}
                    onValueChange={v => setSchoolAcademic(s => ({ ...s, academicFormat: v }))}
                    disabled={accessFor(data, 'school-academic') === 'view'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_FORMATS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Langue principale</Label>
                  <Select
                    value={schoolAcademic.mainLanguage}
                    onValueChange={v => setSchoolAcademic(s => ({ ...s, mainLanguage: v }))}
                    disabled={accessFor(data, 'school-academic') === 'view'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={schoolAcademic.accessLevel}
                    onValueChange={v => setSchoolAcademic(s => ({ ...s, accessLevel: v }))}
                    disabled={accessFor(data, 'school-academic') === 'view'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Effectif estimé (élèves)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={schoolAcademic.estimatedStudents}
                    onChange={e => setSchoolAcademic(s => ({ ...s, estimatedStudents: e.target.value }))}
                    disabled={accessFor(data, 'school-academic') === 'view'}
                  />
                </div>
              </div>
              {accessFor(data, 'school-academic') === 'edit' && (
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? 'Enregistrement…' : 'Enregistrer la pédagogie'}
                </Button>
              )}
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Calendrier */}
      {accessFor(data, 'school-calendar') !== 'none' && (
        <TabsContent value="school-calendar">
          <SettingsCard
            id="school-calendar"
            title="Année scolaire & périodes"
            icon={SECTION_ICONS['school-calendar']}
            readOnly={accessFor(data, 'school-calendar') === 'view'}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Années scolaires</Label>
                <div className="mt-2 space-y-2">
                  {data.schoolYears.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune année configurée.</p>
                  ) : (
                    data.schoolYears.map(year => (
                      <div
                        key={year.id}
                        className="flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{year.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {year.start_date} → {year.end_date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {year.is_active ? (
                            <Badge className="gap-1"><BadgeCheck className="h-3 w-3" /> Active</Badge>
                          ) : accessFor(data, 'school-calendar') === 'edit' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                runAction(() => setActiveSchoolYear(year.id), `${year.name} activée`)
                              }
                            >
                              Activer
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {activeYear && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Périodes — {activeYear.name}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {activeYearTerms.map(term => (
                      <div
                        key={term.id}
                        className="flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{term.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {term.start_date} → {term.end_date}
                          </p>
                        </div>
                        {term.is_active ? (
                          <Badge variant="outline">Période en cours</Badge>
                        ) : accessFor(data, 'school-calendar') === 'edit' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              runAction(() => setActiveTerm(term.id), `${term.name} activée`)
                            }
                          >
                            Activer
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accessFor(data, 'school-calendar') === 'edit' && (
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    runAction(
                      () => createSchoolYear({
                        name: newYear.name,
                        startDate: newYear.startDate,
                        endDate: newYear.endDate,
                      }),
                      'Année scolaire créée'
                    )
                  }}
                  className="space-y-3 rounded-lg border border-dashed p-4"
                >
                  <p className="text-sm font-medium">Créer une nouvelle année</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      placeholder="2025 — 2026"
                      value={newYear.name}
                      onChange={e => setNewYear(y => ({ ...y, name: e.target.value }))}
                      required
                    />
                    <Input
                      type="date"
                      value={newYear.startDate}
                      onChange={e => setNewYear(y => ({ ...y, startDate: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={newYear.endDate}
                      onChange={e => setNewYear(y => ({ ...y, endDate: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={isPending}>
                    Créer l&apos;année et les périodes
                  </Button>
                </form>
              )}
            </div>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Finance */}
      {accessFor(data, 'school-finance') !== 'none' && data.school && (
        <TabsContent value="school-finance">
          <SettingsCard
            id="school-finance"
            title="Paramètres financiers"
            icon={SECTION_ICONS['school-finance']}
            readOnly={accessFor(data, 'school-finance') === 'view'}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                if (accessFor(data, 'school-finance') !== 'edit') return
                runAction(
                  () => updateSchoolFinance({ currency: schoolFinance.currency }),
                  'Devise enregistrée'
                )
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Devise de facturation</Label>
                <Select
                  value={schoolFinance.currency}
                  onValueChange={v => setSchoolFinance({ currency: v })}
                  disabled={accessFor(data, 'school-finance') === 'view'}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {accessFor(data, 'school-finance') === 'edit' && (
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  Enregistrer la devise
                </Button>
              )}
              <div className="space-y-2 pt-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gestion</Label>
                <ShortcutLink href="/dashboard/finance/fees/new" label="Grilles de frais" description="Configurer les tarifs" />
                <ShortcutLink href="/dashboard/finance/payments" label="Paiements" description="Suivi des encaissements" />
              </div>
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Organisation */}
      {accessFor(data, 'organization') !== 'none' && data.organization && (
        <TabsContent value="organization">
          <SettingsCard
            id="organization"
            title="Organisation"
            description="Groupe multi-établissements"
            icon={SECTION_ICONS.organization}
            readOnly={accessFor(data, 'organization') === 'view'}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                if (accessFor(data, 'organization') !== 'edit') return
                runAction(
                  () => updateOrganization({
                    name: organizationForm.name,
                    logoUrl: organizationForm.logoUrl,
                  }),
                  'Organisation mise à jour'
                )
              }}
              className="space-y-4"
            >
              <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <p>Plan : <strong>{data.organization.plan_code}</strong></p>
                <p className="text-muted-foreground">
                  Jusqu&apos;à {data.organization.max_schools} établissement(s)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nom de l&apos;organisation</Label>
                <Input
                  value={organizationForm.name}
                  onChange={e => setOrganizationForm(o => ({ ...o, name: e.target.value }))}
                  disabled={accessFor(data, 'organization') === 'view'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>URL du logo</Label>
                <Input
                  value={organizationForm.logoUrl}
                  onChange={e => setOrganizationForm(o => ({ ...o, logoUrl: e.target.value }))}
                  disabled={accessFor(data, 'organization') === 'view'}
                />
              </div>
              {accessFor(data, 'organization') === 'edit' && (
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  Enregistrer l&apos;organisation
                </Button>
              )}
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Accès & personnel */}
      {accessFor(data, 'access-management') !== 'none' && (
        <TabsContent value="access-management">
          <SettingsCard
            id="access-management"
            title="Accès & personnel"
            description="Gestion des rôles et invitations"
            icon={SECTION_ICONS['access-management']}
            readOnly={accessFor(data, 'access-management') === 'view'}
          >
            <div className="space-y-2">
              <ShortcutLink
                href="/dashboard/staff/roles-permissions"
                label="Rôles & permissions"
                description="Matrice des droits et gestion d'équipe"
              />
              <ShortcutLink
                href="/dashboard/staff/roles-permissions?tab=invitations"
                label="Invitations personnel"
                description="Inviter censeur, professeurs, secrétaire…"
              />
              <ShortcutLink
                href="/dashboard/students"
                label="Élèves & inscriptions"
                description="Accès aux dossiers scolaires"
              />
              {accessFor(data, 'access-management') === 'edit' && (
                <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-3 text-sm text-amber-900">
                  <p className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Droits d&apos;administration complets
                  </p>
                  <p className="mt-1 text-xs">
                    En tant que proviseur, vous pouvez inviter tout le personnel et modifier tous les paramètres de l&apos;établissement.
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Espace parent */}
      {accessFor(data, 'parent-space') !== 'none' && (
        <TabsContent value="parent-space">
          <SettingsCard
            id="parent-space"
            title="Espace parent"
            description="Préférences pour le suivi de vos enfants"
            icon={SECTION_ICONS['parent-space']}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                runAction(
                  () => updateParentPreferences({
                    preferredLanguage: parentForm.preferredLanguage,
                    simplifiedInterface: parentForm.simplifiedInterface,
                    notifySmsFallback: parentForm.notifySmsFallback,
                  }),
                  'Préférences parent enregistrées'
                )
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Langue de l&apos;interface</Label>
                <Select
                  value={parentForm.preferredLanguage}
                  onValueChange={v => setParentForm(p => ({ ...p, preferredLanguage: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="moore">Mooré</SelectItem>
                    <SelectItem value="dioula">Dioula</SelectItem>
                    <SelectItem value="fulfulde">Fulfuldé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ToggleRow
                label="Interface simplifiée"
                description="Gros boutons, moins de texte — recommandé si besoin"
                checked={parentForm.simplifiedInterface}
                onCheckedChange={v => setParentForm(p => ({ ...p, simplifiedInterface: v }))}
                disabled={data.role === 'PARENT_ILLETRE'}
              />
              <ToggleRow
                label="Alertes SMS (secours)"
                description="Recevoir les alertes urgentes par SMS si disponible"
                checked={parentForm.notifySmsFallback}
                onCheckedChange={v => setParentForm(p => ({ ...p, notifySmsFallback: v }))}
              />
              {data.parentProfile && (
                <p className="text-xs text-muted-foreground">
                  Statut compte : {data.parentProfile.literacyLevel === 'illetre' ? 'Interface allégée activée' : 'Standard'}
                </p>
              )}
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                Enregistrer
              </Button>
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Enseignement */}
      {accessFor(data, 'teaching') !== 'none' && (
        <TabsContent value="teaching">
          <SettingsCard
            id="teaching"
            title="Préférences enseignement"
            icon={SECTION_ICONS.teaching}
            readOnly={accessFor(data, 'teaching') === 'view'}
          >
            <form
              onSubmit={e => {
                e.preventDefault()
                if (accessFor(data, 'teaching') !== 'edit') return
                runAction(() => updateTeachingPreferences(teachingPrefs), 'Préférences enregistrées')
              }}
              className="space-y-3"
            >
              <ToggleRow
                label="Rappels de saisie des notes"
                checked={teachingPrefs.notify_grade_submissions}
                onCheckedChange={v => setTeachingPrefs(p => ({ ...p, notify_grade_submissions: v }))}
                disabled={accessFor(data, 'teaching') === 'view'}
              />
              <ToggleRow
                label="Rappels de présence"
                checked={teachingPrefs.notify_attendance_reminders}
                onCheckedChange={v => setTeachingPrefs(p => ({ ...p, notify_attendance_reminders: v }))}
                disabled={accessFor(data, 'teaching') === 'view'}
              />
              <ToggleRow
                label="Saisie compacte des notes"
                description="Affichage dense pour saisie rapide sur mobile"
                checked={teachingPrefs.compact_grade_entry}
                onCheckedChange={v => setTeachingPrefs(p => ({ ...p, compact_grade_entry: v }))}
                disabled={accessFor(data, 'teaching') === 'view'}
              />
              {accessFor(data, 'teaching') === 'edit' && (
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  Enregistrer
                </Button>
              )}
            </form>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Raccourcis */}
      {accessFor(data, 'shortcuts') !== 'none' && (
        <TabsContent value="shortcuts">
          <SettingsCard id="shortcuts" title="Raccourcis" icon={SECTION_ICONS.shortcuts}>
            <div className="space-y-2">
              {roleShortcuts.map(link => (
                <ShortcutLink key={link.href + link.label} {...link} />
              ))}
            </div>
          </SettingsCard>
        </TabsContent>
      )}

      {/* Session */}
      <TabsContent value="session">
        <SettingsCard id="session" title="Session" icon={SECTION_ICONS.session}>
          <div className="[&_button]:w-full [&_button]:justify-center sm:[&_button]:w-auto">
            <LogoutButton />
          </div>
        </SettingsCard>
      </TabsContent>
    </Tabs>
  )
}
