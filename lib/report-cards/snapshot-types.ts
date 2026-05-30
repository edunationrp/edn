export type BulletinSubjectRow = {
  subjectId: string
  name: string
  coefficient: number
  devoir1: number | null
  devoir2: number | null
  examen: number | null
  classAverage: number | null
  studentAverage: number | null
  rank: number | null
  appreciation: string
}

export type BulletinPointDeduction = {
  id: string
  date: string
  points: number
  reason: string
}

export type BulletinSnapshot = {
  templateCode: 'BF_OFFICIAL_V1'
  generatedAt: string
  serialNumber: string
  qrHash: string
  school: {
    name: string
    structureName: string | null
    logoUrl: string | null
    motto: string | null
    address: string | null
    city: string | null
  }
  schoolYear: string
  termLabel: string
  termCode: string
  student: {
    id: string
    firstName: string
    lastName: string
    iun: string
    matricule: string
    birthDate: string
    birthPlace: string | null
    photoUrl: string | null
    className: string
    classSize: number
    headTeacherName: string | null
  }
  subjects: BulletinSubjectRow[]
  generalAverage: number | null
  generalRank: number | null
  generalAppreciation: string
  absences: {
    totalHours: number
    unjustifiedHours: number
  }
  conduct: {
    deductions: BulletinPointDeduction[]
    totalPointsDeducted: number
  }
  councilDecision: string | null
  proviseurSignatureLabel: string
  signedAt: string | null
}
