import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { StudentActivationCodeButton } from '@/features/students/student-activation-code-button'
import { StudentPhotoUpload } from '@/features/students/student-photo-upload'
import { StudentConductPanel } from '@/features/students/student-conduct-panel'
import { getStudentConductDeductions } from '@/lib/actions/conduct'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { SendParentConvocationForm } from '@/features/parent/send-parent-convocation-form'
import { canAccessStudentRegistry } from '@/lib/students/registry-access'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('students').select('first_name, last_name').eq('id', id).limit(1)
  const student = (data as Array<{ first_name: string; last_name: string }> | null)?.[0]
  return {
    title: student ? `${student.last_name} ${student.first_name}` : 'Fiche élève',
  }
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')
  if (!canAccessStudentRegistry(ctx.role_code)) {
    redirect('/dashboard')
  }

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id, iun, first_name, last_name, birth_date, birth_place, gender, phone, status, photo_url, created_at, updated_at,
      user_id, activation_code_expires_at,
      student_enrollments(class_id, classes(name), school_years(name))
    `)
    .eq('id', id)
    .eq('school_id', ctx.school_id)
    .limit(1)

  const student = (
    studentRaw as Array<{
      id: string
      iun: string
      first_name: string
      last_name: string
      birth_date: string
      birth_place: string | null
      gender: 'M' | 'F'
      phone: string | null
      photo_url: string | null
      status: string
      created_at: string
      updated_at: string
      user_id: string | null
      activation_code_expires_at: string | null
      student_enrollments: Array<{
        class_id: string
        classes: { name: string } | null
        school_years: { name: string } | null
      }>
    }> | null
  )?.[0]

  if (!student) notFound()

  const enrollment = student.student_enrollments?.[0]

  const { data: linkedParentsRaw } = await (supabase as any)
    .from('parent_student_relations')
    .select('parent_user_id, relation_type, profiles:parent_user_id(full_name)')
    .eq('student_id', student.id)
    .eq('school_id', ctx.school_id)

  const linkedParents = ((linkedParentsRaw ?? []) as Array<{
    parent_user_id: string
    relation_type: string
    profiles: { full_name: string | null } | null
  }>).map(row => ({
    parentUserId: row.parent_user_id,
    fullName: row.profiles?.full_name ?? 'Parent',
    relationType: row.relation_type,
  }))

  const canSendConvocation = ['SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'VIE_SCOLAIRE', 'CONSEILLER', 'CENSEUR'].includes(ctx.role_code)
  const canManageStudent = hasPermission(ctx.role_code as UserRole, 'students:update')
  const conductDeductions = await getStudentConductDeductions(student.id)

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title={`${student.last_name} ${student.first_name}`}
        description={`IUN ${student.iun}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/students">Retour à la liste</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StudentPhotoUpload
            schoolId={ctx.school_id}
            studentId={student.id}
            photoUrl={student.photo_url}
            photoUpdatedAt={student.updated_at}
            studentName={`${student.first_name} ${student.last_name}`}
            canEdit={canManageStudent}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Classe</p>
              <p className="font-medium">{enrollment?.classes?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Année scolaire</p>
              <p className="font-medium">{enrollment?.school_years?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Genre</p>
              <p className="font-medium">{student.gender === 'M' ? 'Garçon' : 'Fille'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date de naissance</p>
              <p className="font-medium">{formatDate(student.birth_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium">{student.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Compte élève</p>
              <p className="font-medium">{student.user_id ? '✅ Activé' : '⏳ Non activé'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Statut</p>
              <Badge className={getStatusColor(student.status)}>{getStatusLabel(student.status)}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Inscrit le</p>
              <p className="font-medium">{formatDate(student.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {canManageStudent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Retraits de points (conduite)</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentConductPanel
              studentId={student.id}
              initialDeductions={conductDeductions}
              canManage={canManageStudent}
            />
          </CardContent>
        </Card>
      )}

      {!student.user_id && student.status === 'active' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accès numérique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Générez un code d&apos;activation à remettre à l&apos;élève pour qu&apos;il puisse créer son mot de passe.
            </p>
            <StudentActivationCodeButton studentId={student.id} />
          </CardContent>
        </Card>
      )}

      {canSendConvocation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Convoquer un parent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Envoyez une convocation au parent rattaché. Il la recevra dans son espace parent et par notification.
            </p>
            <SendParentConvocationForm studentId={student.id} parents={linkedParents} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
