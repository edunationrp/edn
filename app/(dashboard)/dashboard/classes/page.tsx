import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Users, GraduationCap, Settings } from 'lucide-react'
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
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Classes, Niveaux & Matières</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gérez la structure pédagogique de votre établissement
            {currentYear ? ` · ${currentYear.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/classes/levels/new">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau niveau
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/classes/new">
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle classe
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{classes.length}</p>
              <p className="text-sm text-muted-foreground">Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{levels.length}</p>
              <p className="text-sm text-muted-foreground">Niveaux</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gold">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subjects.length}</p>
              <p className="text-sm text-muted-foreground">Matières</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Classes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Classes ({classes.length})
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/classes/new">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {classes.length > 0 ? (
              <div className="space-y-2">
                {classes.map(cls => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {cls.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Capacité : {cls.capacity ?? '—'} élèves
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/classes/${cls.id}`}>
                          <Users className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/classes/${cls.id}/edit`}>
                          <Settings className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune classe configurée</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/dashboard/classes/new">Créer la première classe</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matières */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-yellow-600" />
                Matières ({subjects.length})
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/classes/subjects/new">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <div className="space-y-2">
                {subjects.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-yellow-300 hover:bg-yellow-50/50 transition-colors group">
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">Coefficient : {sub.coefficient}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.is_active ? 'default' : 'secondary'} className="text-xs">
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" asChild>
                        <Link href={`/dashboard/classes/subjects/${sub.id}/edit`}>
                          <Settings className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune matière configurée</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/dashboard/classes/subjects/new">Créer la première matière</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Niveaux */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              Niveaux scolaires ({levels.length})
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/classes/levels/new">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {levels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {levels.map(level => (
                <div key={level.id} className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50/50 hover:border-blue-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                    {level.order_num ?? '?'}
                  </div>
                  <span className="text-sm font-medium">{level.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Aucun niveau configuré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
