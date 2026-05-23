import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Users, FileCheck, Calendar, BookOpen,
  ChevronRight, UserCheck, ArrowUp, ArrowDown,
  Clock, CircleCheck, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface ProfesseurDashboardProps {
  schoolId?: string
  userId: string
  userName?: string
}

type Assignment = {
  id: string
  class_id: string | null
  subject_id: string | null
  classes?: { name: string } | null
  subjects?: { name: string } | null
}

const SCHEDULE_TODAY = [
  { heure: '07:30', classe: '6e B', matiere: 'Mathématiques', salle: 'C12', status: 'done' },
  { heure: '09:00', classe: 'Tle D', matiere: 'Mathématiques', salle: 'B08', status: 'current' },
  { heure: '11:00', classe: '4e A', matiere: 'Mathématiques', salle: 'A03', status: 'upcoming' },
  { heure: '14:30', classe: '5e B', matiere: 'Mathématiques', salle: 'C12', status: 'upcoming' },
]

const RECENT_GRADES = [
  { classe: '6e B', matiere: 'Mathématiques', date: '12/05', soumis: true, moy: 13.2, eleves: 32 },
  { classe: 'Tle D', matiere: 'Mathématiques', date: '10/05', soumis: false, moy: null, eleves: 28 },
  { classe: '5e B', matiere: 'Mathématiques', date: '08/05', soumis: true, moy: 11.8, eleves: 30 },
]

export async function ProfesseurDashboard({ schoolId, userId, userName = 'M. Traoré' }: ProfesseurDashboardProps) {
  const supabase = await createClient()

  let myClasses: Assignment[] = []
  let totalStudents = 0

  if (schoolId) {
    const { data: assignmentsRaw } = await supabase
      .from('teacher_assignments')
      .select('id, class_id, subject_id, classes(name), subjects(name)')
      .eq('teacher_id', userId)
      .eq('school_id', schoolId)
      .limit(20)

    myClasses = (assignmentsRaw as Assignment[] | null) ?? []
    totalStudents = myClasses.length * 28
  }

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const todayStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`

  const classCount = myClasses.length > 0 ? myClasses.length : 5
  const classNames = myClasses.length > 0
    ? myClasses.map(a => a.classes?.name ?? a.class_id ?? '—')
    : ['6e B', 'Tle D', '4e A', '5e B', '3e C']

  return (
    <div className="space-y-5 animate-fade-in">

      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#1e4080] p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-10 w-52 h-52 rounded-full bg-[#7AB832]/15" />
        <div className="absolute right-24 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-[#A8DA63] text-xs font-bold tracking-widest uppercase mb-1">
            {todayStr} · {classCount} classes assignées
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Bonjour {userName} 👋</h2>
          <p className="text-white/75 text-sm max-w-lg mb-4">
            Vous avez <strong className="text-white">4 cours aujourd&apos;hui</strong> et{' '}
            <strong className="text-white">2 saisies de notes</strong> à compléter.
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
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mes classes</p>
            <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{classCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">Groupes assignés</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Élèves</p>
            <div className="w-9 h-9 rounded-xl bg-[#7AB832]/10 flex items-center justify-center text-[#7AB832]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{totalStudents > 0 ? totalStudents : 152}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-[11px] text-[#7AB832] font-semibold">+5 vs trimestre</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes à saisir</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">2</p>
          <p className="text-[11px] text-amber-500 font-semibold mt-1">En attente</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Moy. générale</p>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">12,8</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="h-3.5 w-3.5 text-[#7AB832]" />
            <span className="text-[11px] text-[#7AB832] font-semibold">+0,4 vs T1</span>
          </div>
        </div>
      </div>

      {/* EMPLOI DU TEMPS + CLASSES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Planning du jour */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Aujourd&apos;hui</h3>
              <p className="text-xs text-gray-400 mt-0.5">{todayStr} · 4 séances</p>
            </div>
            <Link href="/dashboard/timetable" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Emploi du temps <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {SCHEDULE_TODAY.map((s, i) => (
              <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 transition-colors ${
                s.status === 'current' ? 'bg-[#1B3A6B]/4' : 'hover:bg-gray-50/70'
              }`}>
                <div className={`flex-shrink-0 text-center w-12 py-2 rounded-xl text-xs font-bold ${
                  s.status === 'done' ? 'bg-gray-100 text-gray-400' :
                  s.status === 'current' ? 'bg-[#7AB832] text-white' :
                  'bg-[#EEF3FA] text-[#1B3A6B]'
                }`}>
                  {s.heure}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${s.status === 'done' ? 'text-gray-400' : 'text-gray-800'}`}>
                    {s.matiere} — <span className="font-normal">{s.classe}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Salle {s.salle}
                  </p>
                </div>
                {s.status === 'done' ? (
                  <CircleCheck className="h-4.5 w-4.5 text-gray-300 flex-shrink-0" />
                ) : s.status === 'current' ? (
                  <span className="flex-shrink-0 text-[10px] font-bold bg-[#7AB832] text-white px-2 py-0.5 rounded-full animate-pulse">
                    En cours
                  </span>
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mes classes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Mes classes</h3>
              <p className="text-xs text-gray-400 mt-0.5">{classCount} groupes — Mathématiques</p>
            </div>
            <Link href="/dashboard/classes" className="text-xs text-[#1B3A6B] font-semibold hover:underline flex items-center gap-1">
              Tout voir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {classNames.map((cn, i) => (
              <Link
                key={i}
                href="/dashboard/classes"
                className="group flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/3 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[#EEF3FA] flex items-center justify-center text-[#1B3A6B] font-black text-xs flex-shrink-0 group-hover:bg-[#1B3A6B] group-hover:text-white transition-colors">
                  {cn}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Mathématiques</p>
                  <p className="text-[10px] text-gray-400">~28 élèves</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* SAISIE DES NOTES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Saisie des notes — Trimestre 2</h3>
            <p className="text-xs text-gray-400 mt-0.5">Progression des saisies par groupe</p>
          </div>
          <Button asChild size="sm" className="bg-[#7AB832] hover:bg-[#5F941F] text-white text-xs gap-1.5">
            <Link href="/dashboard/grades/entry">
              <FileCheck className="h-3.5 w-3.5" />
              Saisir des notes
            </Link>
          </Button>
        </div>
        <div className="divide-y divide-gray-50">
          {RECENT_GRADES.map((g, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FA] flex items-center justify-center text-[#1B3A6B] font-black text-xs flex-shrink-0">
                {g.classe}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{g.matiere} — {g.classe}</p>
                <p className="text-[11px] text-gray-400">Soumis le {g.date} · {g.eleves} élèves</p>
              </div>
              {g.soumis ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono font-bold text-sm" style={{ color: (g.moy ?? 0) >= 12 ? '#5F941F' : '#92400E' }}>
                    {g.moy?.toFixed(1).replace('.', ',')} / 20
                  </span>
                  <span className="text-[10px] font-bold bg-[#7AB832]/10 text-[#5F941F] px-2 py-0.5 rounded-full">
                    Soumis
                  </span>
                </div>
              ) : (
                <Link href="/dashboard/grades/entry" className="flex-shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                  À saisir
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
