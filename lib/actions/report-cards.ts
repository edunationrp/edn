'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyStudent } from '@/lib/notifications/notify-students'

export async function publishReportCard(reportCardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const { data: cardRaw } = await supabase
    .from('report_cards')
    .select(`
      id, school_id, student_id, term, period,
      students(user_id, first_name, last_name),
      terms(name)
    `)
    .eq('id', reportCardId)
    .maybeSingle()

  const card = cardRaw as {
    id: string
    school_id: string
    student_id: string
    term: string | null
    period: string | null
    students: { user_id: string | null; first_name: string; last_name: string } | null
    terms: { name: string } | null
  } | null

  if (!card) return { error: 'Bulletin introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('report_cards')
    .update({
      status: 'published',
      is_published: true,
    })
    .eq('id', reportCardId)

  if (error) return { error: error.message }

  const studentUserId = card.students?.user_id
  const periodLabel = card.period ?? card.terms?.name ?? card.term ?? 'Bulletin'

  if (studentUserId) {
    await notifyStudent({
      userId: studentUserId,
      schoolId: card.school_id,
      title: 'Bulletin disponible',
      body: `Votre bulletin (${periodLabel}) est maintenant disponible dans votre espace.`,
      type: 'report_card',
      actionPath: '/eleve/bulletins',
    })
  }

  revalidatePath('/dashboard/report-cards')
  revalidatePath('/eleve/bulletins')
  revalidatePath('/eleve')
  return { success: true }
}
