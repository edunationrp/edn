import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParentLinkRequestForm } from '@/features/parent/parent-link-request-form'
import { getMyLinkRequests } from '@/lib/actions/parent-link'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes enfants — Espace parent' }

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
}

const RELATION_LABELS: Record<string, string> = {
  pere: 'Père',
  mere: 'Mère',
  tuteur_legal: 'Tuteur légal',
  autre: 'Autre',
  parent: 'Parent',
  tuteur: 'Tuteur',
}

export default async function ParentEnfantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { children } = await requireParentPortalAccess(user.id)
  const { requests = [] } = await getMyLinkRequests() as {
    requests: Array<{ id: string; student_iun: string; relationship: string; status: string; created_at: string }>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes enfants</h1>
        <p className="text-sm text-muted-foreground">
          Gérez le rattachement de vos enfants, y compris s&apos;ils sont dans des établissements différents.
        </p>
      </div>

      {children.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Enfants rattachés ({children.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {children.map(child => (
              <div key={child.studentId} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B]/10 text-xs font-bold text-[#1B3A6B]">
                  {child.firstName[0]?.toUpperCase()}
                  {child.lastName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{child.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {child.iun} · {child.className ?? '—'} · {child.schoolName}
                  </p>
                </div>
                <Badge variant="outline">{RELATION_LABELS[child.relationType] ?? child.relationType}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rattacher un enfant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Entrez l&apos;IUN de votre enfant (visible sur son bulletin ou carnet).
            La secrétaire de l&apos;établissement validera la demande.
          </p>
          <ParentLinkRequestForm />
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Demandes en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.map(request => (
              <div key={request.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{request.student_iun}</p>
                  <p className="text-xs text-muted-foreground">{request.relationship}</p>
                </div>
                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'default'
                      : request.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {STATUS_LABELS[request.status] ?? request.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
