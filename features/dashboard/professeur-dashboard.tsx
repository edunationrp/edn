import { Button } from '@/components/ui/button'
import {
  Users, FileCheck, BookOpen,
  ChevronRight, UserCheck, GraduationCap,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { getTeacherDashboardData } from '@/lib/dashboard/teacher-dashboard-data'

interface ProfesseurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

export async function ProfesseurDashboard({ schoolId, userId, userName = 'M. Traoré' }: ProfesseurDashboardProps) {
  const dashboard = schoolId
    ? await getTeacherDashboardData(schoolId, userId)
    : { assignments: [], totalStudents: 0, classCount: 0 }

  const { assignments, totalStudents, classCount } = dashboard

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#1e4080] p-4 text-white shadow-lg sm:p-6">
        <div className="absolute -right-12 -top-10 w-52 h-52 rounded-full bg-[#7AB832]/15" />
        <div className="absolute right-24 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
            {todayStr} · {classCount} classe{classCount !== 1 ? 's' : ''} assignée{classCount !== 1 ? 's' : ''}
          </div>
          <h2 className="text-xl font-extrabold mb-2 sm:text-2xl">Bonjour {userName}</h2>
          <p className="text-white/75 text-sm max-w-lg mb-4">
            {classCount > 0
              ? `Vous enseignez ${assignments.map(a => `${a.subjectName} en ${a.className}`).join(', ')}.`
              : 'Aucune classe assignée pour le moment — contactez la direction.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white border-0 shadow-md">
              <Link href="/dashboard/grades/entry">
                <FileCheck className="h-4 w-4 mr-1.5" />
                Saisir des notes
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href="/dashboard/attendance/take">
                <UserCheck className="h-4 w-4 mr-1.5" />
                Faire l&apos;appel
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes classes</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{classCount}</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2">Groupes assignés</p>
          {assignments.length > 0 && (
            <ul className="space-y-1 border-t border-gray-50 pt-2">
              {assignments.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium text-gray-700">{item.className}</span>
                  <span className="shrink-0 text-gray-400">{item.subjectName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Élèves</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{totalStudents > 0 ? totalStudents : '—'}</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2">Total dans vos classes</p>
          {assignments.length > 0 && (
            <ul className="space-y-1 border-t border-gray-50 pt-2">
              {assignments.map(item => (
                <li key={`${item.id}-students`} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-gray-600">{item.className}</span>
                  <span className="shrink-0 font-semibold text-[#7AB832]">
                    {item.studentCount} élève{item.studentCount !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes à saisir</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-1">
            <Link href="/dashboard/grades/entry" className="font-semibold text-[#1B3A6B] hover:underline">
              Saisir des notes
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Moy. générale</p>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">—</p>
          <p className="text-[11px] text-gray-400 mt-1">Bientôt disponible</p>
        </div>
      </div>

      {/* EMPLOI DU TEMPS + CLASSES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Aujourd&apos;hui</h3>
              <p className="text-xs text-gray-400 mt-0.5">{todayStr}</p>
            </div>
            <Link href="/dashboard/timetable" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Mon emploi du temps <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 px-5 py-8 text-center text-xs text-gray-500">
            L&apos;emploi du temps sera disponible prochainement. Consultez vos classes en attendant.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Mes classes et matières</h3>
              <p className="text-xs text-gray-400 mt-0.5">{classCount} affectation{classCount !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/dashboard/classes" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Tout voir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            {assignments.length === 0 ? (
              <EmptyPanel title="Aucune classe assignée" description="Vos classes apparaîtront ici dès qu'elles seront configurées par l'administration." />
            ) : (
              <div className="space-y-3">
                {assignments.map(item => (
                  <Link
                    key={item.id}
                    href="/dashboard/classes"
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all hover:border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FA] text-[#1B3A6B] text-xs font-black group-hover:bg-[#1B3A6B] group-hover:text-white">
                      {item.className.slice(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">{item.className}</p>
                      <p className="truncate text-xs text-[#1B3A6B] font-medium">{item.subjectName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-extrabold text-gray-900">{item.studentCount}</p>
                      <p className="text-[10px] text-gray-400">élèves</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SAISIE DES NOTES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Saisie des notes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Par classe et matière assignées</p>
          </div>
          <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white text-xs gap-1.5">
            <Link href="/dashboard/grades/entry">
              <FileCheck className="h-3.5 w-3.5" />
              Saisir des notes
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-gray-50">
          {assignments.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-gray-500">
              Aucune saisie récente.{' '}
              <Link href="/dashboard/grades/entry" className="font-semibold text-[#1B3A6B] hover:underline">
                Commencer une saisie
              </Link>
            </div>
          ) : (
            assignments.map(item => (
              <div key={`grade-${item.id}`} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{item.className}</p>
                  <p className="text-xs text-gray-500">{item.subjectName} · {item.studentCount} élève{item.studentCount !== 1 ? 's' : ''}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
                  <Link href="/dashboard/grades/entry">Saisir</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
