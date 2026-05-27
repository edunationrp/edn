export const WATERMARK_OPACITY_MIN = 0.06
export const WATERMARK_OPACITY_MAX = 0.18
export const WATERMARK_OPACITY_DEFAULT = 0.11

export function clampWatermarkOpacity(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return WATERMARK_OPACITY_DEFAULT
  return Math.min(WATERMARK_OPACITY_MAX, Math.max(WATERMARK_OPACITY_MIN, value))
}

export function watermarkOpacityToPercent(opacity: number) {
  return Math.round(clampWatermarkOpacity(opacity) * 100)
}

export function percentToWatermarkOpacity(percent: number) {
  return clampWatermarkOpacity(percent / 100)
}
