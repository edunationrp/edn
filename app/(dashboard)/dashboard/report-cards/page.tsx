import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { FileText, Plus, Download, QrCode, CheckCircle, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

type ReportCard = {
  id: string
  student_id: string
  term: string
  average: number | null
  rank: number | null
  is_published: boolean
  is_locked: boolean
  hash: string | null
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
      ? supabase.from('report_cards').select('id, student_id, term, average, rank, is_published, is_locked, hash, created_at, students(first_name, last_name)').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(50)
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
  const lockedCount = reportCards.filter(r => r.is_locked).length
  const pendingCount = reportCards.filter(r => !r.is_published && !r.is_locked).length

  const isAdmin = ['PROVISEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR', 'SUPER_ADMIN_EDUNATION'].includes(ctx?.role_code ?? '')

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Bulletins Scolaires"
        description={`Génération, publication et archivage${currentYear ? ` · ${currentYear.name}` : ''}`}
        actions={
          isAdmin ? (
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
          title="Bulletins verrouillés"
          value={lockedCount}
          icon={<Lock className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="En attente"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Workflow de génération */}
      {isAdmin && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workflow de génération des bulletins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { step: '1', label: 'Saisie des notes', icon: <FileText className="h-4 w-4" />, done: lockedCount > 0 || publishedCount > 0 },
                { step: '2', label: 'Calcul des moyennes', icon: <CheckCircle className="h-4 w-4" />, done: lockedCount > 0 },
                { step: '3', label: 'Validation proviseur', icon: <Lock className="h-4 w-4" />, done: lockedCount > 0 },
                { step: '4', label: 'Génération PDF', icon: <Download className="h-4 w-4" />, done: publishedCount > 0 },
                { step: '5', label: 'Publication parents', icon: <QrCode className="h-4 w-4" />, done: publishedCount > 0 },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    s.done ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {s.icon}
                    {s.step}. {s.label}
                  </div>
                  {i < 4 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Génération par classe */}
      {isAdmin && classes.length > 0 && (
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

      {/* Liste des bulletins */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Bulletins récents ({reportCards.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {reportCards.length > 0 ? (
            <>
              <div className="divide-y sm:hidden">
                {reportCards.map(rc => {
                  const name = rc.students
                    ? `${rc.students.last_name} ${rc.students.first_name}`
                    : 'Élève inconnu'
                  return (
                    <div key={rc.id} className="px-1 py-3">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rc.term} · {rc.average !== null ? `${rc.average.toFixed(2)}/20` : '—'}
                        {rc.rank ? ` · Rang ${rc.rank}` : ''}
                      </p>
                      <div className="mt-2">
                        {rc.is_published ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Publié</Badge>
                        ) : rc.is_locked ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Verrouillé</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">En attente</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Élève</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trimestre</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Moyenne</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Rang</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Statut</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Authentification</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCards.map(rc => {
                    const name = rc.students
                      ? `${rc.students.last_name} ${rc.students.first_name}`
                      : 'Élève inconnu'
                    return (
                    <tr key={rc.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-sm font-medium">{name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className="text-xs">{rc.term}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold">
                        {rc.average !== null ? `${rc.average.toFixed(2)}/20` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">{rc.rank ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        {rc.is_published ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Publié
                          </Badge>
                        ) : rc.is_locked ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Verrouillé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {rc.hash ? (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            <QrCode className="h-3 w-3 mr-1" />
                            QR Code
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/report-cards/${rc.id}`}>
                            Voir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun bulletin généré</p>
              {isAdmin && (
                <Button variant="link" size="sm" asChild>
                  <Link href="/dashboard/report-cards/generate">Générer les premiers bulletins</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
