import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import { EditClassForm } from '@/features/classes/edit-class-form'
import { PageHeader } from '@/components/dashboard/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modifier la classe' }

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const [classResult, levelsResult, yearResult] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, capacity, level_id, school_year_id')
      .eq('id', id)
      .eq('school_id', ctx.school_id)
      .limit(1),
    supabase.from('class_levels').select('id, name').eq('school_id', ctx.school_id).order('order_num'),
    supabase
      .from('school_years')
      .select('id, name')
      .eq('school_id', ctx.school_id)
      .eq('is_active', true)
      .limit(1),
  ])

  const cls = (
    classResult.data as Array<{
      id: string
      name: string
      capacity: number | null
      level_id: string
      school_year_id: string
    }> | null
  )?.[0]

  if (!cls) notFound()

  const levels = (levelsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const schoolYear = (yearResult.data as Array<{ id: string; name: string }> | null)?.[0]

  return (
    <div className="mx-auto max-w-xl space-y-4 animate-fade-in">
      <PageHeader title="Modifier la classe" description={cls.name} />
      <EditClassForm
        classId={id}
        schoolId={ctx.school_id}
        schoolYearId={cls.school_year_id || schoolYear?.id || ''}
        levels={levels}
        initial={{
          name: cls.name,
          levelId: cls.level_id,
          capacity: cls.capacity,
        }}
      />
    </div>
  )
}
