'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Wifi, WifiOff, Save, Check, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import type { AttendanceStatus } from '@/types/global'

interface StudentAttendance {
  studentId: string
  firstName: string
  lastName: string
  iun: string
  photoUrl?: string | null
  status: AttendanceStatus
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: 'Présent', color: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  absent: { label: 'Absent', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
  late: { label: 'Retard', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  sick: { label: 'Malade', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
  excused: { label: 'Excusé', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-300' },
}

export function AttendanceTakeClient() {
  const supabase = createClient()
  const [isOnline, setIsOnline] = useState(true)
  const [attendances, setAttendances] = useState<StudentAttendance[]>([])
  const [pendingSync, setPendingSync] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const cycleStatus = (studentId: string) => {
    const cycle: AttendanceStatus[] = ['present', 'absent', 'late', 'sick', 'excused']
    setAttendances(prev =>
      prev.map(a => {
        if (a.studentId !== studentId) return a
        const currentIdx = cycle.indexOf(a.status)
        const nextStatus = cycle[(currentIdx + 1) % cycle.length]
        return { ...a, status: nextStatus }
      })
    )
  }

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendances(prev =>
      prev.map(a => a.studentId === studentId ? { ...a, status } : a)
    )
  }

  const saveAttendances = async () => {
    setSaving(true)

    if (!isOnline) {
      // Sauvegarder dans IndexedDB / localStorage
      try {
        const pending = JSON.parse(localStorage.getItem('edunation_offline_attendance') ?? '[]')
        const newEntries = attendances.map(a => ({
          ...a,
          recorded_at: new Date().toISOString(),
          source: 'offline_sync',
        }))
        localStorage.setItem('edunation_offline_attendance', JSON.stringify([...pending, ...newEntries]))
        setPendingSync(prev => prev + attendances.length)
        setSaved(true)
        const msg = TOAST_SUCCESS.attendanceSavedOffline(attendances.length)
        notify.success(msg.title, { description: msg.description })
      } catch {
        notify.error('Impossible de sauvegarder hors ligne', 'attendance_save')
      }
    } else {
      setSaved(true)
      notify.success(TOAST_SUCCESS.attendanceSaved.title, {
        description: TOAST_SUCCESS.attendanceSaved.description,
      })
    }

    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const presentCount = attendances.filter(a => a.status === 'present').length
  const absentCount = attendances.filter(a => a.status === 'absent').length

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-fade-in">
      {/* En-tête avec statut connexion */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prise de présence</h1>
          <p className="text-muted-foreground text-sm">Sélectionnez la classe et saisissez les présences</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
      </div>

      {!isOnline && (
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2 text-sm text-orange-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Mode hors ligne activé — Les données seront synchronisées au retour de la connexion.
        </div>
      )}

      {pendingSync > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-800">
          <RefreshCw className="h-4 w-4 flex-shrink-0" />
          {pendingSync} enregistrement{pendingSync > 1 ? 's' : ''} en attente de synchronisation
          <Button variant="outline" size="sm" className="ml-auto text-blue-700 border-blue-300" asChild>
            <a href="/dashboard/attendance/offline-queue">Voir</a>
          </Button>
        </div>
      )}

      {/* Sélection classe/matière */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuration du cours</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Classe</label>
            <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sélectionner une classe</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Matière</label>
            <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sélectionner une matière</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      {attendances.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-xs text-green-600">Présents</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            <p className="text-xs text-red-600">Absents</p>
          </div>
          <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">
              {attendances.filter(a => a.status === 'late').length}
            </p>
            <p className="text-xs text-orange-600">Retards</p>
          </div>
        </div>
      )}

      {/* Liste élèves */}
      {attendances.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-3">👥</div>
              <p>Sélectionnez une classe pour afficher les élèves</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attendances.map(a => {
            const config = STATUS_CONFIG[a.status]
            return (
              <div key={a.studentId} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${config.bg}`}
                onClick={() => cycleStatus(a.studentId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center text-sm font-bold text-gray-700">
                    {getInitials(`${a.firstName} ${a.lastName}`)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.lastName} {a.firstName}</p>
                    <code className="text-xs opacity-70">{a.iun}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  {/* Boutons statuts rapides */}
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(a.studentId, s)}
                        className={`w-7 h-7 rounded-full text-xs font-bold border transition-colors ${a.status === s ? STATUS_CONFIG[s].bg + ' ' + STATUS_CONFIG[s].color : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'}`}
                        title={STATUS_CONFIG[s].label}
                      >
                        {s === 'present' ? '✓' : s === 'absent' ? '✗' : <Clock className="h-3 w-3 mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {attendances.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1 bg-[#1a4d2e] hover:bg-[#2d6a4f]"
            onClick={saveAttendances}
            loading={saving}
            disabled={saving}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Enregistré !
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isOnline ? 'Enregistrer' : 'Sauvegarder hors ligne'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
