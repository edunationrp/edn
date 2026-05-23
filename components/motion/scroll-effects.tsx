'use client'

import { type ReactNode, useEffect, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import {
  heroContainerVariants,
  heroItemVariants,
  scrollFadeVariants,
  scrollLeftVariants,
  scrollRevealVariants,
  scrollRightVariants,
  scrollScaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/lib/motion/config'
import { cn } from '@/lib/utils'

/** Avoid SSR/client mismatch: `useReducedMotion()` reads media queries only on the client. */
function useHydrationSafeReducedMotion() {
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted && reduceMotion
}

type Direction = 'up' | 'fade' | 'scale' | 'left' | 'right'

const directionVariants: Record<Direction, Variants> = {
  up: scrollRevealVariants,
  fade: scrollFadeVariants,
  scale: scrollScaleVariants,
  left: scrollLeftVariants,
  right: scrollRightVariants,
}

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  direction?: Direction
  delay?: number
  amount?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  amount = 0.2,
  once = true,
}: ScrollRevealProps) {
  const reduceMotion = useHydrationSafeReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: '0px 0px -60px 0px' }}
      variants={directionVariants[direction]}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

type ScrollStaggerProps = {
  children: ReactNode
  className?: string
  once?: boolean
  amount?: number
}

export function ScrollStagger({
  children,
  className,
  once = true,
  amount = 0.15,
}: ScrollStaggerProps) {
  const reduceMotion = useHydrationSafeReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: '0px 0px -40px 0px' }}
      variants={staggerContainerVariants}
    >
      {children}
    </motion.div>
  )
}

type ScrollItemProps = {
  children: ReactNode
  className?: string
}

export function ScrollItem({ children, className }: ScrollItemProps) {
  const reduceMotion = useHydrationSafeReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  )
}

type LandingHeroMotionProps = {
  children: ReactNode
  className?: string
}

export function LandingHeroMotion({ children, className }: LandingHeroMotionProps) {
  const reduceMotion = useHydrationSafeReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={heroContainerVariants}
    >
      {children}
    </motion.div>
  )
}

export function HeroMotionItem({ children, className }: ScrollItemProps) {
  const reduceMotion = useHydrationSafeReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={heroItemVariants}>
      {children}
    </motion.div>
  )
}

export function ScrollProgressBar() {
  const reduceMotion = useHydrationSafeReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  })

  const background = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ['#7AB832', '#1a4d2e', '#1B3A6B']
  )

  if (reduceMotion) return null

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{ scaleX, background }}
      aria-hidden="true"
    />
  )
}

export function ParallaxFloat({
  children,
  className,
  offset = 24,
}: {
  children: ReactNode
  className?: string
  offset?: number
}) {
  const reduceMotion = useHydrationSafeReducedMotion()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, offset])

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  )
}

export function SmoothScrollRoot({ children }: { children: ReactNode }) {
  const reduceMotion = useHydrationSafeReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || reduceMotion) return
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [mounted, reduceMotion])

  return <>{children}</>
}

export function ScrollSection({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      {children}
    </section>
  )
}
