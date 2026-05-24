import Link from 'next/link'
import { BookOpen, UserCheck, FileText, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { StatCard } from '@/components/dashboard/stat-card'
import { QuickLinkGrid } from '@/components/dashboard/quick-link-grid'
import { createClient } from '@/lib/supabase/server'

interface EleveDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

export async function EleveDashboard({ schoolId, userName = 'Élève' }: EleveDashboardProps) {
  const supabase = await createClient()

  let reportCardsCount = 0
  let attendanceCount = 0

  if (schoolId) {
    const [reportsResult, attendanceResult] = await Promise.all([
      supabase.from('report_cards').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'absent'),
    ])

    reportCardsCount = reportsResult.count ?? 0
    attendanceCount = attendanceResult.count ?? 0
  }

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`

  const actions = [
    { label: 'Mes notes', desc: 'Consultez vos résultats par matière', href: '/dashboard/grades', icon: BookOpen },
    { label: 'Mes absences', desc: 'Suivi de votre assiduité', href: '/dashboard/attendance', icon: UserCheck },
    { label: 'Mes bulletins', desc: 'Bulletins publiés', href: '/dashboard/report-cards', icon: Award },
    { label: 'Mes classes', desc: 'Emploi du temps et groupes', href: '/dashboard/classes', icon: FileText },
  ]

  return (
    <DashboardPage>
      <WelcomeBanner
        eyebrow={`${todayStr} · Espace élève`}
        title={`Bonjour ${userName}`}
        description="Retrouvez vos notes, absences et bulletins depuis votre téléphone ou ordinateur."
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Moyenne" value="—" subtitle="Trimestre en cours" icon={<BookOpen className="h-4 w-4" />} tone="navy" />
        <StatCard title="Absences" value={attendanceCount} subtitle="Enregistrées" icon={<UserCheck className="h-4 w-4" />} tone="amber" />
        <StatCard title="Bulletins" value={reportCardsCount} subtitle="Disponibles" icon={<Award className="h-4 w-4" />} tone="green" />
        <StatCard title="Messages" value="—" subtitle="Non lus" icon={<FileText className="h-4 w-4" />} tone="sky" />
      </div>

      <QuickLinkGrid links={actions} columns={2} />

      {!schoolId && (
        <EmptyPanel
          title="Profil élève non lié"
          description="Votre compte n'est pas encore rattaché à un dossier scolaire. Contactez le secrétariat de votre établissement."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/messages">Contacter l&apos;école</Link>
            </Button>
          }
        />
      )}
    </DashboardPage>
  )
}
