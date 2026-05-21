'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertRecord, upsertRecord } from '@/lib/supabase/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Save, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { getMention } from '@/lib/grades'

interface GradeEntryClientProps {
  schoolId: string
  teacherId: string
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string; coefficient: number }>
  currentYear: { id: string; name: string } | null
}

type StudentRow = {
  id: string
  first_name: string
  last_name: string
  iun: string | null
}

type GradeEntry = {
  studentId: string
  value: string
  saved: boolean
  error: string | null
}

const TERMS = [
  { value: 'T1', label: '1er Trimestre' },
  { value: 'T2', label: '2ème Trimestre' },
  { value: 'T3', label: '3ème Trimestre' },
]

const EVAL_TYPES = [
  { value: 'devoir', label: 'Devoir' },
  { value: 'composition', label: 'Composition' },
  { value: 'interrogation', label: 'Interrogation' },
  { value: 'examen', label: 'Examen' },
]

export function GradeEntryClient({
  schoolId,
  teacherId,
  classes,
  subjects,
  currentYear,
}: GradeEntryClientProps) {
  const supabase = createClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('T1')
  const [evalType, setEvalType] = useState('devoir')
  const [evalTitle, setEvalTitle] = useState('')
  const [maxScore, setMaxScore] = useState('20')
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({})
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [evalId, setEvalId] = useState<string | null>(null)
  const [step, setStep] = useState<'config' | 'entry'>('config')

  useEffect(() => {
    if (!selectedClass) return
    loadStudents()
  }, [selectedClass])

  async function loadStudents() {
    setIsLoadingStudents(true)
    const { data } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('class_id', selectedClass)
      .eq('school_year_id', currentYear?.id ?? '')

    const rows = data as Array<{ student_id: string }> | null
    const ids = rows?.map(r => r.student_id) ?? []

    if (ids.length > 0) {
      const { data: studentsRaw } = await supabase
        .from('students')
        .select('id, first_name, last_name, iun')
        .in('id', ids)
        .order('last_name')

      const studentList = studentsRaw as StudentRow[] | null
      setStudents(studentList ?? [])
      const initialGrades: Record<string, GradeEntry> = {}
      for (const s of (studentList ?? [])) {
        initialGrades[s.id] = { studentId: s.id, value: '', saved: false, error: null }
      }
      setGrades(initialGrades)
    } else {
      setStudents([])
      setGrades({})
    }
    setIsLoadingStudents(false)
  }

  async function createEvaluation() {
    if (!selectedClass || !selectedSubject || !evalTitle) return
    setIsSaving(true)
    setSaveError(null)

    const { data: evals, error } = await insertRecord<{ id: string }>(
      'evaluations',
      {
        school_id: schoolId,
        class_id: selectedClass,
        subject_id: selectedSubject,
        title: evalTitle,
        eval_type: evalType,
        max_score: parseFloat(maxScore) || 20,
        eval_date: evalDate,
        term: selectedTerm,
        created_by: teacherId,
        is_locked: false,
      },
      'id'
    )

    if (error) {
      setSaveError(error.message)
      setIsSaving(false)
      return
    }

    if (evals?.[0]) {
      setEvalId(evals[0].id)
      setStep('entry')
    }
    setIsSaving(false)
  }

  function updateGrade(studentId: string, value: string) {
    const numVal = parseFloat(value)
    const maxVal = parseFloat(maxScore) || 20
    let error: string | null = null
    if (value !== '' && (isNaN(numVal) || numVal < 0 || numVal > maxVal)) {
      error = `Valeur entre 0 et ${maxVal}`
    }
    setGrades(prev => ({
      ...prev,
      [studentId]: { studentId, value, saved: false, error },
    }))
  }

  async function saveAllGrades() {
    if (!evalId) return
    setIsSaving(true)
    setSaveError(null)
    let count = 0

    const entries = Object.values(grades).filter(g => g.value !== '' && !g.error)
    for (const entry of entries) {
      const { error } = await upsertRecord('grades', {
        evaluation_id: evalId,
        student_id: entry.studentId,
        school_id: schoolId,
        value: parseFloat(entry.value),
        max_value: parseFloat(maxScore) || 20,
        period: selectedTerm,
        term: selectedTerm,
        created_by: teacherId,
      })

      if (!error) {
        setGrades(prev => ({
          ...prev,
          [entry.studentId]: { ...prev[entry.studentId], saved: true, error: null },
        }))
        count++
      }
    }

    setSavedCount(count)
    setIsSaving(false)
  }

  const currentSubject = subjects.find(s => s.id === selectedSubject)
  const currentClass = classes.find(c => c.id === selectedClass)

  if (step === 'entry') {
    return (
      <div className="space-y-4">
        {/* Info évaluation */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary text-white">{currentClass?.name}</Badge>
              <Badge variant="secondary">{currentSubject?.name}</Badge>
              <Badge variant="outline">{TERMS.find(t => t.value === selectedTerm)?.label}</Badge>
              <span className="font-medium">{evalTitle}</span>
              <span className="text-sm text-muted-foreground">· {maxScore} pts</span>
              <Button variant="ghost" size="sm" onClick={() => setStep('config')} className="ml-auto">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saisie des notes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Saisie des notes ({students.length} élèves)
              </CardTitle>
              <Button onClick={saveAllGrades} disabled={isSaving} size="sm">
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Enregistrer tout</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">{savedCount} note(s) enregistrée(s)</span>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun élève dans cette classe</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2 font-medium">#</th>
                      <th className="text-left px-3 py-2 font-medium">Élève</th>
                      <th className="text-left px-3 py-2 font-medium">IUN</th>
                      <th className="text-center px-3 py-2 font-medium">Note /{maxScore}</th>
                      <th className="text-center px-3 py-2 font-medium">Mention</th>
                      <th className="text-center px-3 py-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const g = grades[student.id]
                      const numVal = parseFloat(g?.value ?? '')
                      const maxVal = parseFloat(maxScore) || 20
                      const normalized = !isNaN(numVal) ? (numVal / maxVal) * 20 : null
                      const mention = normalized !== null ? getMention(normalized) : null

                      return (
                        <tr key={student.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">
                            {student.last_name} {student.first_name}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {student.iun ?? '—'}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              max={maxScore}
                              step="0.25"
                              value={g?.value ?? ''}
                              onChange={e => updateGrade(student.id, e.target.value)}
                              placeholder="—"
                              className={`w-20 text-center h-8 text-sm ${g?.error ? 'border-red-400' : ''}`}
                            />
                            {g?.error && <p className="text-xs text-red-500 mt-0.5">{g.error}</p>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {mention ? (
                              <span className={`text-xs font-medium ${
                                mention === 'Excellent' ? 'text-green-700' :
                                mention === 'Très Bien' ? 'text-blue-700' :
                                mention === 'Bien' ? 'text-blue-500' :
                                mention === 'Assez Bien' ? 'text-yellow-600' :
                                mention === 'Passable' ? 'text-orange-500' :
                                'text-red-500'
                              }`}>{mention}</span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {g?.saved ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : g?.value !== '' ? (
                              <div className="h-2 w-2 rounded-full bg-orange-400 mx-auto" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-gray-200 mx-auto" />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Configuration de l&apos;évaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!currentYear && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">Aucune année scolaire active. Configurez d&apos;abord une année scolaire.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Classe <span className="text-red-500">*</span></Label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Matière <span className="text-red-500">*</span></Label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sélectionner une matière</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} (coeff. {s.coefficient})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Trimestre <span className="text-red-500">*</span></Label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TERMS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Type d&apos;évaluation</Label>
            <select
              value={evalType}
              onChange={e => setEvalType(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {EVAL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Titre de l&apos;évaluation <span className="text-red-500">*</span></Label>
            <Input
              value={evalTitle}
              onChange={e => setEvalTitle(e.target.value)}
              placeholder="Ex: Devoir n°1 - 1er trimestre"
            />
          </div>

          <div className="space-y-2">
            <Label>Note maximale</Label>
            <Input
              type="number"
              value={maxScore}
              onChange={e => setMaxScore(e.target.value)}
              min="1"
              max="100"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Date de l&apos;évaluation</Label>
            <Input
              type="date"
              value={evalDate}
              onChange={e => setEvalDate(e.target.value)}
            />
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{saveError}</span>
          </div>
        )}

        {isLoadingStudents && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des élèves…
          </div>
        )}

        {selectedClass && students.length > 0 && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              {students.length} élève(s) trouvé(s) dans cette classe
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={createEvaluation}
            disabled={!selectedClass || !selectedSubject || !evalTitle || isSaving || !currentYear}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création…</>
            ) : (
              <>Continuer → Saisir les notes</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
