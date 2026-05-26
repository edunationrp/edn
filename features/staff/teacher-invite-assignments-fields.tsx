'use client'

import { BookOpen, GraduationCap, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TeacherInviteAssignmentInput } from '@/lib/staff/invitation-assignments'

type Option = { id: string; name: string }

type TeacherInviteAssignmentsFieldsProps = {
  classes: Option[]
  subjects: Option[]
  value: TeacherInviteAssignmentInput[]
  onChange: (rows: TeacherInviteAssignmentInput[]) => void
  disabled?: boolean
}

const EMPTY_ROW: TeacherInviteAssignmentInput = { classId: '', subjectId: '' }

export function TeacherInviteAssignmentsFields({
  classes,
  subjects,
  value,
  onChange,
  disabled,
}: TeacherInviteAssignmentsFieldsProps) {
  const rows = value.length > 0 ? value : [{ ...EMPTY_ROW }]

  function updateRow(index: number, patch: Partial<TeacherInviteAssignmentInput>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  function addRow() {
    onChange([...rows, { ...EMPTY_ROW }])
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [{ ...EMPTY_ROW }])
  }

  if (classes.length === 0 || subjects.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
        Configurez d&apos;abord des classes et des matières dans{' '}
        <strong>Classes & matières</strong> avant d&apos;inviter un professeur.
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div>
        <Label className="text-sm font-semibold text-slate-900">Affectations pédagogiques</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Indiquez les classes et matières que ce professeur enseignera. Il complétera son profil à l&apos;acceptation.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={`assignment-${index}`}
            className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Classe</Label>
              <Select
                value={row.classId || undefined}
                onValueChange={v => updateRow(index, { classId: v })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <GraduationCap className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Choisir une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Matière</Label>
              <Select
                value={row.subjectId || undefined}
                onValueChange={v => updateRow(index, { subjectId: v })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Choisir une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={disabled || rows.length <= 1}
                onClick={() => removeRow(index)}
                title="Retirer cette affectation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={disabled}
        onClick={addRow}
      >
        <Plus className="h-4 w-4" />
        Ajouter une classe / matière
      </Button>
    </div>
  )
}

export function normalizeTeacherInviteAssignments(
  rows: TeacherInviteAssignmentInput[]
): TeacherInviteAssignmentInput[] {
  const seen = new Set<string>()
  return rows.filter(row => {
    if (!row.classId || !row.subjectId) return false
    const key = `${row.classId}:${row.subjectId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
