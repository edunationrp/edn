'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { buildBulletinSnapshot } from '@/lib/report-cards/build-snapshot'
import { notifyProviseurAfterReportCardsGenerated } from '@/lib/actions/report-cards'

export async function lockEvaluation(evaluationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('evaluations')
    .update({ is_locked: true })
    .eq('id', evaluationId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/grades')
  revalidatePath('/dashboard/grades/validate')
  return { success: true }
}

export async function generateReportCardsForClass(input: {
  schoolId: string
  schoolYearId: string
  termId: string
  classId: string
  userId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx || ctx.school_id !== input.schoolId) {
    return { error: 'Accès refusé.' }
  }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'report_cards:generate')) {
    return { error: 'Vous n\'avez pas la permission de générer des bulletins.' }
  }

  const { data: enrollmentsRaw } = await supabase
    .from('student_enrollments')
    .select('student_id')
    .eq('school_id', input.schoolId)
    .eq('class_id', input.classId)
    .eq('school_year_id', input.schoolYearId)

  const studentIds = ((enrollmentsRaw as Array<{ student_id: string }> | null) ?? []).map(e => e.student_id)
  if (studentIds.length === 0) {
    return { error: 'Aucun élève inscrit dans cette classe pour l\'année active.' }
  }

  let created = 0
  let lastError: string | null = null

  const { data: termRaw } = await supabase
    .from('terms')
    .select('name')
    .eq('id', input.termId)
    .maybeSingle()

  const termName = (termRaw as { name: string } | null)?.name ?? 'T1'

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }

  let templateId: string | null = null
  const { data: templateRaw } = await admin
    .from('report_card_templates')
    .select('id')
    .eq('school_id', input.schoolId)
    .eq('code', 'BF_OFFICIAL_V1')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  templateId = (templateRaw as { id: string } | null)?.id ?? null

  if (!templateId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seeded, error: seedError } = await (admin as any)
      .from('report_card_templates')
      .insert({
        school_id: input.schoolId,
        code: 'BF_OFFICIAL_V1',
        name: 'Bulletin officiel Burkina Faso',
        config: { layout: 'bf_official_v1' },
        is_active: true,
      })
      .select('id')
      .single()
    if (seedError) return { error: seedError.message as string }
    templateId = seeded?.id ?? null
  }

  const classSize = studentIds.length

  for (const studentId of studentIds) {
    const serial = `RC-${Date.now().toString(36).toUpperCase()}-${studentId.slice(0, 4).toUpperCase()}`
    const qrHash = serial.replace(/[^A-Z0-9]/gi, '').slice(0, 24)

    const snapshotResult = await buildBulletinSnapshot({
      schoolId: input.schoolId,
      schoolYearId: input.schoolYearId,
      termId: input.termId,
      classId: input.classId,
      studentId,
      serialNumber: serial,
      qrHash,
    })

    const average =
      'snapshot' in snapshotResult && snapshotResult.snapshot
        ? snapshotResult.snapshot.generalAverage
        : null
    const rank =
      'snapshot' in snapshotResult && snapshotResult.snapshot
        ? snapshotResult.snapshot.generalRank
        : null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('report_cards').upsert(
      {
        school_id: input.schoolId,
        school_year_id: input.schoolYearId,
        term_id: input.termId,
        student_id: studentId,
        class_id: input.classId,
        template_id: templateId,
        serial_number: serial,
        status: 'generated',
        term: termName,
        period: termName,
        average,
        rank,
        class_size: classSize,
        snapshot_json:
          'snapshot' in snapshotResult && snapshotResult.snapshot
            ? snapshotResult.snapshot
            : null,
        is_published: false,
        is_locked: false,
        hash: qrHash,
        qr_hash: qrHash,
        generated_by: input.userId,
        generated_at: new Date().toISOString(),
        validated_by: null,
        validated_at: null,
        correction_note: null,
        correction_requested_at: null,
        correction_requested_by: null,
      },
      { onConflict: 'student_id,term_id' },
    )

    if (error) {
      lastError = error.message as string
    } else {
      created += 1
    }
  }

  revalidatePath('/dashboard/report-cards')

  await notifyProviseurAfterReportCardsGenerated({
    schoolId: input.schoolId,
    count: created,
    classId: input.classId,
    termId: input.termId,
  })

  if (created === 0) {
    return {
      error: lastError
        ?? 'Aucun bulletin créé. Vérifiez les inscriptions, la période sélectionnée et les notes saisies.',
    }
  }

  return { success: true, created }
}
