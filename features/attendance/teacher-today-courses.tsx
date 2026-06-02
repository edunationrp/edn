import Link from 'next/link'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TeacherTodayCourse } from '@/lib/attendance/teacher-attendance'

type TeacherTodayCoursesProps = {
  courses: TeacherTodayCourse[]
}

export function TeacherTodayCourses({ courses }: TeacherTodayCoursesProps) {
  if (courses.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-xs text-gray-500">
        Aucun cours assigné pour aujourd&apos;hui. Consultez vos classes ou l&apos;emploi du temps.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-50">
      {courses.map(course => {
        const href = `/dashboard/attendance/take?class=${course.classId}&subject=${course.subjectId}`
        const timeLabel =
          course.startTime && course.endTime
            ? `${course.startTime} – ${course.endTime}`
            : 'Horaire non publié'

        return (
          <div
            key={course.key}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-gray-900">
                  {course.subjectName}
                </p>
                {course.attendanceTaken ? (
                  <Badge className="bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Appel fait
                  </Badge>
                ) : course.attendancePartial ? (
                  <Badge className="bg-amber-100 text-amber-800">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Appel partiel
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    À faire
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {course.className}
                {course.room ? ` · Salle ${course.room}` : ''}
              </p>
              <p className="text-[11px] text-gray-400">{timeLabel}</p>
              {course.recordedCount > 0 && (
                <p className="text-[11px] text-gray-400">
                  {course.recordedCount}/{course.enrolledCount} élève(s) enregistré(s)
                </p>
              )}
            </div>
            <Button asChild size="sm" variant={course.attendanceTaken ? 'outline' : 'default'} className="shrink-0">
              <Link href={href}>
                {course.attendanceTaken ? 'Modifier l\'appel' : 'Faire l\'appel'}
              </Link>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
