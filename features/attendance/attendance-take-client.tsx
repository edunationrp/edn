'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { insertRecord, updateRecord } from '@/lib/supabase/mutations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Check, Clock, Loader2, Users } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import { checkAbsenceThresholdsForStudents } from '@/lib/actions/attendance-alerts'
import type { TeacherAssignmentOption } from '@/lib/attendance/teacher-attendance'
import type { JustificationStatus } from '@/lib/attendance/teacher-attendance'
import type { AttendanceStatus } from '@/types/global'

interface StudentAttendance {
  studentId: string
  firstName: string
  lastName: string
  iun: string
  status: AttendanceStatus
  recordId?: string
}

interface AttendanceTakeClientProps {
  schoolId: string
  teacherId: string
  schoolYearId: string
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
  assignments?: TeacherAssignmentOption[]
  initialClassId?: string
  initialSubjectId?: string
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'Présent', color: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
  late: { label: 'Retard', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  sick: { label: 'Malade', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
  excused: { label: 'Excusé', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-300' },
}

const JUSTIFICATION_LABELS: Record<JustificationStatus, { label: string; className: string }> = {
  pending: { label: 'Justification en attente', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Justifié (parent)', className: 'bg-teal-100 text-teal-800' },
  rejected: { label: 'Justification refusée', className: 'bg-red-100 text-red-800' },
}

function resolveInitialSubject(
  assignments: TeacherAssignmentOption[],
  classId: string,
  subjectId: string,
  subjects: Array<{ id: string; name: string }>,
) {
  if (subjectId) return subjectId
  if (!classId) return subjects[0]?.id ?? ''
  const matches = assignments.filter(a => a.classId === classId)
  if (matches.length === 1) return matches[0].subjectId
  return subjects[0]?.id ?? ''
}

export function AttendanceTakeClient({
  schoolId,
  teacherId,
  schoolYearId,
  classes,
  subjects,
  assignments = [],
  initialClassId = '',
  initialSubjectId = '',
}: AttendanceTakeClientProps) {
  const supabase = createClient()
  const [selectedClass, setSelectedClass] = useState(initialClassId)
  const [selectedSubject, setSelectedSubject] = useState(
    resolveInitialSubject(assignments, initialClassId, initialSubjectId, subjects),
  )
  const [attendances, setAttendances] = useState<StudentAttendance[]>([])
  const [justifications, setJustifications] = useState<Map<string, JustificationStatus>>(new Map())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const subjectsForClass = useMemo(() => {
    if (!selectedClass || assignments.length === 0) return subjects
    const allowed = new Set(
      assignments.filter(a => a.classId === selectedClass).map(a => a.subjectId),
    )
    if (allowed.size === 0) return subjects
    return subjects.filter(s => allowed.has(s.id))
  }, [assignments, selectedClass, subjects])

  const selectAssignment = (classId: string, subjectId: string) => {
    setSelectedClass(classId)
    setSelectedSubject(subjectId)
  }

  const loadStudents = useCallback(async (classId: string, subjectId: string) => {
    if (!classId || !schoolYearId || !subjectId) {
      setAttendances([])
      setJustifications(new Map())
      return
    }

    setLoadingStudents(true)
    const { data: enrollmentsRaw } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearId)

    const ids = ((enrollmentsRaw as Array<{ student_id: string }> | null) ?? []).map(e => e.student_id)

    if (ids.length === 0) {
      setAttendances([])
      setJustifications(new Map())
      setLoadingStudents(false)
      return
    }

    const { data: studentsRaw } = await supabase
      .from('students')
      .select('id, first_name, last_name, iun')
      .in('id', ids)
      .eq('status', 'active')
      .order('last_name')

    const students = (studentsRaw as Array<{ id: string; first_name: string; last_name: string; iun: string }> | null) ?? []

    const today = new Date().toISOString().split('T')[0]
    const { data: existingRaw } = await supabase
      .from('attendance_records')
      .select('id, student_id, status')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)

    const existingByStudent = new Map(
      ((existingRaw ?? []) as Array<{ id: string; student_id: string; status: AttendanceStatus }>).map(row => [
        row.student_id,
        row,
      ]),
    )

    const nextAttendances = students.map(s => {
      const existing = existingByStudent.get(s.id)
      return {
        studentId: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        iun: s.iun,
        status: existing?.status ?? ('present' as AttendanceStatus),
        recordId: existing?.id,
      }
    })

    setAttendances(nextAttendances)

    const recordIds = nextAttendances.map(a => a.recordId).filter(Boolean) as string[]
    if (recordIds.length > 0) {
      const { data: justifRaw } = await supabase
        .from('attendance_justifications')
        .select('attendance_record_id, status')
        .in('attendance_record_id', recordIds)

      const map = new Map<string, JustificationStatus>()
      for (const row of (justifRaw ?? []) as Array<{ attendance_record_id: string; status: JustificationStatus }>) {
        map.set(row.attendance_record_id, row.status)
      }
      setJustifications(map)
    } else {
      setJustifications(new Map())
    }

    setLoadingStudents(false)
  }, [schoolId, schoolYearId, supabase])

  useEffect(() => {
    if (selectedClass) {
      const nextSubject = subjectsForClass.some(s => s.id === selectedSubject)
        ? selectedSubject
        : subjectsForClass[0]?.id ?? ''
      if (nextSubject !== selectedSubject) {
        setSelectedSubject(nextSubject)
        return
      }
      if (nextSubject) {
        loadStudents(selectedClass, nextSubject)
      } else {
        setAttendances([])
      }
    } else {
      setAttendances([])
    }
  }, [selectedClass, selectedSubject, subjectsForClass, loadStudents])

  const cycleStatus = (studentId: string) => {
    const cycle: AttendanceStatus[] = ['present', 'absent', 'late', 'sick', 'excused']
    setAttendances(prev =>
      prev.map(a => {
        if (a.studentId !== studentId) return a
        const currentIdx = cycle.indexOf(a.status)
        return { ...a, status: cycle[(currentIdx + 1) % cycle.length] }
      }),
    )
  }

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendances(prev =>
      prev.map(a => a.studentId === studentId ? { ...a, status } : a),
    )
  }

  const markAllPresent = () => {
    setAttendances(prev => prev.map(a => ({ ...a, status: 'present' as AttendanceStatus })))
  }

  const saveAttendances = async () => {
    if (!selectedClass || !selectedSubject) {
      notify.error('Sélectionnez une classe et une matière.', 'attendance_save')
      return
    }
    if (attendances.length === 0) {
      notify.error('Aucun élève à enregistrer.', 'attendance_save')
      return
    }
    if (!navigator.onLine) {
      notify.error('Connexion Internet requise pour enregistrer les présences.', 'attendance_save')
      return
    }

    setSaving(true)

    try {
      const recordedAt = new Date().toISOString()
      for (const a of attendances) {
        if (a.recordId) {
          const { error } = await updateRecord(
            'attendance_records',
            { status: a.status, recorded_at: recordedAt },
            { id: a.recordId },
          )
          if (error) throw new Error(error.message)
        } else {
          const { data, error } = await insertRecord<{ id: string }>(
            'attendance_records',
            {
              school_id: schoolId,
              school_year_id: schoolYearId,
              class_id: selectedClass,
              subject_id: selectedSubject,
              student_id: a.studentId,
              teacher_id: teacherId,
              status: a.status,
              recorded_at: recordedAt,
              source: 'web',
            },
            'id',
          )
          if (error) throw new Error(error.message)
          if (data?.[0]?.id) {
            a.recordId = data[0].id
          }
        }
      }

      setSaved(true)
      notify.success(TOAST_SUCCESS.attendanceSaved.title, {
        description: TOAST_SUCCESS.attendanceSaved.description,
      })

      const alertStudentIds = attendances
        .filter(a => a.status === 'absent' || a.status === 'late')
        .map(a => a.studentId)
      if (alertStudentIds.length > 0) {
        void checkAbsenceThresholdsForStudents(schoolId, alertStudentIds)
      }
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.',
        'attendance_save',
      )
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const presentCount = attendances.filter(a => a.status === 'present').length
  const absentCount = attendances.filter(a => a.status === 'absent').length

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Prise de présence</h1>
          <p className="text-sm text-muted-foreground">
            Choisissez votre cours ou sélectionnez classe et matière
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/dashboard/attendance/my">Mes appels</Link>
        </Button>
      </div>

      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mes cours</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {assignments.map(assignment => {
              const active =
                selectedClass === assignment.classId && selectedSubject === assignment.subjectId
              return (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => selectAssignment(assignment.classId, assignment.subjectId)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'border-[#1a4d2e] bg-[#1a4d2e]/5 text-[#1a4d2e]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold">{assignment.subjectName}</span>
                  <span className="text-xs text-muted-foreground">{assignment.className}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration du cours</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Classe</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Matière</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sélectionner une matière</option>
              {subjectsForClass.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loadingStudents && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des élèves…
        </div>
      )}

      {!loadingStudents && attendances.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-xl font-bold text-green-700 sm:text-2xl">{presentCount}</p>
              <p className="text-xs text-green-600">Présents</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-xl font-bold text-red-700 sm:text-2xl">{absentCount}</p>
              <p className="text-xs text-red-600">Absents</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
              <p className="text-xl font-bold text-orange-700 sm:text-2xl">
                {attendances.filter(a => a.status === 'late').length}
              </p>
              <p className="text-xs text-orange-600">Retards</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
              <Users className="mr-1 h-4 w-4" />
              Tout marquer présent
            </Button>
          </div>
        </>
      )}

      {!loadingStudents && attendances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center sm:py-16">
            <div className="text-muted-foreground">
              <div className="mb-3 text-4xl">👥</div>
              <p className="text-sm">
                {selectedClass
                  ? 'Aucun élève actif dans cette classe.'
                  : 'Sélectionnez un cours ci-dessus pour afficher les élèves'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !loadingStudents ? (
        <div className="space-y-2">
          {attendances.map(a => {
            const config = STATUS_CONFIG[a.status]
            const justification = a.recordId ? justifications.get(a.recordId) : undefined
            const justifConfig = justification ? JUSTIFICATION_LABELS[justification] : null

            return (
              <div
                key={a.studentId}
                className={`flex flex-col gap-3 rounded-xl border-2 p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${config.bg}`}
                onClick={() => cycleStatus(a.studentId)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-sm font-bold text-gray-700">
                    {getInitials(`${a.firstName} ${a.lastName}`)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.lastName} {a.firstName}</p>
                    <code className="text-xs opacity-70">{a.iun}</code>
                    {justifConfig && (
                      <Badge className={`mt-1 text-[10px] ${justifConfig.className}`}>
                        {justifConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                    {(['present', 'absent', 'late', 'sick', 'excused'] as AttendanceStatus[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(a.studentId, s)}
                        className={`rounded-full border px-2 py-1 text-[10px] font-bold transition-colors sm:text-xs ${
                          a.status === s
                            ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`
                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-400'
                        }`}
                        title={STATUS_CONFIG[s].label}
                      >
                        {STATUS_CONFIG[s].label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {attendances.length > 0 && (
        <Button
          className="w-full bg-[#1a4d2e] hover:bg-[#2d6a4f] sm:w-auto"
          onClick={saveAttendances}
          loading={saving}
          disabled={saving || !selectedSubject}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      )}
    </div>
  )
}
