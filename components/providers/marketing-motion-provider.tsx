'use client'

import { ScrollProgressBar, SmoothScrollRoot } from '@/components/motion/scroll-effects'

export function MarketingMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollRoot>
      <ScrollProgressBar />
      {children}
    </SmoothScrollRoot>
  )
}
