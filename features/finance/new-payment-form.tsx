'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordPaymentWithEmail } from '@/lib/actions/payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, User, CreditCard, CheckCircle, Loader2, AlertCircle, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import { TOAST_SUCCESS } from '@/lib/feedback/messages'

interface NewPaymentFormProps {
  schoolId: string
  schoolName: string
  cassierId: string
  feeStructures: Array<{ id: string; name: string; amount: number; is_mandatory: boolean }>
  currentYear: { id: string; name: string } | null
}

type Student = {
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

export function NewPaymentForm({ schoolId, schoolName, cassierId, feeStructures, currentYear }: NewPaymentFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [selectedFee, setSelectedFee] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [receipt, setReceipt] = useState<{ reference: string; amount: number; studentName: string } | null>(null)

  async function searchStudents() {
    if (searchQuery.trim().length < 2) return
    setIsSearching(true)

    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, iun, status')
      .eq('school_id', schoolId)
      .or(`last_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,iun.ilike.%${searchQuery}%`)
      .limit(10)

    setSearchResults((data as Student[] | null) ?? [])
    setIsSearching(false)
  }

  const selectedFeeData = feeStructures.find(f => f.id === selectedFee)
  const amount = selectedFeeData ? selectedFeeData.amount : (parseFloat(customAmount) || 0)

  function generateReference(): string {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `EDN-${year}${month}-${random}`
  }

  async function handleSubmit() {
    if (!selectedStudent || amount <= 0) return
    setIsSaving(true)

    const reference = generateReference()

    const method =
      paymentMethod === 'check'
        ? 'other'
        : (paymentMethod as 'cash' | 'mobile_money' | 'bank_transfer' | 'other')

    const result = await recordPaymentWithEmail({
      schoolId,
      schoolName,
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
      amount,
      paymentMethod: method,
      reference,
      recordedBy: cassierId,
    })

    if (result.error) {
      notify.error(result.error, 'payment_save')
      setIsSaving(false)
      return
    }

    if (result.payment) {
      const ref = result.payment.reference ?? reference
      notify.success(TOAST_SUCCESS.paymentSaved(ref).title, {
        description: TOAST_SUCCESS.paymentSaved(ref).description,
      })
      setReceipt({
        reference: ref,
        amount: Number(result.payment.amount),
        studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
      })
    }
    setIsSaving(false)
  }

  if (receipt) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Receipt className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-800">Paiement enregistré !</h2>
            <p className="text-green-700 mt-1">{receipt.studentName}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-green-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Référence</span>
              <span className="font-mono font-bold">{receipt.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold text-lg">{formatCurrency(receipt.amount)}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => {
              setReceipt(null)
              setSelectedStudent(null)
              setSelectedFee('')
              setCustomAmount('')
            }}>
              Nouveau paiement
            </Button>
            <Button onClick={() => router.push('/dashboard/finance')}>
              Retour aux finances
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Recherche élève */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Rechercher l&apos;élève
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

          {searchResults.length > 0 && !selectedStudent && (
            <div className="space-y-2">
              {searchResults.map(student => (
                <button
                  key={student.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                  onClick={() => {
                    setSelectedStudent(student)
                    setSearchResults([])
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{student.last_name} {student.first_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{student.iun ?? '—'}</p>
                  </div>
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {student.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selectedStudent.last_name} {selectedStudent.first_name}</p>
                <p className="text-sm text-muted-foreground font-mono">{selectedStudent.iun ?? '—'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                Changer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Montant */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-yellow-600" />
            Détails du paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frais à régler</Label>
            <select
              value={selectedFee}
              onChange={e => {
                setSelectedFee(e.target.value)
                setCustomAmount('')
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sélectionner un type de frais…</option>
              {feeStructures.map(fee => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} — {formatCurrency(fee.amount)} {fee.is_mandatory ? '(Obligatoire)' : ''}
                </option>
              ))}
              <option value="">— Montant personnalisé —</option>
            </select>
          </div>

          {!selectedFee && (
            <div className="space-y-2">
              <Label>Montant personnalisé (FCFA)</Label>
              <Input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Ex: 25000"
                min="0"
              />
            </div>
          )}

          {amount > 0 && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
              <p className="text-sm text-muted-foreground">Montant à encaisser</p>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(amount)}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.value}
                  type="button"
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    paymentMethod === method.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:border-primary/40 hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Observations</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optionnel…"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedStudent || amount <= 0 || isSaving}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" />Valider le paiement</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
