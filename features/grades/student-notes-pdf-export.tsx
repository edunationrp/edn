'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PublishedTermGrades } from '@/lib/grades/published-notes'
import { SLOT_LABELS } from '@/lib/grades/published-notes'

type Props = {
  term: PublishedTermGrades
  studentName: string
  schoolName: string
  className: string | null
}

export function StudentNotesPdfExport({ term, studentName, schoolName, className }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 18
      let y = margin

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('EduNation — Relevé de notes', margin, y)
      y += 9

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(schoolName, margin, y)
      y += 5
      doc.text(`${studentName}${className ? ` · ${className}` : ''}`, margin, y)
      y += 5
      doc.text(term.termLabel, margin, y)
      y += 10

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Détail par matière', margin, y)
      y += 8

      for (const subject of term.subjects) {
        if (y > 265) {
          doc.addPage()
          y = margin
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(subject.subjectName, margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)

        const slots = (['devoir1', 'devoir2', 'examen'] as const)
          .filter(slot => subject[slot] !== null)
          .map(slot => `${SLOT_LABELS[slot]} : ${subject[slot]}/20`)

        if (slots.length > 0) {
          doc.text(slots.join('  ·  '), margin, y)
          y += 5
        }

        if (subject.average !== null) {
          doc.text(`Moyenne : ${subject.average.toFixed(1)}/20`, margin, y)
          y += 5
        }

        if (subject.appreciation !== '—') {
          doc.setTextColor(60, 60, 60)
          doc.text(`Appréciation : ${subject.appreciation}`, margin, y)
          doc.setTextColor(0, 0, 0)
          y += 5
        }

        y += 4
      }

      y += 4
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(
        'Document généré depuis votre espace élève EduNation. Les notes affichées sont celles publiées par l\'établissement.',
        margin,
        y,
        { maxWidth: 175 },
      )

      const safeName = studentName.replace(/\s+/g, '-').toLowerCase()
      doc.save(`notes-${term.term}-${safeName}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs"
      disabled={loading || term.subjects.length === 0}
      onClick={handleExport}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      Export PDF
    </Button>
  )
}
