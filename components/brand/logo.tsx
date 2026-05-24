import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Logo officiel EduNation */
export const LOGO_SRC = '/edunation.jpeg'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon' | 'text'
  href?: string
}

export function LogoMark({
  size = 36,
  className,
  priority = false,
}: {
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="EduNation"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      style={{ width: size, height: size }}
      priority={priority}
    />
  )
}

/** @deprecated Utiliser LogoMark — conservé pour compatibilité */
export function LogoSVG({ width = 32, height = 32 }: { width?: number; height?: number }) {
  return <LogoMark size={Math.max(width, height)} />
}

export function LogoPNG({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 28, md: 36, lg: 48 }
  return <LogoMark size={sizes[size]} className={className} priority />
}

export function BrandLockupDark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="shrink-0 rounded-xl bg-white/15 p-1">
        <LogoMark size={32} />
      </div>
      <div>
        <div className="text-[17px] font-extrabold leading-tight tracking-tight text-white">
          Edu<span className="text-[#7AB832]">Nation</span>
        </div>
        <div className="text-[9px] font-semibold uppercase leading-tight tracking-[0.15em] text-white/50">
          ÉDUQUER · GÉRER · CONNECTER
        </div>
      </div>
    </div>
  )
}

export function BrandLockupLight({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = { sm: 32, md: 40, lg: 48 }
  return (
    <Link
      href="/"
      className={cn('flex items-center transition-opacity hover:opacity-90', className)}
    >
      <LogoMark size={sizes[size]} priority />
    </Link>
  )
}

export type { LogoProps }
