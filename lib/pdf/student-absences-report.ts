import type { jsPDF } from 'jspdf'
import { formatDate } from '@/lib/utils'
import {
  buildTrimesterRecap,
  groupRecordsByTrimesterAndSubject,
  justificationPdfDetail,
  type StudentAbsenceRecord,
} from '@/lib/eleve/student-attendance-shared'

const BRAND_RGB: [number, number, number] = [27, 58, 107]
const MARGIN = 14
const PAGE_BOTTOM = 287
const HEADER_H = 36

export type StudentAbsencesPdfInput = {
  records: StudentAbsenceRecord[]
  studentName: string
  schoolName: string
  className: string
  schoolLogoUrl?: string | null
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
        const maxSide = 280
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

function drawPageFooter(doc: jsPDF, page: number, total: number) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text('EduNation — Relevé officiel absences & retards', MARGIN, 292)
  doc.text(`Page ${page} / ${total}`, w - MARGIN, 292, { align: 'right' })
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage()
    return MARGIN + 8
  }
  return y
}

function drawSummaryTable(
  doc: jsPDF,
  records: StudentAbsenceRecord[],
  startY: number,
): number {
  const recap = buildTrimesterRecap(records)
  const colX = [MARGIN, MARGIN + 52, MARGIN + 82, MARGIN + 112, MARGIN + 142]
  const rowH = 7
  let y = startY

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text('Synthèse par trimestre', MARGIN, y)
  y += 6

  doc.setFillColor(240, 244, 248)
  doc.rect(MARGIN, y - 4, 182, rowH, 'F')
  doc.setDrawColor(200, 210, 220)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y - 4, 182, rowH)

  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  const headers = ['Trimestre', 'Période', 'Absences', 'Retards', 'Matières']
  headers.forEach((h, i) => doc.text(h, colX[i] + 1, y))

  y += rowH
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  for (const term of recap) {
    y = ensureSpace(doc, y, rowH + 2)
    doc.setDrawColor(220, 225, 230)
    doc.rect(MARGIN, y - 4, 182, rowH)
    doc.text(term.label, colX[0] + 1, y)
    doc.text(term.periodHint, colX[1] + 1, y)
    doc.text(String(term.absences), colX[2] + 1, y)
    doc.text(String(term.lates), colX[3] + 1, y)
    doc.text(String(term.subjectCount), colX[4] + 1, y)
    y += rowH
  }

  return y + 6
}

function drawDetailTable(
  doc: jsPDF,
  rows: StudentAbsenceRecord[],
  startY: number,
): number {
  const colX = [MARGIN, MARGIN + 28, MARGIN + 52, MARGIN + 88]
  const colW = [26, 22, 34, 94]
  const headerH = 7
  const lineH = 5
  let y = startY

  y = ensureSpace(doc, y, headerH + 10)

  doc.setFillColor(27, 58, 107)
  doc.rect(MARGIN, y - 4, 182, headerH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  ;['Date', 'Statut', 'Justification', 'Motif'].forEach((h, i) => {
    doc.text(h, colX[i] + 2, y)
  })
  y += headerH

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 30, 30)

  for (const record of rows) {
    const { statusLabel, motif } = justificationPdfDetail(record)
    const typeLabel = record.status === 'absent' ? 'Absent' : 'Retard'
    const motifLines = doc.splitTextToSize(motif, colW[3] - 4)
    const rowHeight = Math.max(lineH, motifLines.length * lineH) + 2

    y = ensureSpace(doc, y, rowHeight + 2)
    doc.setDrawColor(230, 233, 238)
    doc.setLineWidth(0.15)
    doc.rect(MARGIN, y - 4, 182, rowHeight)

    doc.text(formatDate(record.recordedAt), colX[0] + 2, y)
    doc.text(typeLabel, colX[1] + 2, y)
    doc.text(statusLabel, colX[2] + 2, y)
    doc.text(motifLines, colX[3] + 2, y)
    y += rowHeight
  }

  return y + 4
}

export async function generateStudentAbsencesPdf(input: StudentAbsencesPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const logo = input.schoolLogoUrl ? await loadLogoForPdf(input.schoolLogoUrl) : null

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageW, HEADER_H, 'F')

  let textX = MARGIN
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, MARGIN, 7, 24, 24)
      textX = MARGIN + 28
    } catch {
      textX = MARGIN
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Relevé des absences & retards', textX, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(input.schoolName, textX, 21)
  doc.setFontSize(9)
  doc.text(`${input.studentName}  ·  ${input.className}`, textX, 27)
  doc.text(`Document généré le ${formatDate(new Date())}`, textX, 32)

  doc.setTextColor(90, 90, 90)
  doc.setFontSize(8)
  doc.text('EduNation', pageW - MARGIN, 12, { align: 'right' })

  let y = HEADER_H + 10

  doc.setTextColor(0, 0, 0)
  y = drawSummaryTable(doc, input.records, y)

  const groups = groupRecordsByTrimesterAndSubject(input.records)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  y = ensureSpace(doc, y, 12)
  doc.text('Détail par trimestre et par matière', MARGIN, y)
  y += 8

  for (const term of groups) {
    const hasRows = term.subjects.some(s => s.rows.length > 0)
    if (!hasRows) continue

    y = ensureSpace(doc, y, 14)
    doc.setFillColor(240, 244, 248)
    doc.rect(MARGIN, y - 5, 182, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...BRAND_RGB)
    doc.text(`${term.termLabel} (${term.periodHint})`, MARGIN + 2, y)
    y += 10

    for (const subject of term.subjects) {
      if (subject.rows.length === 0) continue
      y = ensureSpace(doc, y, 16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)
      doc.text(subject.subjectName, MARGIN + 2, y)
      y += 5
      y = drawDetailTable(doc, subject.rows, y)
    }
    y += 4
  }

  if (input.records.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Aucune absence ni retard enregistré pour cette année scolaire.', MARGIN, y)
  }

  y = ensureSpace(doc, y, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  doc.text(
    'Ce relevé est destiné aux familles. Les justifications d\'absence sont déposées et validées via l\'espace parent EduNation. En cas de question, contactez le secrétariat de l\'établissement.',
    MARGIN,
    y,
    { maxWidth: 182 },
  )

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p)
    drawPageFooter(doc, p, totalPages)
  }

  const safeName = input.studentName.replace(/\s+/g, '-').toLowerCase()
  doc.save(`releve-absences-${safeName}.pdf`)
}
