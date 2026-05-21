/**
 * Calculs académiques : moyennes, classements, appréciations
 */

export interface GradeEntry {
  grade: number
  coefficient: number
}

export function calculateWeightedAverage(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0
  const totalWeight = grades.reduce((sum, g) => sum + g.coefficient, 0)
  if (totalWeight === 0) return 0
  const weightedSum = grades.reduce((sum, g) => sum + g.grade * g.coefficient, 0)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

export function calculateRanks(averages: { studentId: string; average: number }[]) {
  const sorted = [...averages].sort((a, b) => b.average - a.average)
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }))
}

export function getMention(average: number): string {
  if (average >= 18) return 'Très Bien avec Félicitations'
  if (average >= 16) return 'Très Bien'
  if (average >= 14) return 'Bien'
  if (average >= 12) return 'Assez Bien'
  if (average >= 10) return 'Passable'
  if (average >= 8) return 'Insuffisant'
  return 'Très Insuffisant'
}

export function getMentionCode(average: number): string {
  if (average >= 16) return 'TB'
  if (average >= 14) return 'B'
  if (average >= 12) return 'AB'
  if (average >= 10) return 'P'
  if (average >= 8) return 'F'
  return 'I'
}

export function getAppreciation(average: number): string {
  if (average >= 18) return 'Excellence remarquable. Félicitations du conseil de classe.'
  if (average >= 16) return 'Très bons résultats. Encouragements du conseil de classe.'
  if (average >= 14) return 'Bons résultats. Continuez vos efforts.'
  if (average >= 12) return 'Résultats satisfaisants. Des efforts supplémentaires sont attendus.'
  if (average >= 10) return 'Résultats passables. Un travail plus régulier est nécessaire.'
  if (average >= 8) return 'Résultats insuffisants. Un sérieux effort de rattrapage est indispensable.'
  return 'Résultats très insuffisants. Une remise en question totale est nécessaire.'
}

export function validateGrade(grade: number): boolean {
  return grade >= 0 && grade <= 20
}

export function generateReportCardHash(params: {
  iun: string
  termId: string
  average: number
  timestamp: string
}): string {
  const data = `${params.iun}|${params.termId}|${params.average}|${params.timestamp}`
  // En production, utiliser une vraie fonction de hash côté serveur
  return btoa(data).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}
