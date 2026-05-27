import Image from 'next/image'
import { Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

type SchoolBrandHeaderProps = {
  schoolName: string
  logoUrl?: string | null
  subtitle?: string
  className?: string
  logoClassName?: string
}

export function SchoolBrandHeader({
  schoolName,
  logoUrl,
  subtitle = 'Reçu officiel EduNation',
  className,
  logoClassName,
}: SchoolBrandHeaderProps) {
  return (
    <div className={cn('text-center', className)}>
      {logoUrl ? (
        <div
          className={cn(
            'relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-xl border bg-white shadow-sm',
            logoClassName,
          )}
        >
          <Image
            src={logoUrl}
            alt={`Logo ${schoolName}`}
            fill
            className="object-contain p-1.5"
            unoptimized
          />
        </div>
      ) : (
        <Receipt className="mx-auto mb-3 h-10 w-10 text-primary" />
      )}
      <p className="text-base font-semibold text-foreground">{schoolName}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
