import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserX,
  Users,
  ArrowRight,
  Megaphone,
  MailWarning,
  Mail,
  GraduationCap,
  TrendingUp,
  Award,
  Wallet,
} from 'lucide-react'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { countUnreadParentConvocations } from '@/lib/parent/communications'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace parent — EduNation',
}

function formatBannerDate(date: Date) {
  return date
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
}

const STAT_CARDS = [
  {
    key: 'moyenne',
    label: 'MOY. GÉNÉRALE',
    hint: 'Consultez les notes',
    href: '/parent/notes',
    icon: TrendingUp,
    iconWrap: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'absences',
    label: 'ABSENCES',
    hint: 'Ce trimestre',
    href: '/parent/absences',
    icon: UserX,
    iconWrap: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'bulletins',
    label: 'BULLETINS',
    hint: 'Publiés',
    href: '/parent/bulletins',
    icon: Award,
    iconWrap: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'paiements',
    label: 'PAIEMENTS',
    hint: 'Voir les paiements',
    href: '/parent/paiements',
    icon: Wallet,
    iconWrap: 'bg-rose-100 text-rose-700',
  },
] as const

export default async function ParentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { parentName, activeChild } = await requireParentPortalAccess(user.id)
  const firstName = parentName.split(' ')[0] ?? 'Parent'

  if (!activeChild) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-[#1B3A6B] px-5 py-6 text-white sm:px-6 sm:py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
            {formatBannerDate(new Date())} · ESPACE PARENT
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bonjour {firstName}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Rattachez un enfant pour consulter sa scolarité.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Users className="h-10 w-10 text-[#1B3A6B]/40" />
            <div>
              <p className="font-medium text-gray-900">Aucun enfant rattaché</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Utilisez l&apos;IUN de votre enfant pour envoyer une demande de liaison à l&apos;école.
              </p>
            </div>
            <Button asChild className="bg-[#7AB832] hover:bg-[#6aa32a]">
              <Link href="/parent/enfants">Rattacher un enfant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { studentId, schoolYearId, schoolId, fullName, className, schoolName } = activeChild

  const unreadConvocations = await countUnreadParentConvocations(user.id, studentId)

  let recentGrades: Array<{ value: number; max_value: number; subjects: { name: string } | null }> = []
  if (schoolYearId) {
    const { data: gradesRaw } = await supabase
      .from('grades')
      .select('value, max_value, subjects(name)')
      .eq('student_id', studentId)
      .eq('school_year_id', schoolYearId)
      .order('created_at', { ascending: false })
      .limit(5)
    recentGrades = (gradesRaw ?? []) as typeof recentGrades
  }

  const [{ count: absenceCount }, { count: bulletinCount }, { data: paymentsRaw }] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'absent'),
    supabase
      .from('report_cards')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'published'),
    supabase
      .from('payments')
      .select('amount, status')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .in('status', ['pending', 'partial', 'overdue']),
  ])

  const pendingAmount = ((paymentsRaw ?? []) as Array<{ amount: number; status: string }>)
    .reduce((sum, payment) => sum + payment.amount, 0)

  const moyenne = recentGrades.length > 0
    ? (
      recentGrades.reduce(
        (acc, grade) => acc + (grade.max_value > 0 ? (grade.value / grade.max_value) * 20 : 0),
        0,
      ) / recentGrades.length
    ).toFixed(1)
    : null

  const statValues: Record<(typeof STAT_CARDS)[number]['key'], string> = {
    moyenne: moyenne ? `${moyenne}/20` : '—',
    absences: String(absenceCount ?? 0),
    bulletins: String(bulletinCount ?? 0),
    paiements: pendingAmount > 0 ? `${Math.round(pendingAmount).toLocaleString('fr-FR')}` : '—',
  }

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#1B3A6B] px-5 py-6 text-white shadow-sm sm:px-6 sm:py-7">
        <div className="relative z-[1] max-w-[85%] sm:max-w-[70%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
            {formatBannerDate(new Date())} · ESPACE PARENT
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bonjour {firstName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-[15px]">
            Suivez la scolarité de{' '}
            <span className="font-semibold text-white">{fullName}</span>
            {' '}en temps réel.
          </p>
          {(className || schoolName) && (
            <p className="mt-1 text-xs text-white/55">
              {[className, schoolName].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              asChild
              size="sm"
              className="h-9 rounded-lg bg-[#7AB832] px-4 text-white hover:bg-[#6aa32a]"
            >
              <Link href="/parent/bulletins">
                <Award className="mr-1.5 h-4 w-4" />
                Voir le bulletin
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-lg border-white/35 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/parent/paiements">
                <Wallet className="mr-1.5 h-4 w-4" />
                Mes paiements
              </Link>
            </Button>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 sm:h-28 sm:w-28"
        >
          <GraduationCap className="h-12 w-12 text-white/25 sm:h-14 sm:w-14" />
        </div>
      </section>

      {unreadConvocations > 0 && (
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  {unreadConvocations} convocation{unreadConvocations > 1 ? 's' : ''} non lue{unreadConvocations > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-800/80">
                  Consultez les messages du staff concernant {fullName}.
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-red-300 bg-white">
              <Link href="/parent/communications">Voir les communications</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STAT_CARDS.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.key} href={card.href} className="group block min-w-0">
              <Card className="h-full border-slate-200/90 shadow-sm transition-shadow group-hover:shadow-md">
                <CardContent className="flex h-full flex-col px-3.5 py-4 sm:px-4 sm:py-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                      {card.label}
                    </p>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconWrap}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl">
                    {statValues[card.key]}
                  </p>
                  <p className="mt-auto pt-3 text-[11px] text-slate-500 sm:text-xs">
                    {card.hint}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {recentGrades.length > 0 && (
        <Card className="border-slate-200/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">
              Dernières notes — {fullName}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
              <Link href="/parent/notes">
                Tout voir
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{grade.subjects?.name ?? 'Matière'}</span>
                <span className="font-semibold text-[#1B3A6B]">
                  {grade.value} / {grade.max_value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-slate-200/90 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3A6B]/10">
                <Mail className="h-4 w-4 text-[#1B3A6B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Messagerie école</p>
                <p className="text-xs text-muted-foreground">Échangez avec le staff de {schoolName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/parent/messages">Ouvrir</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B3A6B]/10">
                <Megaphone className="h-4 w-4 text-[#1B3A6B]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Annonces & réunions</p>
                <p className="text-xs text-muted-foreground">Informations publiées par {schoolName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/parent/communications">Ouvrir</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
