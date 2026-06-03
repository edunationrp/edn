'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildBulletinCardSummary } from '@/lib/report-cards/bulletin-summary'
import { buildBulletinClassHints } from '@/lib/report-cards/bulletin-class-hints'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

type Props = {
  snapshot: BulletinSnapshot
  period: string | null
  term: string | null
  schoolYearName: string | null
  average: number | null
  rank: number | null
  classSize: number | null
  schoolLogoUrl?: string | null
  size?: 'sm' | 'default'
  className?: string
}

async function loadLogoForPdf(
  url: string,
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const maxSide = 200
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight, 1))
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ dataUrl: canvas.toDataURL('image/png'), format: 'PNG' })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function StudentBulletinPdfExport({
  snapshot,
  period,
  term,
  schoolYearName,
  average,
  rank,
  classSize,
  schoolLogoUrl,
  size = 'sm',
  className,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 16
      let y = margin

      const logo = schoolLogoUrl ? await loadLogoForPdf(schoolLogoUrl) : null
      if (logo) {
        doc.addImage(logo.dataUrl, logo.format, margin, y, 18, 18)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('EduNation — Synthèse de bulletin', logo ? margin + 22 : margin, y + 6)
      y += logo ? 22 : 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text(snapshot.school.name, margin, y)
      y += 5
      const studentLine = `${snapshot.student.lastName} ${snapshot.student.firstName} · ${snapshot.student.className}`
      doc.text(studentLine, margin, y)
      y += 5

      const summary = buildBulletinCardSummary(
        period,
        term,
        schoolYearName,
        snapshot,
        average,
        rank,
        classSize,
      )
      doc.text(summary.title, margin, y)
      y += 5
      if (summary.schoolYear) {
        doc.text(`Année scolaire ${summary.schoolYear}`, margin, y)
        y += 5
      }
      if (summary.generalAverage !== null) {
        doc.setTextColor(0, 0, 0)
        doc.text(`Moyenne générale : ${summary.generalAverage.toFixed(2)}/20`, margin, y)
        y += 5
      }
      if (summary.rankLabel) {
        doc.text(`Classement : ${summary.rankLabel}`, margin, y)
        y += 5
      }
      if (summary.appreciation !== '—') {
        doc.text(`Appréciation : ${summary.appreciation}`, margin, y, { maxWidth: 175 })
        y += 8
      }

      y += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Notes par matière', margin, y)
      y += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)

      for (const subject of snapshot.subjects) {
        if (y > 265) {
          doc.addPage()
          y = margin
        }
        const parts: string[] = []
        if (subject.devoir1 !== null) parts.push(`D1: ${subject.devoir1}`)
        if (subject.devoir2 !== null) parts.push(`D2: ${subject.devoir2}`)
        if (subject.examen !== null) parts.push(`Ex: ${subject.examen}`)
        const avg =
          subject.studentAverage !== null ? ` · Moy. ${subject.studentAverage.toFixed(1)}/20` : ''
        const classAvg =
          subject.classAverage !== null ? ` (classe ~${subject.classAverage.toFixed(1)})` : ''
        doc.setFont('helvetica', 'bold')
        doc.text(subject.name, margin, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        if (parts.length > 0) {
          doc.text(parts.join('  ') + avg + classAvg, margin, y, { maxWidth: 175 })
          y += 4
        } else if (subject.studentAverage !== null) {
          doc.text(`Moyenne : ${subject.studentAverage.toFixed(1)}/20${classAvg}`, margin, y)
          y += 4
        }
        if (subject.appreciation && subject.appreciation !== '—') {
          doc.setTextColor(90, 90, 90)
          doc.text(subject.appreciation, margin, y, { maxWidth: 175 })
          doc.setTextColor(0, 0, 0)
          y += 4
        }
        y += 2
      }

      const hints = buildBulletinClassHints(snapshot, 4)
      if (hints.length > 0) {
        y += 3
        if (y > 250) {
          doc.addPage()
          y = margin
        }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('Repères par rapport à la classe', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        for (const hint of hints) {
          doc.text(`• ${hint.subjectName} : ${hint.message}`, margin, y, { maxWidth: 175 })
          y += 4
        }
      }

      y += 6
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text(
        `Réf. authentification : ${snapshot.serialNumber} · ${snapshot.qrHash.slice(0, 24)}…`,
        margin,
        y,
      )
      y += 4
      doc.text(
        'Document de synthèse généré depuis l\'espace élève. Le bulletin officiel complet reste disponible sur EduNation.',
        margin,
        y,
        { maxWidth: 175 },
      )

      const safeName = `${snapshot.student.lastName}-${snapshot.student.firstName}`
        .replace(/\s+/g, '-')
        .toLowerCase()
      const termSlug = (snapshot.termCode || term || 'bulletin').toLowerCase()
      doc.save(`bulletin-synthese-${termSlug}-${safeName}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="mr-1.5 h-3.5 w-3.5" />
      )}
      PDF
    </Button>
  )
}
