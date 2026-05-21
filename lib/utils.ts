import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy') {
  return format(new Date(date), pattern, { locale: fr })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy à HH:mm', { locale: fr })
}

export function formatRelativeDate(date: string | Date) {
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: fr,
  })
}

export function formatCurrency(amount: number, currency = 'FCFA') {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`
}

export function formatGrade(grade: number) {
  return grade.toFixed(2)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateReference() {
  return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    transferred: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-800',
    generated: 'bg-blue-100 text-blue-800',
    validated: 'bg-green-100 text-green-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-gray-100 text-gray-800',
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-orange-100 text-orange-800',
    sick: 'bg-blue-100 text-blue-800',
    excused: 'bg-teal-100 text-teal-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    pending: 'En attente',
    rejected: 'Rejeté',
    transferred: 'Transféré',
    inactive: 'Inactif',
    paid: 'Payé',
    partial: 'Partiel',
    overdue: 'En retard',
    cancelled: 'Annulé',
    draft: 'Brouillon',
    generated: 'Généré',
    validated: 'Validé',
    published: 'Publié',
    archived: 'Archivé',
    present: 'Présent',
    absent: 'Absent',
    late: 'Retard',
    sick: 'Malade',
    excused: 'Excusé',
  }
  return labels[status] ?? status
}
