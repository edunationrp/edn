'use client'

import { clampWatermarkOpacity } from '@/lib/schools/branding'
import { cn } from '@/lib/utils'

type WatermarkBackgroundProps = {
  logoUrl?: string | null
  opacity?: number | null
  /** `full` = zone principale du dashboard ; `preview` = mini aperçu paramètres */
  variant?: 'full' | 'preview'
  className?: string
}

/**
 * Filigrane global — occupe la majeure partie du conteneur, centré, non interactif.
 */
export function WatermarkBackground({
  logoUrl,
  opacity,
  variant = 'full',
  className,
}: WatermarkBackgroundProps) {
  if (!logoUrl) return null

  const safeOpacity = clampWatermarkOpacity(opacity)

  const sizeStyle =
    variant === 'preview'
      ? { width: '92%', height: '92%', maxWidth: '96%', maxHeight: '96%' }
      : {
          width: 'min(92vw, 88vh)',
          height: 'min(92vw, 88vh)',
          maxWidth: '96%',
          maxHeight: '92%',
        }

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        'select-none',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        draggable={false}
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain',
          'dark:brightness-110',
        )}
        style={{
          opacity: safeOpacity,
          ...sizeStyle,
        }}
      />
    </div>
  )
}
