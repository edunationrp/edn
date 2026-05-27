'use client'

import { clampWatermarkOpacity } from '@/lib/schools/branding'
import { WatermarkBackground } from '@/components/schools/watermark-background'
import { cn } from '@/lib/utils'

type WatermarkPreviewProps = {
  logoUrl: string | null
  opacity: number
  schoolName?: string
  className?: string
}

/** Aperçu du rendu filigrane avant / après sauvegarde. */
export function WatermarkPreview({ logoUrl, opacity, schoolName, className }: WatermarkPreviewProps) {
  if (!logoUrl) return null

  const safeOpacity = clampWatermarkOpacity(opacity)

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-medium text-slate-600">Aperçu du filigrane</p>
      <div
        className={cn(
          'relative h-52 overflow-hidden rounded-xl border border-slate-200',
          'bg-[#F0F4F8] dark:bg-slate-900',
        )}
      >
        <WatermarkBackground logoUrl={logoUrl} opacity={safeOpacity} variant="preview" />
        <div className="relative z-[1] flex h-full flex-col justify-between p-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Tableau de bord</p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {schoolName ?? 'Mon établissement'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-lg bg-white/90 shadow-sm dark:bg-slate-800/90" />
            <div className="h-8 rounded-lg bg-white/90 shadow-sm dark:bg-slate-800/90" />
            <div className="col-span-2 h-10 rounded-lg bg-white/90 shadow-sm dark:bg-slate-800/90" />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Opacité {Math.round(safeOpacity * 100)} % — le logo reste lisible sans gêner le contenu.
      </p>
    </div>
  )
}
