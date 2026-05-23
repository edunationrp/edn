import Link from 'next/link'
import { BookOpen, UserCheck, FileText, Award, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { createClient } from '@/lib/supabase/server'

interface EleveDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

export async function EleveDashboard({ schoolId, userId, userName = 'Élève' }: EleveDashboardProps) {
  const supabase = await createClient()

  let reportCardsCount = 0
  let attendanceCount = 0

  if (schoolId) {
    const [reportsResult, attendanceResult] = await Promise.all([
      supabase
        .from('report_cards')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),
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
    {
      title: 'Mes notes',
      description: 'Consultez vos résultats par matière',
      href: '/dashboard/grades',
      icon: BookOpen,
    },
    {
      title: 'Mes absences',
      description: 'Suivi de votre assiduité',
      href: '/dashboard/attendance',
      icon: UserCheck,
    },
    {
      title: 'Mes bulletins',
      description: 'Bulletins publiés par l\'établissement',
      href: '/dashboard/report-cards',
      icon: Award,
    },
    {
      title: 'Mes classes',
      description: 'Emploi du temps et groupes',
      href: '/dashboard/classes',
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#152F58] p-4 text-white shadow-lg sm:p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#7AB832]/15" />
        <div className="relative">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#A8DA63] sm:text-xs">
            {todayStr} · Espace élève
          </p>
          <h2 className="text-xl font-extrabold sm:text-2xl">Bonjour {userName}</h2>
          <p className="mt-2 max-w-lg text-sm text-white/75">
            Retrouvez vos notes, absences et bulletins depuis votre téléphone ou ordinateur.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Moyenne', value: '—', sub: 'Trimestre en cours' },
          { label: 'Absences', value: String(attendanceCount), sub: 'Enregistrées' },
          { label: 'Bulletins', value: String(reportCardsCount), sub: 'Disponibles' },
          { label: 'Messages', value: '—', sub: 'Non lus' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-[10px] text-gray-400 sm:text-[11px]">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[#1B3A6B]/20 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FA] text-[#1B3A6B] group-hover:bg-[#1B3A6B] group-hover:text-white">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{action.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#1B3A6B]" />
          </Link>
        ))}
      </div>

      {!schoolId && (
        <EmptyPanel
          title="Profil élève non lié"
          description="Votre compte n'est pas encore rattaché à un dossier scolaire. Contactez le secrétariat de votre établissement."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/messages">Contacter l'école</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
