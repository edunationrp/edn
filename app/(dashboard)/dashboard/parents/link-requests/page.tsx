import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { LinkRequestActions } from '@/features/parent/link-request-actions'
import { getSchoolLinkRequests } from '@/lib/actions/parent-link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Demandes de rattachement — EduNation' }

export default async function LinkRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const result = await getSchoolLinkRequests(ctx.school_id)
  if ('error' in result) redirect('/dashboard')

  const requests = result.requests as Array<{
    id: string
    student_iun: string
    relationship: string
    message: string | null
    created_at: string
    profiles: { full_name: string | null; phone: string | null } | null
    students: { first_name: string; last_name: string } | null
  }>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Demandes de rattachement parent"
        description={`${requests.length} demande${requests.length !== 1 ? 's' : ''} en attente`}
      />

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {req.students
                        ? `${req.students.first_name} ${req.students.last_name}`
                        : req.student_iun}
                      {' '}
                      <span className="font-normal text-muted-foreground text-sm">({req.student_iun})</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Demandé par : <strong>{req.profiles?.full_name ?? 'Inconnu'}</strong>
                      {req.profiles?.phone && <> · {req.profiles.phone}</>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lien : {req.relationship}
                      {req.message && <> · <em>"{req.message}"</em></>}
                    </p>
                  </div>
                  <LinkRequestActions requestId={req.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
