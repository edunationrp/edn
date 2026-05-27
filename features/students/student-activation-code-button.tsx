'use client'

import { useState } from 'react'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateStudentActivationCode } from '@/lib/actions/student-auth'

export function StudentActivationCodeButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setCode(null)
    const result = await generateStudentActivationCode(studentId)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      setCode(result.code)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        variant="outline"
        className="gap-2"
      >
        <Key className="h-4 w-4" />
        {loading ? 'Génération…' : 'Générer un code d\'activation'}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {code && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-xs text-green-700 font-medium mb-1">Code d'activation (valable 30 jours) :</p>
          <p className="text-2xl font-mono font-bold tracking-widest text-green-900">{code}</p>
          <p className="mt-1 text-xs text-green-700">
            Remettez ce code à l'élève. Il en aura besoin pour activer son compte sur{' '}
            <strong>/login/eleve/activation</strong> avec son IUN.
          </p>
        </div>
      )}
    </div>
  )
}
