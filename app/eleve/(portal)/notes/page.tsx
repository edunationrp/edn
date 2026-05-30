import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchPublishedStudentGrades } from '@/lib/grades/published-notes'
import { StudentPublishedNotesView } from '@/features/grades/student-published-notes-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes notes — EduNation' }

export default async function EleveNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string } | null
  if (!student) redirect('/login/eleve')

  const terms = await fetchPublishedStudentGrades(supabase, student.id)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes notes</h1>
        <p className="text-sm text-muted-foreground">
          Notes publiées par vos professeurs — devoir par devoir ou bulletin trimestriel.
        </p>
      </div>

      <StudentPublishedNotesView terms={terms} />
    </div>
  )
}
