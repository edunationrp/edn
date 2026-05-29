'use client'

import Link from 'next/link'
import { BrandLockupLight } from '@/components/brand/logo'
import { LogIn, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  children: React.ReactNode
  isAuthenticated?: boolean
}

export function PublicTutorShell({ children, isAuthenticated }: Props) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F0F4F8]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <BrandLockupLight size="sm" className="shrink-0" />
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-[#1B3A6B]">
                <Link href="/eleve">
                  <User className="h-3.5 w-3.5" />
                  Mon espace
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden text-[#1B3A6B] sm:inline-flex">
                  <Link href="/login/eleve">Connexion élève</Link>
                </Button>
                <Button asChild size="sm" className="gap-1.5 bg-[#7AB832] hover:bg-[#6aa32b]">
                  <Link href="/login/eleve">
                    <LogIn className="h-3.5 w-3.5" />
                    Se connecter
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <footer className="border-t border-slate-200/80 bg-white py-3 text-center text-[11px] text-muted-foreground">
        EduBot · Assistant scolaire EduNation ·{' '}
        <Link href="/" className="text-[#1B3A6B] hover:underline">
          Retour au site
        </Link>
      </footer>
    </div>
  )
}
