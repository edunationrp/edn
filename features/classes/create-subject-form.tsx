'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSubject } from '@/lib/actions/classes'
import { notify } from '@/lib/feedback/toast'

export function CreateSubjectForm({ schoolId }: { schoolId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createSubject(schoolId, {
        name: name.trim(),
        coefficient: parseFloat(coefficient) || 1,
      })
      if (result.error) {
        notify.error(result.error, 'subject_create')
        return
      }
      notify.success('Matière créée')
      router.push('/dashboard/classes')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nouvelle matière</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nom de la matière</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Mathématiques" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coef">Coefficient</Label>
            <Input id="coef" type="number" min="0.5" step="0.5" value={coefficient} onChange={e => setCoefficient(e.target.value)} />
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !name.trim()}>
              {isPending ? 'Création…' : 'Créer la matière'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
