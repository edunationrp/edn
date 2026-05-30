import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import { fetchPublishedStudentGrades } from '@/lib/grades/published-notes'
import { StudentPublishedNotesView } from '@/features/grades/student-published-notes-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notes — Espace parent' }

export default async function ParentNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Notes de l'enfant" />
  }

  const terms = await fetchPublishedStudentGrades(supabase, activeChild.studentId)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Notes</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.className ?? 'Classe'} · {activeChild.schoolName}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Seules les notes publiées par l&apos;établissement sont affichées (devoir par devoir ou bulletin complet).
        </p>
      </div>

      <StudentPublishedNotesView terms={terms} />
    </div>
  )
}
