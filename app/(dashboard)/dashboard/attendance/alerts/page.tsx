import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { AbsenceAlertsPanel } from '@/features/attendance/absence-alerts-panel'
import { AbsenceAlertSettingsForm } from '@/features/attendance/absence-alert-settings-form'
import {
  canViewAbsenceAlerts,
  getStudentsAbsenceAlerts,
} from '@/lib/attendance/absence-alerts'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Alertes absences — Vie scolaire' }

const SETTINGS_ROLES = new Set([
  'PROVISEUR',
  'FONDATEUR',
  'DIRECTEUR_ADJOINT',
  'CENSEUR',
  'SURVEILLANT_GENERAL',
])

export default async function AttendanceAlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canViewAbsenceAlerts(ctx.role_code)) redirect('/dashboard/attendance')

  const { config, students } = await getStudentsAbsenceAlerts(ctx.school_id)
  const canEditSettings = SETTINGS_ROLES.has(ctx.role_code)

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Alertes d'assiduité"
        description="Élèves ayant dépassé le seuil d'absences non justifiées — suivi vie scolaire"
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/attendance/justifications">Justifications parents</Link>
          </Button>
        }
      />

      <AbsenceAlertSettingsForm initial={config} canEdit={canEditSettings} />

      <AbsenceAlertsPanel config={config} students={students} />
    </div>
  )
}
