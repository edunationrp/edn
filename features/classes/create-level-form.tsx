'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClassLevel } from '@/lib/actions/classes'
import { notify } from '@/lib/feedback/toast'

export function CreateLevelForm({ schoolId }: { schoolId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [orderNum, setOrderNum] = useState('1')
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createClassLevel(schoolId, name.trim(), parseInt(orderNum, 10) || 1)
      if (result.error) {
        notify.error(result.error, 'class_level')
        return
      }
      notify.success('Niveau créé')
      router.push('/dashboard/classes')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nouveau niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du niveau</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: 6ème" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Ordre d&apos;affichage</Label>
            <Input id="order" type="number" min="1" value={orderNum} onChange={e => setOrderNum(e.target.value)} />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !name.trim()}>
            {isPending ? 'Création…' : 'Créer le niveau'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
