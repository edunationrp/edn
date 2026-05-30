import { createAdminClient } from '@/lib/supabase/admin'
import { computeStudentAverage, shortAppreciation } from '@/lib/grades/sheet-types'
import type { BulletinSnapshot, BulletinSubjectRow } from '@/lib/report-cards/snapshot-types'

const TERM_LABELS: Record<string, string> = {
  T1: '1er Trimestre',
  T2: '2ème Trimestre',
  T3: '3ème Trimestre',
}

function termCodeFromName(name: string): string {
  const upper = name.toUpperCase()
  if (upper.includes('1') || upper.includes('PREMIER')) return 'T1'
  if (upper.includes('2') || upper.includes('DEUX') || upper.includes('2ÈME') || upper.includes('2EME')) return 'T2'
  if (upper.includes('3') || upper.includes('TROIS')) return 'T3'
  return name.slice(0, 2).toUpperCase()
}

function appreciationFromAverage(average: number | null) {
  if (average === null) return '—'
  if (average >= 16) return 'Très bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez bien'
  if (average >= 10) return 'Passable'
  if (average >= 8) return 'Insuffisant'
  return 'Très insuffisant'
}

async function getSubjectGradesForStudent(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    schoolId: string
    studentId: string
    subjectId: string
    termCode: string
  },
): Promise<{ devoir1: number | null; devoir2: number | null; examen: number | null; average: number | null }> {
  const { data: evaluations } = await admin
    .from('evaluations')
    .select('id, sequence_slot')
    .eq('school_id', params.schoolId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.termCode)
    .not('sequence_slot', 'is', null)

  const evals = (evaluations ?? []) as Array<{ id: string; sequence_slot: string }>
  if (evals.length === 0) {
    return { devoir1: null, devoir2: null, examen: null, average: null }
  }

  const evalIds = evals.map(item => item.id)
  const { data: grades } = await admin
    .from('grades')
    .select('evaluation_id, value')
    .eq('student_id', params.studentId)
    .in('evaluation_id', evalIds)

  const values: { devoir1: number | null; devoir2: number | null; examen: number | null } = {
    devoir1: null,
    devoir2: null,
    examen: null,
  }

  for (const grade of (grades ?? []) as Array<{ evaluation_id: string; value: number }>) {
    const slot = evals.find(item => item.id === grade.evaluation_id)?.sequence_slot
    if (slot === 'devoir1') values.devoir1 = grade.value
    if (slot === 'devoir2') values.devoir2 = grade.value
    if (slot === 'examen') values.examen = grade.value
  }

  return {
    ...values,
    average: computeStudentAverage(values),
  }
}

export async function buildBulletinSnapshot(params: {
  schoolId: string
  schoolYearId: string
  termId: string
  classId: string
  studentId: string
  serialNumber: string
  qrHash: string
  councilDecision?: string | null
}): Promise<{ error: string } | { snapshot: BulletinSnapshot }> {
  try {
    const admin = createAdminClient()

    const [
      { data: schoolRaw },
      { data: studentRaw },
      { data: classRaw },
      { data: termRaw },
      { data: yearRaw },
      { data: enrollmentsRaw },
    ] = await Promise.all([
      admin.from('schools').select('name, structure_name, logo_url, motto, address, city').eq('id', params.schoolId).maybeSingle(),
      admin.from('students').select('id, first_name, last_name, iun, birth_date, birth_place, photo_url').eq('id', params.studentId).maybeSingle(),
      admin
        .from('classes')
        .select('name, main_teacher_id')
        .eq('id', params.classId)
        .maybeSingle(),
      admin.from('terms').select('name, start_date, end_date').eq('id', params.termId).maybeSingle(),
      admin.from('school_years').select('name').eq('id', params.schoolYearId).maybeSingle(),
      admin
        .from('student_enrollments')
        .select('student_id')
        .eq('school_id', params.schoolId)
        .eq('class_id', params.classId)
        .eq('school_year_id', params.schoolYearId),
    ])

    const school = schoolRaw as {
      name: string
      structure_name: string | null
      logo_url: string | null
      motto: string | null
      address: string | null
      city: string | null
    } | null

    const student = studentRaw as {
      id: string
      first_name: string
      last_name: string
      iun: string
      birth_date: string
      birth_place: string | null
      photo_url: string | null
    } | null

    const classRow = classRaw as {
      name: string
      main_teacher_id: string | null
    } | null

    let headTeacherName: string | null = null
    if (classRow?.main_teacher_id) {
      const { data: teacherRaw } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', classRow.main_teacher_id)
        .maybeSingle()
      headTeacherName = (teacherRaw as { full_name: string | null } | null)?.full_name ?? null
    }

    const term = termRaw as { name: string; start_date: string; end_date: string } | null
    const year = yearRaw as { name: string } | null

    if (!school || !student || !classRow || !term || !year) {
      return { error: 'Données insuffisantes pour générer le bulletin.' }
    }

    const classStudentIds = ((enrollmentsRaw ?? []) as Array<{ student_id: string }>).map(row => row.student_id)
    const classSize = classStudentIds.length
    const termCode = termCodeFromName(term.name)

    const { data: classSubjectsRaw } = await admin
      .from('class_subjects')
      .select('subject_id, coefficient, subjects(id, name)')
      .eq('class_id', params.classId)
      .eq('school_id', params.schoolId)

    let subjectRows = ((classSubjectsRaw ?? []) as Array<{
      subject_id: string
      coefficient: number
      subjects: { id: string; name: string } | null
    }>).map(row => ({
      subjectId: row.subject_id,
      name: row.subjects?.name ?? 'Matière',
      coefficient: Number(row.coefficient) || 1,
    }))

    if (subjectRows.length === 0) {
      const { data: subjectsRaw } = await admin
        .from('subjects')
        .select('id, name, coefficient')
        .eq('school_id', params.schoolId)
        .eq('is_active', true)

      subjectRows = ((subjectsRaw ?? []) as Array<{ id: string; name: string; coefficient: number }>).map(row => ({
        subjectId: row.id,
        name: row.name,
        coefficient: Number(row.coefficient) || 1,
      }))
    }

    const studentGradesBySubject = new Map<string, Awaited<ReturnType<typeof getSubjectGradesForStudent>>>()
    for (const subject of subjectRows) {
      const grades = await getSubjectGradesForStudent(admin, {
        schoolId: params.schoolId,
        studentId: params.studentId,
        subjectId: subject.subjectId,
        termCode,
      })
      studentGradesBySubject.set(subject.subjectId, grades)
    }

    const classAveragesBySubject = new Map<string, number[]>()
    for (const subject of subjectRows) {
      const averages: number[] = []
      for (const sid of classStudentIds) {
        const result = await getSubjectGradesForStudent(admin, {
          schoolId: params.schoolId,
          studentId: sid,
          subjectId: subject.subjectId,
          termCode,
        })
        if (result.average !== null) averages.push(result.average)
      }
      classAveragesBySubject.set(subject.subjectId, averages)
    }

    const subjects: BulletinSubjectRow[] = subjectRows.map(subject => {
      const grades = studentGradesBySubject.get(subject.subjectId)!
      const studentAverage = grades.average
      const classAvgs = classAveragesBySubject.get(subject.subjectId) ?? []
      const classAverage =
        classAvgs.length > 0
          ? Math.round((classAvgs.reduce((a, b) => a + b, 0) / classAvgs.length) * 100) / 100
          : null

      return {
        subjectId: subject.subjectId,
        name: subject.name,
        coefficient: subject.coefficient,
        devoir1: grades.devoir1,
        devoir2: grades.devoir2,
        examen: grades.examen,
        classAverage,
        studentAverage,
        rank: null,
        appreciation: appreciationFromAverage(studentAverage),
      }
    })

    const rankedSubjects = subjects.map(subject => {
      if (subject.studentAverage === null) return subject
      const classAvgs = (classAveragesBySubject.get(subject.subjectId) ?? [])
        .filter((value): value is number => value !== null)
        .sort((a, b) => b - a)
      const rank = classAvgs.findIndex(value => value <= subject.studentAverage!) + 1
      return { ...subject, rank: rank > 0 ? rank : null }
    })

    const weightedParts = rankedSubjects.filter(item => item.studentAverage !== null)
    let generalAverage: number | null = null
    if (weightedParts.length > 0) {
      const totalCoef = weightedParts.reduce((sum, item) => sum + item.coefficient, 0)
      const weighted = weightedParts.reduce(
        (sum, item) => sum + (item.studentAverage ?? 0) * item.coefficient,
        0,
      )
      generalAverage = Math.round((weighted / totalCoef) * 100) / 100
    }

    const allStudentGenerals: number[] = []
    for (const sid of classStudentIds) {
      let totalCoef = 0
      let weighted = 0
      for (const subject of subjectRows) {
        const result = await getSubjectGradesForStudent(admin, {
          schoolId: params.schoolId,
          studentId: sid,
          subjectId: subject.subjectId,
          termCode,
        })
        if (result.average !== null) {
          totalCoef += subject.coefficient
          weighted += result.average * subject.coefficient
        }
      }
      if (totalCoef > 0) {
        allStudentGenerals.push(Math.round((weighted / totalCoef) * 100) / 100)
      }
    }

    allStudentGenerals.sort((a, b) => b - a)
    const generalRank =
      generalAverage !== null
        ? allStudentGenerals.findIndex(value => value <= generalAverage) + 1 || null
        : null

    const { data: attendanceRaw } = await admin
      .from('attendance_records')
      .select('status, recorded_at')
      .eq('school_id', params.schoolId)
      .eq('student_id', params.studentId)
      .gte('recorded_at', term.start_date)
      .lte('recorded_at', `${term.end_date}T23:59:59`)

    let totalAbsenceHours = 0
    let unjustifiedHours = 0
    for (const record of (attendanceRaw ?? []) as Array<{ status: string; recorded_at: string }>) {
      if (record.status === 'absent' || record.status === 'late') {
        totalAbsenceHours += record.status === 'late' ? 0.5 : 1
        if (record.status === 'absent') unjustifiedHours += 1
      }
    }

    const { data: deductionsRaw } = await admin
      .from('conduct_point_deductions')
      .select('id, points, reason, deducted_at')
      .eq('school_id', params.schoolId)
      .eq('student_id', params.studentId)
      .or(`term.eq.${termCode},term.is.null`)

    const deductions = ((deductionsRaw ?? []) as Array<{
      id: string
      points: number
      reason: string
      deducted_at: string
    }>).map(row => ({
      id: row.id,
      date: row.deducted_at,
      points: Number(row.points),
      reason: row.reason,
    }))

    const totalPointsDeducted = deductions.reduce((sum, item) => sum + item.points, 0)

    const matricule = `${new Date(student.birth_date).getFullYear().toString().slice(-2)}-${student.iun.slice(-8)}`

    return {
      snapshot: {
        templateCode: 'BF_OFFICIAL_V1',
        generatedAt: new Date().toISOString(),
        serialNumber: params.serialNumber,
        qrHash: params.qrHash,
        school: {
          name: school.name,
          structureName: school.structure_name,
          logoUrl: school.logo_url,
          motto: school.motto ?? 'Unité - Progrès - Justice',
          address: school.address,
          city: school.city,
        },
        schoolYear: year.name,
        termLabel: TERM_LABELS[termCode] ?? term.name,
        termCode,
        student: {
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          iun: student.iun,
          matricule,
          birthDate: student.birth_date,
          birthPlace: student.birth_place,
          photoUrl: student.photo_url,
          className: classRow.name,
          classSize,
          headTeacherName: headTeacherName,
        },
        subjects: rankedSubjects,
        generalAverage,
        generalRank,
        generalAppreciation: shortAppreciation(generalAverage),
        absences: {
          totalHours: totalAbsenceHours,
          unjustifiedHours: unjustifiedHours,
        },
        conduct: {
          deductions,
          totalPointsDeducted,
        },
        councilDecision: params.councilDecision ?? null,
        proviseurSignatureLabel: 'Le Proviseur',
        signedAt: null,
      },
    }
  } catch {
    return { error: 'Erreur lors de la construction du bulletin.' }
  }
}
