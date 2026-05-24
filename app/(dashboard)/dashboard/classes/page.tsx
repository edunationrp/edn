import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/cards/kpi-card'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PageHeader } from '@/components/dashboard/page-header'
import { ClassesListTable, LevelsListTable, SubjectsListTable } from '@/features/classes/classes-list-tables'
import { BookOpen, Plus, GraduationCap, Settings } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type ClassRow = {
  id: string
  name: string
  capacity: number | null
  school_year_id: string | null
}

type LevelRow = {
  id: string
  name: string
  order_num: number | null
}

type SubjectRow = {
  id: string
  name: string
  coefficient: number
  is_active: boolean
}

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id

  const [classesResult, levelsResult, subjectsResult, schoolYearResult] = await Promise.all([
    schoolId
      ? supabase.from('classes').select('id, name, capacity, school_year_id').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('class_levels').select('id, name, order_num').eq('school_id', schoolId).order('order_num')
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('subjects').select('id, name, coefficient, is_active').eq('school_id', schoolId).order('name')
      : Promise.resolve({ data: null }),
    schoolId
      ? supabase.from('school_years').select('id, name').eq('school_id', schoolId).eq('is_active', true).limit(1)
      : Promise.resolve({ data: null }),
  ])

  const classes = (classesResult.data as ClassRow[] | null) ?? []
  const levels = (levelsResult.data as LevelRow[] | null) ?? []
  const subjects = (subjectsResult.data as SubjectRow[] | null) ?? []
  const schoolYears = (schoolYearResult.data as Array<{ id: string; name: string }> | null) ?? []
  const currentYear = schoolYears[0]

  return (
    <DashboardPage>
      <PageHeader
        title="Classes, Niveaux & Matières"
        description={`Gérez la structure pédagogique de votre établissement${currentYear ? ` · ${currentYear.name}` : ''}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/classes/levels/new">
                <Plus className="h-4 w-4" />
                Nouveau niveau
              </Link>
            </Button>
            <Button size="sm" variant="brand" asChild>
              <Link href="/dashboard/classes/new">
                <Plus className="h-4 w-4" />
                Nouvelle classe
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPICard title="Classes" value={classes.length} icon={<BookOpen className="h-5 w-5" />} color="navy" />
        <KPICard title="Niveaux" value={levels.length} icon={<GraduationCap className="h-5 w-5" />} color="blue" />
        <KPICard title="Matières" value={subjects.length} icon={<Settings className="h-5 w-5" />} color="gold" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ClassesListTable classes={classes} />
        <SubjectsListTable subjects={subjects} />
      </div>

      <LevelsListTable levels={levels} />
    </DashboardPage>
  )
}
