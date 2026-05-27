'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchEncashmentContext, recordPaymentWithEmail } from '@/lib/actions/payments'
import { saveStudentExtraFees } from '@/lib/actions/extra-fees'
import type { EncashmentContext, ExtraFeeLine } from '@/lib/finance/encashment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  User,
  CreditCard,
  CheckCircle,
  Loader2,
  Receipt,
  Users,
  GraduationCap,
  Phone,
  Lock,
  Plus,
  Trash2,
  Printer,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { parseMoneyInput, toMoney, sumMoney } from '@/lib/finance/money'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'
import { SchoolBrandHeader } from '@/components/schools/school-brand-header'

interface NewPaymentFormProps {
  schoolId: string
  schoolName: string
  schoolLogoUrl?: string | null
  cassierId: string
  initialStudentId?: string | null
}

type StudentSearchResult = {
  id: string
  first_name: string
  last_name: string
  iun: string | null
  status: string
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money (Orange/Moov)' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
]

function generateReference() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `EDN-${year}${month}-${random}`
}

function newExtraId() {
  return `extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function NewPaymentForm({
  schoolId,
  schoolName,
  schoolLogoUrl,
  cassierId,
  initialStudentId,
}: NewPaymentFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId') ?? initialStudentId ?? null
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [context, setContext] = useState<EncashmentContext | null>(null)
  const [extraFees, setExtraFees] = useState<ExtraFeeLine[]>([])
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [amountToCollect, setAmountToCollect] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingExtras, startSaveExtras] = useTransition()
  const [receipt, setReceipt] = useState<{
    reference: string
    amount: number
    studentName: string
    remainingAfter: number
    paymentId: string
    totalDue: number
    totalPaid: number
  } | null>(null)

  const loadStudent = useCallback(
    async (studentId: string) => {
      setIsLoadingContext(true)
      const result = await fetchEncashmentContext(schoolId, studentId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        setContext(null)
        setIsLoadingContext(false)
        return
      }
      setContext(result.context)
      setExtraFees(result.context.extraFees)
      setAmountToCollect(String(result.context.remaining || ''))
      setIsLoadingContext(false)
    },
    [schoolId]
  )

  useEffect(() => {
    if (studentIdFromUrl) loadStudent(studentIdFromUrl)
  }, [studentIdFromUrl, loadStudent])

  async function searchStudents() {
    if (searchQuery.trim().length < 2) return
    setIsSearching(true)
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, iun, status')
      .eq('school_id', schoolId)
      .or(
        `last_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,iun.ilike.%${searchQuery}%`
      )
      .limit(10)
    setSearchResults((data as StudentSearchResult[] | null) ?? [])
    setIsSearching(false)
  }

  const tuitionAmount = toMoney(context?.officialTuition.amount ?? 0)
  const extraTotal = useMemo(
    () => sumMoney(extraFees.map(f => f.amount)),
    [extraFees]
  )
  const totalDue = toMoney(tuitionAmount + extraTotal)
  const totalPaidBefore = toMoney(context?.totalPaid ?? 0)
  const payingToday = parseMoneyInput(amountToCollect)
  const remainingAfterToday = Math.max(0, totalDue - totalPaidBefore - payingToday)
  const maxCollectable = Math.max(0, totalDue - totalPaidBefore)

  useEffect(() => {
    if (context) setAmountToCollect(String(maxCollectable))
  }, [maxCollectable, context])

  function addExtraFromTemplate(templateId: string) {
    const template = context?.extraFeeTemplates.find(t => t.id === templateId)
    if (!template) return
    if (extraFees.some(f => f.templateId === templateId)) {
      notify.error('Ce frais est déjà ajouté au dossier.')
      return
    }
    setExtraFees(prev => [
      ...prev,
      {
        id: newExtraId(),
        label: template.name,
        amount: template.suggestedAmount ?? 0,
        templateId: template.id,
      },
    ])
  }

  function addCustomExtra() {
    setExtraFees(prev => [
      ...prev,
      { id: newExtraId(), label: '', amount: 0 },
    ])
  }

  function updateExtra(id: string, patch: Partial<ExtraFeeLine>) {
    setExtraFees(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  function removeExtra(id: string) {
    setExtraFees(prev => prev.filter(f => f.id !== id))
  }

  function persistExtras() {
    if (!context?.schoolYear) return
    startSaveExtras(async () => {
      const result = await saveStudentExtraFees(
        schoolId,
        context.student.id,
        context.schoolYear!.id,
        extraFees.filter(f => f.label.trim() && f.amount > 0)
      )
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Frais supplémentaires enregistrés')
      await loadStudent(context.student.id)
    })
  }

  async function handleSubmit() {
    if (!context) return
    if (payingToday <= 0) return
    if (payingToday > maxCollectable) {
      notify.error(`Maximum encaissable : ${formatCurrency(maxCollectable)}`)
      return
    }
    if (!context.officialTuition.configured) {
      notify.error('Aucun tarif officiel configuré pour cette classe. Contactez le proviseur.')
      return
    }

    setIsSaving(true)
    const reference = generateReference()
    const method =
      paymentMethod === 'check'
        ? 'other'
        : (paymentMethod as 'cash' | 'mobile_money' | 'bank_transfer' | 'other')
    const studentName = `${context.student.lastName} ${context.student.firstName}`
    const validExtras = extraFees.filter(f => f.label.trim() && f.amount > 0)

    const result = await recordPaymentWithEmail({
      schoolId,
      schoolName,
      studentId: context.student.id,
      studentName,
      amount: payingToday,
      paymentMethod: method,
      reference,
      recordedBy: cassierId,
      notes,
      schoolYearId: context.schoolYear?.id,
      dossierId: context.dossierId,
      officialTuition: {
        rateId: context.officialTuition.rateId,
        amount: context.officialTuition.amount,
        label: context.officialTuition.label,
      },
      extraFees: validExtras,
      totalDue,
    })

    if (result.error) {
      notify.error(result.error, 'payment_save')
      setIsSaving(false)
      return
    }

    if (result.payment) {
      const ref = result.payment.reference ?? reference
      notify.success(TOAST_SUCCESS.paymentSaved(ref).title)
      setReceipt({
        reference: ref,
        amount: toMoney(result.payment.amount),
        studentName,
        remainingAfter: result.remainingAfter ?? 0,
        paymentId: result.payment.id,
        totalDue,
        totalPaid: totalPaidBefore + payingToday,
      })
    }
    setIsSaving(false)
  }

  if (receipt) {
    return (
      <div className="encashment-receipt space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="space-y-4 p-8 text-center">
            <SchoolBrandHeader
              schoolName={schoolName}
              logoUrl={schoolLogoUrl}
              subtitle="Reçu de paiement"
            />
            <h2 className="text-xl font-bold text-green-800">Paiement enregistré</h2>
            <p className="text-green-700">{receipt.studentName}</p>
            <div className="space-y-2 rounded-xl border border-green-200 bg-white p-4 text-left text-sm">
              <Row label="Référence" value={receipt.reference} mono />
              <Row label="Montant encaissé" value={formatCurrency(receipt.amount)} bold />
              <Row label="Total dossier" value={formatCurrency(receipt.totalDue)} />
              <Row label="Total payé" value={formatCurrency(receipt.totalPaid)} />
              <Row label="Reste à payer" value={formatCurrency(receipt.remainingAfter)} />
            </div>
            <div className="flex flex-wrap justify-center gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimer le reçu
              </Button>
              <Button variant="outline" asChild>
                <a href={`/dashboard/finance/payments/${receipt.paymentId}/receipt`}>
                  Reçu détaillé
                </a>
              </Button>
              <Button
                onClick={() => {
                  setReceipt(null)
                  setContext(null)
                  router.push('/dashboard/finance/payments/new')
                }}
              >
                Nouveau paiement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {!context && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              Sélectionner l&apos;élève
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nom, prénom ou IUN…"
                onKeyDown={e => e.key === 'Enter' && searchStudents()}
              />
              <Button onClick={searchStudents} disabled={isSearching} variant="outline">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {searchResults.map(student => (
              <button
                key={student.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/40 hover:bg-primary/5"
                onClick={() => {
                  setSearchResults([])
                  loadStudent(student.id)
                  router.replace(`/dashboard/finance/payments/new?studentId=${student.id}`)
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {student.last_name} {student.first_name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{student.iun ?? '—'}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoadingContext && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement du dossier financier…
          </CardContent>
        </Card>
      )}

      {context && !isLoadingContext && (
        <>
          <StudentParentCard context={context} onChangeStudent={() => {
            setContext(null)
            router.push('/dashboard/finance/payments/new')
          }} />

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-slate-500" />
                Frais de scolarité officiels
                <Badge variant="secondary" className="ml-auto text-xs font-normal">
                  Lecture seule — Proviseur
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!context.officialTuition.configured ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Aucun tarif officiel pour{' '}
                    <strong>{context.officialTuition.label || context.student.className}</strong>.
                    Le proviseur doit configurer les tarifs dans Finance → Tarifs officiels.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{context.officialTuition.label}</p>
                    <p className="text-xs text-slate-500">
                      {context.student.className} · Année {context.schoolYear?.name}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(context.officialTuition.amount)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-primary" />
                Frais supplémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {context.extraFeeTemplates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {context.extraFeeTemplates.map(t => (
                    <Button
                      key={t.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addExtraFromTemplate(t.id)}
                    >
                      + {t.name}
                      {t.suggestedAmount != null && (
                        <span className="ml-1 text-muted-foreground">
                          ({formatCurrency(t.suggestedAmount)})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {extraFees.map(fee => (
                  <div key={fee.id} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                    <div className="min-w-[140px] flex-1 space-y-1">
                      <Label className="text-xs">Libellé</Label>
                      <Input
                        value={fee.label}
                        onChange={e => updateExtra(fee.id, { label: e.target.value })}
                        placeholder="Ex: APE, Bibliothèque…"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Montant (FCFA)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={fee.amount ? String(fee.amount) : ''}
                        onChange={e =>
                          updateExtra(fee.id, { amount: parseMoneyInput(e.target.value) })
                        }
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExtra(fee.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addCustomExtra}>
                  <Plus className="h-4 w-4" />
                  Ajouter une ligne
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSavingExtras || !context.schoolYear}
                  onClick={persistExtras}
                >
                  {isSavingExtras ? 'Enregistrement…' : 'Enregistrer les frais du dossier'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-b from-green-50/80 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-900">
                <Receipt className="h-4 w-4" />
                Relevé de compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border bg-white text-sm">
                <table className="w-full">
                  <tbody className="divide-y">
                    {context.officialTuition.configured && (
                      <tr>
                        <td className="px-4 py-2 text-slate-600">Scolarité officielle</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(tuitionAmount)}
                        </td>
                      </tr>
                    )}
                    {extraFees.filter(f => f.label && f.amount > 0).map(f => (
                      <tr key={f.id}>
                        <td className="px-4 py-2 text-slate-600">{f.label}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(f.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t bg-slate-50 font-semibold">
                    <tr>
                      <td className="px-4 py-2">Total général</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(totalDue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <SummaryBox label="Total du dossier" value={formatCurrency(totalDue)} />
                <SummaryBox label="Montant payé" value={formatCurrency(payingToday)} tone="blue" />
                <SummaryBox label="Reste à payer" value={formatCurrency(remainingAfterToday)} tone="green" />
              </div>

              {totalPaidBefore > 0 && (
                <p className="text-center text-xs text-slate-500">
                  Déjà encaissé avant aujourd&apos;hui : {formatCurrency(totalPaidBefore)}
                </p>
              )}

              {context.paymentHistory.length > 0 && (
                <div className="rounded-lg border bg-white p-3 text-sm">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Paiements antérieurs
                  </p>
                  {context.paymentHistory.map(p => (
                    <div key={p.id} className="flex justify-between text-slate-600">
                      <span>
                        {p.reference ?? '—'} · {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Encaissement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Montant payé aujourd&apos;hui (FCFA)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountToCollect}
                  onChange={e => setAmountToCollect(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={String(maxCollectable)}
                />
                <p className="text-xs text-muted-foreground">
                  Ce montant met à jour « Montant payé » et « Reste à payer » en direct.
                  {maxCollectable < totalDue && totalPaidBefore > 0 && (
                    <> Reste maximum encaissable : {formatCurrency(maxCollectable)}.</>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    className={`rounded-lg border p-3 text-sm font-medium ${
                      paymentMethod === m.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-primary/5'
                    }`}
                    onClick={() => setPaymentMethod(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Réf. chèque, Mobile Money…" />
              </div>

              <Button
                className="w-full"
                disabled={
                  !context.officialTuition.configured ||
                  payingToday <= 0 ||
                  payingToday > maxCollectable ||
                  isSaving
                }
                onClick={handleSubmit}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valider et générer le reçu
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StudentParentCard({
  context,
  onChangeStudent,
}: {
  context: EncashmentContext
  onChangeStudent: () => void
}) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" />
          Dossier élève
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <GraduationCap className="h-3.5 w-3.5" />
            Élève
          </div>
          <p className="font-semibold">
            {context.student.lastName} {context.student.firstName}
          </p>
          <p className="font-mono text-sm text-slate-600">IUN {context.student.iun}</p>
          <p className="text-sm text-slate-600">{context.student.className ?? '—'}</p>
        </div>
        <div className="rounded-lg border bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Parent
          </div>
          {context.parent.firstName || context.parent.lastName ? (
            <>
              <p className="font-semibold">
                {context.parent.lastName} {context.parent.firstName}
              </p>
              {context.parent.phone && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <Phone className="h-3.5 w-3.5" />
                  {context.parent.phone}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Non renseigné</p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="sm:col-span-2" onClick={onChangeStudent}>
          Changer d&apos;élève
        </Button>
      </CardContent>
    </Card>
  )
}

function SummaryBox({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'blue' | 'green'
}) {
  const colors =
    tone === 'blue'
      ? 'text-blue-700'
      : tone === 'green'
        ? 'text-green-800 border-green-300 bg-green-50'
        : 'text-slate-900'
  return (
    <div className={`rounded-lg border bg-white p-3 ${tone === 'green' ? 'border-green-300 bg-green-50' : ''}`}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${colors}`}>{value}</p>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  bold,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono font-semibold' : bold ? 'font-bold' : 'font-medium'}>
        {value}
      </span>
    </div>
  )
}
