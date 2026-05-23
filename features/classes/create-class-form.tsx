'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClass } from '@/lib/actions/classes'
import { notify } from '@/lib/feedback/toast'

type Level = { id: string; name: string }

export function CreateClassForm({
  schoolId,
  schoolYearId,
  levels,
}: {
  schoolId: string
  schoolYearId: string
  levels: Level[]
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [levelId, setLevelId] = useState(levels[0]?.id ?? '')
  const [capacity, setCapacity] = useState('')
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createClass(schoolId, {
        name: name.trim(),
        levelId,
        schoolYearId,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
      })
      if (result.error) {
        notify.error(result.error, 'class_create')
        return
      }
      notify.success('Classe créée')
      router.push('/dashboard/classes')
      router.refresh()
    })
  }

  if (levels.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Créez d&apos;abord un niveau avant d&apos;ajouter une classe.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nouvelle classe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nom de la classe</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: 6ème A" required />
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
            <Label htmlFor="capacity">Capacité (optionnel)</Label>
            <Input id="capacity" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !name.trim()}>
              {isPending ? 'Création…' : 'Créer la classe'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
