import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin } from '@/lib/platform/access'
import { getQaVerificationAuditLogs } from '@/lib/platform/qa-audit.server'
import { QA_DEMO_SCHOOL_ID } from '@/lib/platform/qa-demo-school'
import { getQaVerificationSession } from '@/lib/platform/qa-verification.server'
import { listQaInspectableSchools } from '@/lib/actions/platform-qa-verification'
import { QaVerificationAuditTable } from '@/features/platform/qa-verification-audit-table'
import { QaVerificationPanel } from '@/features/platform/qa-verification-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mode vérification — Super Admin',
}

async function getDemoStudentCount(): Promise<number> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin as any)
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', QA_DEMO_SCHOOL_ID)
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function PlatformInspectPage() {
  const access = await requirePlatformAdmin()
  if ('error' in access) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [schoolsResult, activeSession, auditLogs, demoStudentCount] = await Promise.all([
    listQaInspectableSchools(),
    getQaVerificationSession(user.id),
    getQaVerificationAuditLogs(40),
    getDemoStudentCount(),
  ])

  const schools = 'schools' in schoolsResult ? schoolsResult.schools : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mode vérification</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Simulez l&apos;expérience d&apos;un membre du personnel pour valider vos corrections sans
          compte Gmail ni invitation. Utilisez l&apos;école démo pour des tests reproductibles.
        </p>
      </div>

      {'error' in schoolsResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {schoolsResult.error}
        </div>
      )}

      <QaVerificationPanel
        schools={schools}
        activeSession={activeSession}
        demoStudentCount={demoStudentCount}
      />

      <QaVerificationAuditTable logs={auditLogs} />
    </div>
  )
}
