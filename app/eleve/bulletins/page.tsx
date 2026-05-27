import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bulletins — EduNation' }

export default async function EleveBulletinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as { id: string } | null
  if (!student) redirect('/login/eleve')

  const { data: bulletinsRaw } = await supabase
    .from('report_cards')
    .select('id, term, period, average, rank, class_size, status, generated_at, school_years(name)')
    .eq('student_id', student.id)
    .order('generated_at', { ascending: false })

  const bulletins = (bulletinsRaw ?? []) as Array<{
    id: string
    term: string | null
    period: string | null
    average: number | null
    rank: number | null
    class_size: number | null
    status: string | null
    generated_at: string | null
    school_years: { name: string } | null
  }>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Mes bulletins</h1>

      {bulletins.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun bulletin disponible pour le moment.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bulletins.map(b => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {b.period ?? b.term ?? 'Bulletin'}{' '}
                    {b.school_years?.name && (
                      <span className="font-normal text-muted-foreground">· {b.school_years.name}</span>
                    )}
                  </CardTitle>
                  <Badge variant={b.status === 'published' ? 'default' : 'secondary'}>
                    {b.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {b.average !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moyenne</span>
                    <span className="font-semibold text-[#1B3A6B]">{b.average.toFixed(2)} / 20</span>
                  </div>
                )}
                {b.rank !== null && b.class_size !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classement</span>
                    <span className="font-medium">{b.rank}<sup>e</sup> / {b.class_size}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
