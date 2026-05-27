import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { GradesValidateClient } from '@/features/grades/grades-validate-client'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Valider les notes' }

export default async function GradesValidatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const role = ctx.role_code
  const isAdmin = ['DIRECTEUR_ADJOINT', 'CENSEUR', 'SUPER_ADMIN_EDUNATION'].includes(role ?? '')
  if (!isAdmin) redirect('/dashboard/grades')

  const { data: evalsRaw } = await supabase
    .from('evaluations')
    .select('id, title, eval_type, eval_date, is_locked')
    .eq('school_id', ctx.school_id)
    .order('eval_date', { ascending: false })
    .limit(50)

  const evaluations = (evalsRaw as Array<{
    id: string; title: string; eval_type: string; eval_date: string; is_locked: boolean
  }> | null) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Valider & verrouiller"
        description="Clôturez les évaluations avant publication des bulletins"
        actions={
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/grades">Retour aux notes</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évaluations ({evaluations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <GradesValidateClient evaluations={evaluations} />
        </CardContent>
      </Card>
    </div>
  )
}
