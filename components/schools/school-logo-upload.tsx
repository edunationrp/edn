'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { WatermarkPreview } from '@/components/schools/watermark-preview'
import {
  percentToWatermarkOpacity,
  WATERMARK_OPACITY_DEFAULT,
  watermarkOpacityToPercent,
} from '@/lib/schools/branding'
import { prepareSchoolLogoFile } from '@/lib/schools/logo-file'
import { cn } from '@/lib/utils'

type SchoolLogoUploadProps = {
  currentUrl?: string | null
  opacity?: number
  onOpacityChange?: (opacity: number) => void
  onSaveOpacity?: () => void
  opacitySavePending?: boolean
  schoolName?: string
  disabled?: boolean
  /** Callback immédiat sans confirmation (ex. onboarding). */
  onFileSelect?: (file: File | null) => void
  /** Upload avec aperçu et confirmation (paramètres). */
  onUpload?: (file: File) => Promise<{ error?: string; logoUrl?: string | null }>
  onUploadSuccess?: (logoUrl: string | null) => void
  onRemove?: () => void | Promise<{ error?: string } | void>
  compact?: boolean
  hint?: string
  showWatermarkPreview?: boolean
}

export function SchoolLogoUpload({
  currentUrl,
  opacity = WATERMARK_OPACITY_DEFAULT,
  onOpacityChange,
  onSaveOpacity,
  opacitySavePending,
  schoolName,
  disabled,
  onFileSelect,
  onUpload,
  onUploadSuccess,
  onRemove,
  compact,
  hint,
  showWatermarkPreview = !compact,
}: SchoolLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const deferredMode = Boolean(onUpload)
  const displayUrl = localPreview ?? currentUrl ?? null
  const previewLogoUrl = displayUrl && !imageError ? displayUrl : null
  const opacityPercent = watermarkOpacityToPercent(opacity)

  function clearLocalPreview() {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    setPendingFile(null)
    setImageError(false)
    setFileError(null)
  }

  async function handleFilePick(file: File | null) {
    clearLocalPreview()
    if (!file) {
      onFileSelect?.(null)
      return
    }

    setProcessing(true)
    const prepared = await prepareSchoolLogoFile(file)
    setProcessing(false)

    if ('error' in prepared) {
      setFileError(prepared.error)
      notifyPickError(prepared.error)
      return
    }

    const ready = prepared.file
    const objectUrl = URL.createObjectURL(ready)
    setLocalPreview(objectUrl)
    setPendingFile(deferredMode ? ready : null)

    if (!deferredMode) {
      onFileSelect?.(ready)
    }
  }

  function notifyPickError(message: string) {
    if (typeof window !== 'undefined') {
      import('@/lib/feedback/toast').then(({ notify }) => notify.error(message))
    }
  }

  async function handleConfirmUpload() {
    if (!pendingFile || !onUpload || disabled) return
    setUploading(true)
    const result = await onUpload(pendingFile)
    setUploading(false)
    if (result.error) {
      notifyPickError(result.error)
      return
    }
    clearLocalPreview()
    if (inputRef.current) inputRef.current.value = ''
    onUploadSuccess?.(result.logoUrl ?? null)
  }

  async function handleRemove() {
    if (onRemove) {
      const result = await onRemove()
      if (result && 'error' in result && result.error) {
        notifyPickError(result.error)
        return
      }
    }
    clearLocalPreview()
    if (inputRef.current) inputRef.current.value = ''
    onFileSelect?.(null)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Logo de l&apos;établissement</Label>
        <p className="text-xs text-muted-foreground">
          {hint ?? 'PNG, JPG, WebP ou SVG — max 5 Mo. Optionnel.'}
        </p>
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center',
          compact && 'p-3',
        )}
      >
        <div
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white',
            compact ? 'h-16 w-16' : 'h-20 w-20',
          )}
        >
          {displayUrl && !imageError ? (
            <Image
              src={displayUrl}
              alt="Logo établissement"
              fill
              className="object-contain p-1.5"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : imageError ? (
            <span className="px-1 text-center text-[10px] text-red-500">Image invalide</span>
          ) : (
            <ImagePlus className="h-7 w-7 text-slate-300" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            disabled={disabled || processing || uploading}
            onChange={e => void handleFilePick(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || processing || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {processing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Traitement…
              </>
            ) : displayUrl ? (
              'Changer le logo'
            ) : (
              'Téléverser un logo'
            )}
          </Button>

          {deferredMode && pendingFile && (
            <Button
              type="button"
              size="sm"
              disabled={disabled || uploading || imageError}
              onClick={() => void handleConfirmUpload()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                'Enregistrer le logo'
              )}
            </Button>
          )}

          {displayUrl && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={disabled || processing || uploading}
              onClick={() => void handleRemove()}
            >
              <Trash2 className="h-4 w-4" />
              Retirer
            </Button>
          )}
        </div>
      </div>

      {fileError && (
        <p className="text-xs text-destructive">{fileError}</p>
      )}

      {showWatermarkPreview && previewLogoUrl && (
        <WatermarkPreview
          logoUrl={previewLogoUrl}
          opacity={opacity}
          schoolName={schoolName}
        />
      )}

      {showWatermarkPreview && previewLogoUrl && onOpacityChange && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="watermark-opacity" className="text-sm">
              Opacité du filigrane
            </Label>
            <span className="text-xs font-medium text-muted-foreground">{opacityPercent} %</span>
          </div>
          <input
            id="watermark-opacity"
            type="range"
            min={6}
            max={18}
            step={1}
            value={opacityPercent}
            disabled={disabled || opacitySavePending}
            className="h-2 w-full cursor-pointer accent-[#1a4d2e]"
            onChange={e => onOpacityChange(percentToWatermarkOpacity(Number(e.target.value)))}
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Discret (6 %)</span>
            <span>Marqué (18 %)</span>
          </div>
          {onSaveOpacity && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || opacitySavePending}
              onClick={onSaveOpacity}
            >
              {opacitySavePending ? 'Enregistrement…' : 'Enregistrer l\'opacité'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function SchoolLogoUploadPending({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label ?? 'Envoi du logo…'}
    </div>
  )
}
