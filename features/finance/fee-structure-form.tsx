'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFeeStructure } from '@/lib/actions/fees'
import { notify } from '@/lib/feedback/toast'

export function FeeStructureForm({
  schoolId,
  schoolYearId,
}: {
  schoolId: string
  schoolYearId: string
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isMandatory, setIsMandatory] = useState(true)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createFeeStructure(schoolId, {
        schoolYearId,
        name: name.trim(),
        amount: parseFloat(amount) || 0,
        isMandatory,
        dueDate: dueDate || undefined,
      })
      if (result.error) {
        notify.error(result.error, 'fee_create')
        return
      }
      notify.success('Structure tarifaire créée')
      router.push('/dashboard/finance')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nouvelle structure tarifaire</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Libellé</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Frais de scolarité T1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input id="amount" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Échéance</Label>
            <Input id="due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="rounded" />
            Frais obligatoire
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !name.trim() || !amount}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
