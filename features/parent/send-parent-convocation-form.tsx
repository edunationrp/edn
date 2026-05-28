'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sendParentConvocation } from '@/lib/actions/parent-convocations'

type LinkedParent = {
  parentUserId: string
  fullName: string
  relationType: string
}

type Props = {
  studentId: string
  parents: LinkedParent[]
}

export function SendParentConvocationForm({ studentId, parents }: Props) {
  const router = useRouter()
  const [parentUserId, setParentUserId] = useState(parents[0]?.parentUserId ?? '')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [convocationDate, setConvocationDate] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  if (parents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun parent rattaché à cet élève. Validez d&apos;abord une demande de liaison.
      </p>
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setPending(true)

    const result = await sendParentConvocation({
      studentId,
      parentUserId,
      title,
      message,
      convocationDate: convocationDate || undefined,
      location: location || undefined,
    })

    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess('Convocation envoyée au parent.')
    setTitle('')
    setMessage('')
    setConvocationDate('')
    setLocation('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Parent destinataire</Label>
        <Select value={parentUserId} onValueChange={setParentUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un parent" />
          </SelectTrigger>
          <SelectContent>
            {parents.map(parent => (
              <SelectItem key={parent.parentUserId} value={parent.parentUserId}>
                {parent.fullName} ({parent.relationType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="convocation-title">Objet</Label>
        <Input
          id="convocation-title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Ex. Entretien avec la direction"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="convocation-message">Message</Label>
        <textarea
          id="convocation-message"
          value={message}
          onChange={event => setMessage(event.target.value)}
          placeholder="Détail de la convocation..."
          rows={4}
          required
          className={cn(
            'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="convocation-date">Date du rendez-vous (optionnel)</Label>
          <Input
            id="convocation-date"
            type="datetime-local"
            value={convocationDate}
            onChange={event => setConvocationDate(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="convocation-location">Lieu (optionnel)</Label>
          <Input
            id="convocation-location"
            value={location}
            onChange={event => setLocation(event.target.value)}
            placeholder="Bureau du proviseur"
          />
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer la convocation'}
      </Button>
    </form>
  )
}
