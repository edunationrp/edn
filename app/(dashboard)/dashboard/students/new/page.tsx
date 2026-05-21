import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { StudentEnrollmentForm } from '@/features/students/student-enrollment-form'

export default async function NewStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) redirect('/dashboard')

  // Charger classes et niveaux pour le formulaire
  const [classesResult, levelsResult, yearsResult] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', ctx.school_id).order('name'),
    supabase.from('class_levels').select('id, name, order_num').eq('school_id', ctx.school_id).order('order_num'),
    supabase.from('school_years').select('id, name').eq('school_id', ctx.school_id).eq('is_active', true).limit(1),
  ])

  const classes = (classesResult.data as Array<{ id: string; name: string }> | null) ?? []
  const levels = (levelsResult.data as Array<{ id: string; name: string; order_num: number | null }> | null) ?? []
  const years = (yearsResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = years[0] ?? null

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscrire un nouvel élève</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Remplissez le formulaire pour inscrire un élève et générer son IUN
        </p>
      </div>
      <StudentEnrollmentForm
        schoolId={ctx.school_id}
        currentYear={currentYear}
        classes={classes}
        levels={levels}
      />
    </div>
  )
}
