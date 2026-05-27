import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { CourseResourcesManager } from '@/features/cours/course-resources-manager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ressources de cours — EduNation' }

export default async function CoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const { data: classesRaw } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', ctx.school_id)
    .order('name')

  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .order('name')

  const { data: schoolYearRaw } = await supabase
    .from('school_years')
    .select('id, name')
    .eq('school_id', ctx.school_id)
    .eq('is_active', true)
    .single()

  return (
    <div className="space-y-5">
      <PageHeader title="Ressources de cours" description="Publiez des documents pour vos classes" />
      <CourseResourcesManager
        schoolId={ctx.school_id}
        userId={user.id}
        classes={(classesRaw ?? []) as Array<{ id: string; name: string }>}
        subjects={(subjectsRaw ?? []) as Array<{ id: string; name: string }>}
        schoolYearId={schoolYearRaw?.id ?? null}
      />
    </div>
  )
}
