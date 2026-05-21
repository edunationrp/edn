import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon' | 'text'
  href?: string
}

// Logo SVG fidèle au design du fichier HTML (mortier + personnages)
export function LogoSVG({ width = 32, height = 32 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={width} height={height} aria-hidden="true">
      {/* Mortier (chapeau) */}
      <polygon points="20,5 36,12 20,19 4,12" fill="#1B3A6B"/>
      <polygon points="4,12 4,17 20,24 20,19" fill="#152F58"/>
      <polygon points="36,12 36,17 20,24 20,19" fill="#1B3A6B"/>
      {/* Cordon tassel */}
      <path d="M34 13.5v5a1 1 0 0 1-2 0v-4l-2.6 1.1v-2.1z" fill="#7AB832"/>
      {/* Personnages */}
      <circle cx="14" cy="22" r="2.2" fill="#D8E4F0"/>
      <circle cx="20" cy="20.5" r="2.4" fill="#7AB832"/>
      <circle cx="26" cy="22" r="2.2" fill="#D8E4F0"/>
      {/* Socle livre */}
      <path d="M10 26h20l-2 4H12z" fill="#7AB832"/>
      <path d="M9 30h22l-2 3.5H11z" fill="#1B3A6B"/>
    </svg>
  )
}

// Logo PNG (fichier réel)
export function LogoPNG({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 28, md: 36, lg: 48 }
  const s = sizes[size]
  return (
    <Image
      src="/logo.png"
      alt="EduNation"
      width={s * 3}
      height={s}
      className={cn('object-contain', className)}
      style={{ height: s, width: 'auto' }}
      priority
    />
  )
}

// Brand lockup complet (logo + texte) — version sidebar fond sombre
export function BrandLockupDark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-shrink-0 bg-white/15 rounded-xl p-1.5">
        <LogoSVG width={26} height={26} />
      </div>
      <div>
        <div className="text-white font-extrabold text-[17px] leading-tight tracking-tight">
          Edu<span className="text-[#7AB832]">Nation</span>
        </div>
        <div className="text-white/50 text-[9px] font-semibold tracking-[0.15em] uppercase leading-tight">
          ÉDUQUER · GÉRER · CONNECTER
        </div>
      </div>
    </div>
  )
}

// Brand lockup version claire (pour topbar, login, etc.)
export function BrandLockupLight({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5 hover:opacity-90 transition-opacity', className)}>
      <LogoPNG size={size} />
    </Link>
  )
}
