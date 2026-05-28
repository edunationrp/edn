import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { ParentNoChildState } from '@/features/parent/parent-no-child-state'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bulletins — Espace parent' }

export default async function ParentBulletinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { activeChild } = await requireParentPortalAccess(user.id)
  if (!activeChild) {
    return <ParentNoChildState title="Bulletins" />
  }

  const { data: bulletinsRaw } = await supabase
    .from('report_cards')
    .select('id, term, period, average, rank, class_size, status, generated_at, school_years(name)')
    .eq('student_id', activeChild.studentId)
    .order('generated_at', { ascending: false })

  const bulletins = ((bulletinsRaw ?? []) as Array<{
    id: string
    term: string | null
    period: string | null
    average: number | null
    rank: number | null
    class_size: number | null
    status: string | null
    generated_at: string | null
    school_years: { name: string } | null
  }>).filter(bulletin => bulletin.status === 'published')

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Bulletins</h1>
        <p className="text-sm text-muted-foreground">
          {activeChild.fullName} · {activeChild.schoolName}
        </p>
      </div>

      {bulletins.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun bulletin publié pour le moment.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bulletins.map(bulletin => (
            <Card key={bulletin.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">
                    {bulletin.period ?? bulletin.term ?? 'Bulletin'}
                    {bulletin.school_years?.name && (
                      <span className="font-normal text-muted-foreground">
                        {' '}· {bulletin.school_years.name}
                      </span>
                    )}
                  </CardTitle>
                  <Badge>Publié</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {bulletin.average !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moyenne</span>
                    <span className="font-semibold text-[#1B3A6B]">{bulletin.average.toFixed(2)} / 20</span>
                  </div>
                )}
                {bulletin.rank !== null && bulletin.class_size !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classement</span>
                    <span className="font-medium">
                      {bulletin.rank}<sup>e</sup> / {bulletin.class_size}
                    </span>
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
