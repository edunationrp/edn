import type { jsPDF } from 'jspdf'
import { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { formatTimetableRoom } from '@/lib/timetable/display'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import { formatDate } from '@/lib/utils'

const BRAND_RGB: [number, number, number] = [27, 58, 107]
const MARGIN = 14
const PAGE_BOTTOM = 287
const HEADER_H = 36

export type StudentTimetablePdfInput = {
  slots: TimetableSlotView[]
  displayTimeRows: GridTimeRow[]
  breaks: TimetableBreakView[]
  studentName: string
  schoolName: string
  className: string
  schoolYearName?: string | null
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

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_BOTTOM) {
    doc.addPage()
    return MARGIN + 8
  }
  return y
}

export async function generateStudentTimetablePdf(input: StudentTimetablePdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const logo = input.schoolLogoUrl ? await loadLogoForPdf(input.schoolLogoUrl) : null

  doc.setFillColor(...BRAND_RGB)
  doc.rect(0, 0, pageW, HEADER_H, 'F')

  let textX = MARGIN
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, MARGIN, 7, 22, 22)
      textX = MARGIN + 26
    } catch {
      textX = MARGIN
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Emploi du temps', textX, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(input.schoolName, textX, 21)
  doc.setFontSize(9)
  doc.text(`${input.studentName} · ${input.className}`, textX, 27)
  if (input.schoolYearName) {
    doc.text(`Année ${input.schoolYearName}`, textX, 32)
  }

  let y = HEADER_H + 10
  doc.setTextColor(0, 0, 0)

  for (const day of WEEKDAY_NUMBERS) {
    const daySlots = input.slots
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    y = ensureSpace(doc, y, 12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...BRAND_RGB)
    doc.text(DAY_LABELS[day] ?? `Jour ${day}`, MARGIN, y)
    y += 6

    if (daySlots.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text('Aucun cours', MARGIN, y)
      y += 6
      continue
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)

    for (const slot of daySlots) {
      y = ensureSpace(doc, y, 8)
      const room = formatTimetableRoom(slot.room)
      const line = `${slot.startTime} – ${slot.endTime}  ·  ${slot.subjectName}  ·  ${slot.teacherName}${room ? `  ·  ${room}` : ''}`
      doc.text(line, MARGIN, y, { maxWidth: 182 })
      y += 5
    }

    y += 3
  }

  const breakRows = input.displayTimeRows.filter(r => r.kind !== 'course')
  if (breakRows.length > 0) {
    y = ensureSpace(doc, y, 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...BRAND_RGB)
    doc.text('Pauses & déjeuner', MARGIN, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    for (const row of breakRows) {
      const label = input.breaks.find(b => b.id === row.id)?.label ?? row.label
      doc.text(`· ${label} : ${row.label}`, MARGIN, y)
      y += 5
    }
  }

  y = ensureSpace(doc, y, 10)
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Document généré le ${formatDate(new Date())} depuis EduNation. Les horaires sont ceux publiés par l'établissement.`,
    MARGIN,
    y,
    { maxWidth: 182 },
  )

  const safeClass = input.className.replace(/\s+/g, '-').toLowerCase()
  doc.save(`emploi-du-temps-${safeClass}.pdf`)
}
