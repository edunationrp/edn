'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  BANNER_INTERVAL_MS,
  BANNER_TRANSITION_EASE,
  BANNER_TRANSITION_MS,
  SITE_IMAGES,
  type SiteImage,
} from '@/lib/marketing/site-images'
import { cn } from '@/lib/utils'

type RotatingBannerBackgroundProps = {
  images?: readonly SiteImage[]
  intervalMs?: number
  initialIndex?: number
  className?: string
  transitionMs?: number
}

export function RotatingBannerBackground({
  images = SITE_IMAGES,
  intervalMs = BANNER_INTERVAL_MS,
  initialIndex = 0,
  className,
  transitionMs = BANNER_TRANSITION_MS,
}: RotatingBannerBackgroundProps) {
  const reduceMotion = useReducedMotion()
  const count = images.length
  const safeInitial = count > 0 ? initialIndex % count : 0
  const effectiveTransition = reduceMotion ? 0 : transitionMs
  const effectiveInterval = reduceMotion ? intervalMs * 2 : intervalMs

  const currentRef = useRef(safeInitial)
  const frontSlotRef = useRef<0 | 1>(0)
  const transitioningRef = useRef(false)

  const [slots, setSlots] = useState<[number, number]>([
    safeInitial,
    count > 1 ? (safeInitial + 1) % count : safeInitial,
  ])
  const [frontSlot, setFrontSlot] = useState<0 | 1>(0)
  const [incomingSlot, setIncomingSlot] = useState<0 | 1 | null>(null)
  const [incomingOpacity, setIncomingOpacity] = useState(0)

  useEffect(() => {
    images.forEach(img => {
      const imgEl = new window.Image()
      imgEl.src = img.src
    })
  }, [images])

  useEffect(() => {
    if (count <= 1) return

    const timer = window.setInterval(() => {
      if (transitioningRef.current) return
      transitioningRef.current = true

      const nextIndex = (currentRef.current + 1) % count
      const backSlot = (frontSlotRef.current === 0 ? 1 : 0) as 0 | 1

      setSlots(prev => {
        const next: [number, number] = [prev[0], prev[1]]
        next[backSlot] = nextIndex
        return next
      })
      setIncomingSlot(backSlot)
      setIncomingOpacity(0)

      if (effectiveTransition === 0) {
        currentRef.current = nextIndex
        frontSlotRef.current = backSlot
        setFrontSlot(backSlot)
        setIncomingSlot(null)
        setIncomingOpacity(0)
        transitioningRef.current = false
        return
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIncomingOpacity(1))
      })

      window.setTimeout(() => {
        currentRef.current = nextIndex
        frontSlotRef.current = backSlot
        setFrontSlot(backSlot)
        setIncomingSlot(null)
        setIncomingOpacity(0)
        transitioningRef.current = false
      }, effectiveTransition)
    }, effectiveInterval)

    return () => window.clearInterval(timer)
  }, [count, effectiveInterval, effectiveTransition])

  if (count === 0) return null

  const visibleSrc = images[slots[frontSlot]].src
  const fadeTransition = effectiveTransition
    ? `opacity ${effectiveTransition}ms ${BANNER_TRANSITION_EASE}`
    : 'none'
  const zoomDuration = Math.max(effectiveInterval, effectiveTransition + 1200)

  function renderBackgroundLayer(slot: 0 | 1) {
    const src = images[slots[slot]].src
    const isVisible = frontSlot === slot && incomingSlot === null
    const staysUnderFade = frontSlot === slot && incomingSlot !== null
    const isFadingIn = incomingSlot === slot

    let opacity = 0
    let zIndex = 0
    let transition = 'none'
    let innerTransform = 'scale(1.04)'
    let innerTransition = 'none'

    if (isVisible || staysUnderFade) {
      opacity = 1
      zIndex = 1
      innerTransform = 'scale(1.06)'
      if (!reduceMotion) {
        innerTransition = `transform ${zoomDuration}ms ${BANNER_TRANSITION_EASE}`
      }
    } else if (isFadingIn) {
      opacity = incomingOpacity
      zIndex = 2
      transition = fadeTransition
      const scale = 1.04 - incomingOpacity * 0.04
      innerTransform = `scale(${scale.toFixed(3)})`
      innerTransition = effectiveTransition
        ? `transform ${effectiveTransition}ms ${BANNER_TRANSITION_EASE}`
        : 'none'
    }

    return (
      <div
        key={slot}
        className="absolute inset-0 overflow-hidden"
        style={{ opacity, zIndex, transition }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            transform: reduceMotion ? 'scale(1)' : innerTransform,
            transition: innerTransition,
            willChange: isFadingIn || isVisible ? 'transform, opacity' : undefined,
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      aria-hidden="true"
      style={{
        backgroundImage: `url(${visibleSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {count > 1 && (
        <>
          {renderBackgroundLayer(0)}
          {renderBackgroundLayer(1)}
        </>
      )}
    </div>
  )
}
