import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/cards/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, UserCheck, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface EleveDashboardProps {
  userId: string
}

export async function EleveDashboard({ userId }: EleveDashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon espace élève</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Consultez vos résultats et absences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Ma moyenne" value="—/20" icon={<BookOpen className="h-5 w-5" />} color="blue" />
        <KPICard title="Rang" value="—" icon={<BookOpen className="h-5 w-5" />} color="green" />
        <KPICard title="Absences" value={0} icon={<UserCheck className="h-5 w-5" />} color="orange" />
        <KPICard title="Bulletins" value={0} icon={<FileText className="h-5 w-5" />} color="teal" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Mes Notes</p>
            <Button variant="link" size="sm" asChild>
              <Link href="/dashboard/grades">Consulter</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Emploi du temps</p>
            <Button variant="link" size="sm" asChild>
              <Link href="/dashboard/timetable">Voir</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
