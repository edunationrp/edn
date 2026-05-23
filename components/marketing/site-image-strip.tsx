'use client'

import Image from 'next/image'
import { SITE_IMAGES } from '@/lib/marketing/site-images'
import { ScrollReveal } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

type SiteImageStripProps = {
  className?: string
  variant?: 'default' | 'compact'
}

export function SiteImageStrip({ className, variant = 'default' }: SiteImageStripProps) {
  const compact = variant === 'compact'

  return (
    <ScrollReveal className={cn('w-full', className)}>
      <div
        className={cn(
          'grid gap-3',
          compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
        )}
      >
        {SITE_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-white/20 shadow-md ring-1 ring-black/5',
              compact ? 'aspect-[4/3]' : 'aspect-[4/5] sm:aspect-square',
              index === 0 && !compact && 'sm:row-span-2 sm:aspect-auto sm:min-h-[280px]'
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={compact ? '(max-width: 640px) 33vw, 20vw' : '(max-width: 640px) 50vw, 20vw'}
              className="object-cover transition duration-500 group-hover:scale-105"
              priority={index < 2}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
            {!compact && (
              <p className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white drop-shadow-sm">
                {image.alt}
              </p>
            )}
          </div>
        ))}
      </div>
    </ScrollReveal>
  )
}
