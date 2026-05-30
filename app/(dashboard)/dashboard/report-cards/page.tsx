import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { FileText, Plus, QrCode, CheckCircle, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import { ReportCardsTable } from '@/features/report-cards/report-cards-table'
import { ReportCardValidationPanel } from '@/features/report-cards/report-card-validation-panel'
import { ReportCardPublicationPanel } from '@/features/report-cards/report-card-publication-panel'
import {
  getReportCardsAwaitingPublication,
  getReportCardsForValidationQueue,
} from '@/lib/actions/report-cards'
import { resolveReportCardStatus } from '@/lib/report-cards/workflow'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

type ReportCard = {
  id: string
  student_id: string
  term: string
  average: number | null
  rank: number | null
  is_published: boolean
  is_locked: boolean
  hash: string | null
  qr_hash?: string | null
  status: string | null
  created_at: string
  students?: { first_name: string; last_name: string } | null
}

export default async function ReportCardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id

  const [reportCardsResult, yearsResult, classesResult] = await Promise.all([
    schoolId
      ? supabase.from('report_cards').select('id, student_id, term, term_id, average, rank, is_published, is_locked, hash, qr_hash, status, serial_number, created_at, students(first_name, last_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1)
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
  ])

  const reportCards = (reportCardsResult.data as ReportCard[] | null) ?? []
  const years = (yearsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const classes = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = years[0]

  const publishedCount = reportCards.filter(r => r.is_published).length
  const validatedCount = reportCards.filter(r => r.status === 'validated' && !r.is_published).length
  const awaitingValidationCount = reportCards.filter(
    r => r.status === 'generated' || r.status === 'correction_requested',
  ).length

  const role = (ctx?.role_code ?? '') as UserRole
  const canGenerate = hasPermission(role, 'report_cards:generate')
  const canValidate = hasPermission(role, 'report_cards:validate')
  const canPublish = hasPermission(role, 'report_cards:publish')

  const [validationQueue, publicationQueue] = await Promise.all([
    canValidate ? getReportCardsForValidationQueue() : Promise.resolve([]),
    canPublish ? getReportCardsAwaitingPublication() : Promise.resolve([]),
  ])

  const reportCardRows = reportCards.map(rc => ({
    id: rc.id,
    term: rc.term,
    average: rc.average,
    rank: rc.rank,
    is_locked: rc.is_locked,
    is_published: rc.is_published,
    workflowStatus: resolveReportCardStatus(rc.status, rc.is_published),
    hash: rc.hash ?? rc.qr_hash ?? null,
    studentName: rc.students
      ? `${rc.students.last_name} ${rc.students.first_name}`
      : 'Élève inconnu',
  }))

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Bulletins Scolaires"
        description={`Génération, publication et archivage${currentYear ? ` · ${currentYear.name}` : ''}`}
        actions={
          canGenerate ? (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/report-cards/generate">
                <Plus className="h-4 w-4 mr-1" />
                Générer les bulletins
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Bulletins publiés"
          value={publishedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Validés (à publier)"
          value={validatedCount}
          icon={<Lock className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="En attente proviseur"
          value={awaitingValidationCount}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {canValidate && <ReportCardValidationPanel items={validationQueue} />}
      {canPublish && <ReportCardPublicationPanel items={publicationQueue} />}

      {(canGenerate || canValidate) && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workflow des bulletins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { step: '1', label: 'Génération secrétariat', icon: <FileText className="h-4 w-4" />, done: reportCards.length > 0 },
                { step: '2', label: 'Validation proviseur', icon: <Lock className="h-4 w-4" />, done: validatedCount > 0 || publishedCount > 0 },
                { step: '3', label: 'Publication familles', icon: <QrCode className="h-4 w-4" />, done: publishedCount > 0 },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    s.done ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {s.icon}
                    {s.step}. {s.label}
                  </div>
                  {i < 2 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Génération par classe */}
      {canGenerate && classes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Générer par classe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {classes.map(cls => (
                <Link
                  key={cls.id}
                  href={`/dashboard/report-cards/generate?class=${cls.id}`}
                  className="group p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {cls.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">Générer</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ReportCardsTable reportCards={reportCardRows} />
    </div>
  )
}
