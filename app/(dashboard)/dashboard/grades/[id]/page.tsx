import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Détail évaluation' }

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const { data: evalRaw } = await supabase
    .from('evaluations')
    .select('id, title, eval_type, max_score, eval_date, term, is_locked, classes(name), subjects(name)')
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const evaluation = (evalRaw as Array<{
    id: string
    title: string
    eval_type: string
    max_score: number
    eval_date: string
    term: string
    is_locked: boolean
    classes: { name: string } | null
    subjects: { name: string } | null
  }> | null)?.[0]

  if (!evaluation) notFound()

  const { count } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .eq('evaluation_id', id)

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={evaluation.title}
        description={`${evaluation.classes?.name ?? 'Classe'} · ${evaluation.subjects?.name ?? 'Matière'}`}
        actions={
          !evaluation.is_locked ? (
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/grades/entry">Saisir les notes</Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{evaluation.eval_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Trimestre</span>
            <span>{evaluation.term}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Note max</span>
            <span>{evaluation.max_score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(evaluation.eval_date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Statut</span>
            {evaluation.is_locked ? (
              <Badge className="bg-green-100 text-green-800">Verrouillée</Badge>
            ) : (
              <Badge variant="outline">En cours</Badge>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notes saisies</span>
            <span>{count ?? 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
