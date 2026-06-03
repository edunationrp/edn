'use client'

import { useState } from 'react'
import { Check, Copy, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'

type Props = {
  snapshot: BulletinSnapshot
  triggerClassName?: string
}

export function StudentBulletinQrDialog({ snapshot, triggerClassName }: Props) {
  const [copied, setCopied] = useState<'serial' | 'hash' | null>(null)

  async function copyValue(value: string, kind: 'serial' | 'hash') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={triggerClassName}>
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Vérifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Authenticité du bulletin</DialogTitle>
          <DialogDescription>
            Ces identifiants correspondent au bulletin officiel publié par ton établissement. Tu
            peux les comparer au code affiché en bas du document imprimé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Numéro de série
            </p>
            <p className="mt-1 break-all font-mono text-xs text-gray-900">{snapshot.serialNumber}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-8 gap-1.5 px-2 text-xs"
              onClick={() => void copyValue(snapshot.serialNumber, 'serial')}
            >
              {copied === 'serial' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copier
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Empreinte d&apos;authentification
            </p>
            <p className="mt-1 break-all font-mono text-xs text-gray-900">{snapshot.qrHash}</p>
            <p className="mt-1 text-xs text-slate-500">
              Sur le bulletin imprimé : « Auth. {snapshot.qrHash.slice(0, 16)}… »
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-8 gap-1.5 px-2 text-xs"
              onClick={() => void copyValue(snapshot.qrHash, 'hash')}
            >
              {copied === 'hash' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copier l&apos;empreinte complète
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-slate-600">
            Établissement : {snapshot.school.name} · {snapshot.termLabel} ·{' '}
            {snapshot.schoolYear}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
