import type { LucideIcon } from 'lucide-react'
import { BookOpen, CheckCircle2, ClipboardList, FileText, FolderOpen } from 'lucide-react'

export const RESOURCE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; badge: string; iconBg: string }
> = {
  cours: {
    label: 'Cours',
    icon: BookOpen,
    badge: 'bg-blue-100 text-blue-800',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  exercice: {
    label: 'Exercice',
    icon: ClipboardList,
    badge: 'bg-orange-100 text-orange-800',
    iconBg: 'bg-orange-100 text-orange-700',
  },
  correction: {
    label: 'Correction',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  document: {
    label: 'Document',
    icon: FileText,
    badge: 'bg-slate-100 text-slate-800',
    iconBg: 'bg-slate-100 text-slate-700',
  },
  autre: {
    label: 'Autre',
    icon: FolderOpen,
    badge: 'bg-violet-100 text-violet-800',
    iconBg: 'bg-violet-100 text-violet-700',
  },
}

const SUBJECT_ACCENTS = [
  { bar: 'bg-[#1B3A6B]', chip: 'bg-[#1B3A6B]/10 text-[#1B3A6B]' },
  { bar: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-800' },
  { bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-800' },
  { bar: 'bg-violet-600', chip: 'bg-violet-50 text-violet-800' },
  { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-800' },
  { bar: 'bg-cyan-600', chip: 'bg-cyan-50 text-cyan-800' },
]

export function getSubjectAccent(subjectName: string) {
  let hash = 0
  for (let i = 0; i < subjectName.length; i += 1) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_ACCENTS[Math.abs(hash) % SUBJECT_ACCENTS.length]
}

export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(/\.0$/, '')} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} Mo`
}

export function getResourceTypeConfig(type: string) {
  return RESOURCE_TYPE_CONFIG[type] ?? RESOURCE_TYPE_CONFIG.document
}
