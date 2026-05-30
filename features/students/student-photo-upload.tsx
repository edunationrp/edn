'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/feedback/toast'
import { uploadStudentPhoto } from '@/lib/students/photo-upload'
import { updateStudentPhotoUrl } from '@/lib/actions/student-photo'

type Props = {
  schoolId: string
  studentId: string
  photoUrl: string | null
  studentName: string
  canEdit?: boolean
}

export function StudentPhotoUpload({
  schoolId,
  studentId,
  photoUrl,
  studentName,
  canEdit = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentUrl, setCurrentUrl] = useState(photoUrl)
  const [pending, startTransition] = useTransition()

  function handleSelect(file: File | null) {
    if (!file || !canEdit) return

    startTransition(async () => {
      const uploaded = await uploadStudentPhoto(schoolId, studentId, file)
      if ('error' in uploaded) {
        notify.error(uploaded.error)
        return
      }

      const result = await updateStudentPhotoUrl(studentId, uploaded.publicUrl)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }

      setCurrentUrl(uploaded.publicUrl)
      notify.success('Photo d\'identité enregistrée.')
    })
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative h-28 w-24 overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-50">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt={`Photo de ${studentName}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
            <User className="h-8 w-8" />
            <span className="mt-1 text-[10px]">Pas de photo</span>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-medium text-slate-900">Photo d&apos;identité</p>
          <p className="text-xs text-muted-foreground">
            Requise pour les bulletins scolaires. JPG ou PNG, max 5 Mo.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={event => handleSelect(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-1.5 h-4 w-4" />
            )}
            {currentUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </Button>
        </div>
      )}
    </div>
  )
}
