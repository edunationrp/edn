import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthHomeBackButtonProps = {
  className?: string
}

export function AuthHomeBackButton({ className }: AuthHomeBackButtonProps) {
  return (
    <Link
      href="/"
      aria-label="Retour à l'accueil"
      className={cn(
        'group inline-flex items-center gap-1.5 self-start rounded-full',
        'border border-white/20 bg-white/10 px-2 py-1',
        'text-xs font-medium tracking-wide text-white/85',
        'shadow-lg shadow-black/10 backdrop-blur-md',
        'transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-out',
        'hover:border-white/35 hover:bg-white/18 hover:text-white hover:shadow-xl hover:shadow-black/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B3A6B]',
        'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full',
          'bg-white/15 ring-1 ring-inset ring-white/20',
          'transition-[background-color,transform] duration-200 ease-out',
          'group-hover:-translate-x-0.5 group-hover:bg-white/25'
        )}
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="pr-0.5">Accueil</span>
    </Link>
  )
}
