import { StudentShell } from '@/components/eleve/student-shell'
import { getStudentShellData } from '@/lib/eleve/student-shell-data'

export async function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const shell = await getStudentShellData()

  return (
    <StudentShell
      userId={shell.userId}
      studentName={shell.studentName}
      iun={shell.iun}
      className={shell.className}
      schoolName={shell.schoolName}
      schoolYear={shell.schoolYear}
      schoolLogoUrl={shell.schoolLogoUrl}
      schoolWatermarkOpacity={shell.schoolWatermarkOpacity}
      notifications={shell.notifications}
      unreadNotifications={shell.unreadNotifications}
    >
      {children}
    </StudentShell>
  )
}
