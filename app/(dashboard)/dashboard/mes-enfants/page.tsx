import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParentLinkRequestForm } from '@/features/parent/parent-link-request-form'
import { getMyLinkRequests } from '@/lib/actions/parent-link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes enfants — EduNation' }

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

export default async function MesEnfantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Enfants déjà liés
  const { data: relationsRaw } = await (supabase as any)
    .from('parent_student_relations')
    .select('id, relation_type, students(id, first_name, last_name, iun, student_enrollments(classes(name), school_years(name, is_active)))')
    .eq('parent_user_id', user.id)

  const relations = (relationsRaw ?? []) as Array<{
    id: string
    relation_type: string
    students: {
      id: string
      first_name: string
      last_name: string
      iun: string
      student_enrollments: Array<{
        classes: { name: string } | null
        school_years: { name: string; is_active: boolean } | null
      }>
    } | null
  }>

  // Demandes en cours
  const { requests = [] } = await getMyLinkRequests() as { requests: Array<{ id: string; student_iun: string; relationship: string; status: string; created_at: string }> }

  return (
    <div className="space-y-6">
      <PageHeader title="Mes enfants" description="Gérez le rattachement de vos enfants" />

      {relations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Enfants rattachés ({relations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relations.map(rel => {
              const student = rel.students
              if (!student) return null
              const activeEnroll = student.student_enrollments?.find(e => e.school_years?.is_active)
              return (
                <div key={rel.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.iun} · {activeEnroll?.classes?.name ?? '—'}
                    </p>
                  </div>
                  <Badge variant="outline">{RELATION_LABELS[rel.relation_type] ?? rel.relation_type}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rattacher un enfant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Entrez l'IUN de votre enfant (visible sur son bulletin ou carnet de notes).
            La secrétaire de l'établissement validera la demande.
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
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{req.student_iun}</p>
                  <p className="text-xs text-muted-foreground">{req.relationship}</p>
                </div>
                <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {STATUS_LABELS[req.status] ?? req.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
