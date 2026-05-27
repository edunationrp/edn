import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/cards/kpi-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { BookOpen, Plus, TrendingUp, ClipboardList, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { EvaluationsTable } from '@/features/grades/evaluations-table'

type GradeRow = {
  id: string
  value: number
  max_value: number
  period: string
  term: string
  is_locked: boolean
  created_at: string
}

type EvalRow = {
  id: string
  title: string
  eval_type: string
  max_score: number
  eval_date: string
  is_locked: boolean
}

export default async function GradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id
  const role = ctx?.role_code

  // Évaluations récentes
  const { data: evalsRaw } = schoolId ? await supabase
    .from('evaluations')
    .select('id, title, eval_type, max_score, eval_date, is_locked')
    .eq('school_id', schoolId)
    .order('eval_date', { ascending: false })
    .limit(20)
    : { data: null }
  const evaluations = (evalsRaw as EvalRow[] | null) ?? []

  // Statistiques de base
  const totalEvals = evaluations.length
  const lockedEvals = evaluations.filter(e => e.is_locked).length
  const pendingEvals = evaluations.filter(e => !e.is_locked).length

  const isTeacher = role === 'PROFESSEUR'
  const isAdmin = ['DIRECTEUR_ADJOINT', 'CENSEUR', 'SUPER_ADMIN_EDUNATION'].includes(role ?? '')

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Notes & Évaluations"
        description="Gestion des évaluations, saisie et validation des notes"
        actions={
          (isTeacher || isAdmin) ? (
            <Button size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/grades/entry">
                <Plus className="h-4 w-4 mr-1" />
                Saisir des notes
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Évaluations totales"
          value={totalEvals}
          icon={<ClipboardList className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Notes verrouillées"
          value={lockedEvals}
          icon={<Lock className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="En attente de saisie"
          value={pendingEvals}
          icon={<AlertCircle className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/grades/entry" className="group">
          <Card className="border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-2 h-full min-h-[100px]">
              <BookOpen className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-medium text-sm group-hover:text-primary transition-colors">Saisir les notes</p>
              <p className="text-xs text-muted-foreground">Entrée manuelle par classe/matière</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/grades/rankings" className="group">
          <Card className="border-dashed border-2 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-2 h-full min-h-[100px]">
              <TrendingUp className="h-6 w-6 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              <p className="font-medium text-sm group-hover:text-blue-500 transition-colors">Classements</p>
              <p className="text-xs text-muted-foreground">Moyennes et rangs par classe</p>
            </CardContent>
          </Card>
        </Link>
        {isAdmin && (
          <Link href="/dashboard/grades/validate" className="group">
            <Card className="border-dashed border-2 hover:border-green-500 hover:bg-green-50/50 transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-2 h-full min-h-[100px]">
                <Lock className="h-6 w-6 text-muted-foreground group-hover:text-green-500 transition-colors" />
                <p className="font-medium text-sm group-hover:text-green-500 transition-colors">Valider & Verrouiller</p>
                <p className="text-xs text-muted-foreground">Clôture des notes par trimestre</p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <EvaluationsTable evaluations={evaluations} />
    </div>
  )
}
