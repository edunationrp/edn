import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreateClassForm } from '@/features/classes/create-class-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouvelle classe' }

export default async function NewClassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  const [levelsResult, yearsResult] = await Promise.all([
    supabase.from('class_levels').select('id, name').eq('school_id', ctx.school_id).order('order_num'),
    supabase.from('school_years').select('id, name').eq('school_id', ctx.school_id).eq('is_active', true).limit(1),
  ])

  const levels = (levelsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const schoolYear = (yearsResult.data as Array<{ id: string; name: string }> | null)?.[0]

  if (!schoolYear) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-medium">Aucune année scolaire active</p>
        <p className="mt-1 text-sm text-muted-foreground">Configurez une année scolaire avant de créer une classe.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader title="Nouvelle classe" description={`Année ${schoolYear.name}`} />
      <CreateClassForm schoolId={ctx.school_id} schoolYearId={schoolYear.id} levels={levels} />
    </div>
  )
}
