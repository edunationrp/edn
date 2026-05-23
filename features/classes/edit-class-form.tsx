'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClass } from '@/lib/actions/classes'
import { notify } from '@/lib/feedback/toast'

type Level = { id: string; name: string }

export function EditClassForm({
  classId,
  schoolId,
  schoolYearId,
  levels,
  initial,
}: {
  classId: string
  schoolId: string
  schoolYearId: string
  levels: Level[]
  initial: { name: string; levelId: string; capacity: number | null }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [levelId, setLevelId] = useState(initial.levelId)
  const [capacity, setCapacity] = useState(initial.capacity?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateClass(classId, schoolId, {
        name: name.trim(),
        levelId,
        schoolYearId,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
      })
      if (result.error) {
        notify.error(result.error, 'class_update')
        return
      }
      notify.success('Classe mise à jour')
      router.push(`/dashboard/classes/${classId}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Modifier la classe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nom de la classe</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Niveau</Label>
            <select
              id="level"
              value={levelId}
              onChange={e => setLevelId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité</Label>
            <Input id="capacity" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
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
