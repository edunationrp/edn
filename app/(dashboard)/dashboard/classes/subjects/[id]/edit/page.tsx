import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canManageSubjects } from '@/lib/classes/access'
import { redirect, notFound } from 'next/navigation'
import { EditSubjectForm } from '@/features/classes/edit-subject-form'
import { PageHeader } from '@/components/dashboard/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modifier la matière' }

export default async function EditSubjectPage({
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
  if (!canManageSubjects(ctx.role_code)) redirect('/dashboard/classes')

  const { data: subjectRaw } = await supabase
    .from('subjects')
    .select('id, name, coefficient, is_active')
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const subject = (
    subjectRaw as Array<{
      id: string
      name: string
      coefficient: number
      is_active: boolean
    }> | null
  )?.[0]

  if (!subject) notFound()

  return (
    <div className="mx-auto max-w-xl space-y-4 animate-fade-in">
      <PageHeader title="Modifier la matière" description={subject.name} />
      <EditSubjectForm
        subjectId={id}
        schoolId={ctx.school_id}
        initial={{
          name: subject.name,
          coefficient: subject.coefficient,
          isActive: subject.is_active,
        }}
      />
    </div>
  )
}
