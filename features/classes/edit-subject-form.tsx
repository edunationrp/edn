'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSubject } from '@/lib/actions/classes'
import { notify } from '@/lib/feedback/toast'

export function EditSubjectForm({
  subjectId,
  schoolId,
  initial,
}: {
  subjectId: string
  schoolId: string
  initial: { name: string; coefficient: number; isActive: boolean }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [coefficient, setCoefficient] = useState(String(initial.coefficient))
  const [isActive, setIsActive] = useState(initial.isActive)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateSubject(subjectId, schoolId, {
        name: name.trim(),
        coefficient: parseFloat(coefficient) || 1,
        isActive,
      })
      if (result.error) {
        notify.error(result.error, 'subject_update')
        return
      }
      notify.success('Matière mise à jour')
      router.push('/dashboard/classes')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Modifier la matière</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coef">Coefficient</Label>
            <Input id="coef" type="number" min="0.5" step="0.5" value={coefficient} onChange={e => setCoefficient(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              Matière active
            </label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
