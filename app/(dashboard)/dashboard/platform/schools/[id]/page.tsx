import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Users, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPlatformSchoolById } from '@/lib/platform/queries'
import { SCHOOL_TYPES } from '@/lib/onboarding/constants'
import { formatDate } from '@/lib/utils'
import { PlatformSchoolStatusToggle } from '@/features/platform/platform-school-status-toggle'
import type { Metadata } from 'next'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getPlatformSchoolById(id)
  return {
    title: data ? `${String(data.school.name)} — Super Admin` : 'Établissement — Super Admin',
  }
}

export default async function PlatformSchoolDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getPlatformSchoolById(id)
  if (!data) notFound()

  const school = data.school as {
    id: string
    name: string
    type: string
    city: string | null
    province: string | null
    country: string
    address: string | null
    phone: string | null
    email: string | null
    motto: string | null
    is_active: boolean
    created_at: string
    organizations: { id: string; name: string; plan_code: string } | null
  }

  const typeLabel = SCHOOL_TYPES.find(t => t.value === school.type)?.label ?? school.type

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/platform/schools">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <PageHeader
        title={school.name}
        description={[school.city, school.province, school.country].filter(Boolean).join(', ') || '—'}
        badge={school.is_active ? 'Actif' : 'Suspendu'}
        actions={
          <PlatformSchoolStatusToggle schoolId={school.id} isActive={school.is_active} />
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="Élèves actifs"
          value={data.stats.students}
          icon={<GraduationCap className="h-4 w-4" />}
          tone="sky"
        />
        <StatCard
          title="Accès personnel"
          value={data.stats.staff}
          icon={<Users className="h-4 w-4" />}
          tone="green"
        />
        <StatCard
          title="Type"
          value={typeLabel}
          icon={<Building2 className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {school.email && (
              <p><span className="text-muted-foreground">Email :</span> {school.email}</p>
            )}
            {school.phone && (
              <p><span className="text-muted-foreground">Téléphone :</span> {school.phone}</p>
            )}
            {school.address && (
              <p><span className="text-muted-foreground">Adresse :</span> {school.address}</p>
            )}
            {school.motto && (
              <p><span className="text-muted-foreground">Devise :</span> {school.motto}</p>
            )}
            <p><span className="text-muted-foreground">Créé le :</span> {formatDate(school.created_at)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organisation</CardTitle>
          </CardHeader>
          <CardContent>
            {school.organizations ? (
              <div className="space-y-2">
                <p className="font-semibold">{school.organizations.name}</p>
                <Badge className="bg-violet-100 text-violet-800 capitalize">
                  Plan {school.organizations.plan_code}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune organisation liée.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {data.schoolYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Années scolaires</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.schoolYears.map(year => (
              <Badge key={year.id} variant={year.is_active ? 'success' : 'secondary'}>
                {year.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
