export type TutorContextBase = {
  firstName: string
  className: string
  schoolName: string
  subjects: string[]
  recentGrades: Array<{ subject: string; value: number; maxValue: number }>
  isAuthenticated: boolean
}

export const PUBLIC_TUTOR_CONTEXT: TutorContextBase = {
  firstName: 'élève',
  className: 'collège ou lycée',
  schoolName: 'EduNation',
  subjects: [],
  recentGrades: [],
  isAuthenticated: false,
}
