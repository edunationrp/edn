'use client'

import Link from 'next/link'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Rocket, Settings, UserPlus } from 'lucide-react'
import { HOW_IT_WORKS_STEPS } from '@/lib/marketing/how-it-works'
import { AccentUnderline, SectionBackdrop, SectionHeader } from '@/components/marketing/section-header'
import { ScrollItem, ScrollReveal, ScrollSection, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

type Anchor = { x: number; y: number; r: number }

type ConnectorSegment = {
  d: string
  dots: Array<{ x: number; y: number }>
}

function pointOnCircle(from: Anchor, to: Anchor): { x: number; y: number } {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  return {
    x: from.x + Math.cos(angle) * from.r,
    y: from.y + Math.sin(angle) * from.r,
  }
}

function buildDirectPath(from: Anchor, to: Anchor): ConnectorSegment {
  const start = pointOnCircle(from, to)
  const end = pointOnCircle(to, from)
  return {
    d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    dots: [start, end],
  }
}

function buildElbowPath(from: Anchor, to: Anchor): ConnectorSegment {
  const start = { x: from.x, y: from.y + from.r }
  const end = { x: to.x, y: to.y - to.r }
  const bendY = start.y + (end.y - start.y) / 2
  const corner1 = { x: start.x, y: bendY }
  const corner2 = { x: end.x, y: bendY }

  return {
    d: `M ${start.x} ${start.y} L ${corner1.x} ${corner1.y} L ${corner2.x} ${corner2.y} L ${end.x} ${end.y}`,
    dots: [start, corner1, corner2, end],
  }
}

function StepConnectors({
  anchors,
  size,
}: {
  anchors: Anchor[] | null
  size: { width: number; height: number } | null
}) {
  if (!anchors || anchors.length !== 4 || !size) return null

  const isDesktop = size.width >= 640
  const segments: ConnectorSegment[] = isDesktop
    ? [
        buildDirectPath(anchors[0], anchors[1]),
        buildElbowPath(anchors[1], anchors[2]),
        buildDirectPath(anchors[2], anchors[3]),
      ]
    : [
        buildDirectPath(anchors[0], anchors[1]),
        buildDirectPath(anchors[1], anchors[2]),
        buildDirectPath(anchors[2], anchors[3]),
      ]

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={size.width}
      height={size.height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="how-it-works-rope" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a4d2e" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#7AB832" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1B3A6B" stopOpacity="0.55" />
        </linearGradient>
        <marker
          id="how-it-works-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#7AB832" />
        </marker>
      </defs>

      {segments.map((segment, index) => (
        <g key={index}>
          <path
            d={segment.d}
            fill="none"
            stroke="url(#how-it-works-rope)"
            strokeWidth={2.5}
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd="url(#how-it-works-arrow)"
          />
          {segment.dots.map((dot, dotIndex) => (
            <circle
              key={dotIndex}
              cx={dot.x}
              cy={dot.y}
              r={3.5}
              fill="white"
              stroke="#7AB832"
              strokeWidth={2}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function HowItWorksStepsGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([])
  const [anchors, setAnchors] = useState<Anchor[] | null>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const nextAnchors = badgeRefs.current.map(badge => {
      if (!badge) return null
      const rect = badge.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
        r: rect.width / 2,
      }
    })

    if (nextAnchors.some(anchor => anchor === null)) return

    setSize({ width: containerRect.width, height: containerRect.height })
    setAnchors(nextAnchors as Anchor[])
  }, [])

  useLayoutEffect(() => {
    measure()

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => measure())
    observer.observe(container)

    window.addEventListener('resize', measure)

    const timeouts = [100, 350, 700, 1200].map(delay =>
      window.setTimeout(measure, delay)
    )

    const onLoad = () => measure()
    window.addEventListener('load', onLoad)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', onLoad)
      timeouts.forEach(window.clearTimeout)
    }
  }, [measure])

  return (
    <div ref={containerRef} className="relative mx-auto max-w-5xl">
      <StepConnectors anchors={anchors} size={size} />

      <ScrollStagger className="relative z-10 grid gap-5 sm:grid-cols-2">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <ScrollItem key={step.id}>
            <article
              className={cn(
                'group relative z-10 flex h-full gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md',
                step.ring,
                'hover:ring-2'
              )}
            >
              <div
                ref={element => {
                  badgeRefs.current[index] = element
                }}
                className={cn(
                  'relative z-30 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-md ring-4 ring-white',
                  step.accent
                )}
              >
                {step.number}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    step.badge
                  )}
                >
                  Étape {step.number}
                </span>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.description}</p>
              </div>
            </article>
          </ScrollItem>
        ))}
      </ScrollStagger>
    </div>
  )
}

export function HowItWorksSection() {
  return (
    <ScrollSection
      id="comment-ca-marche"
      className="relative overflow-hidden bg-gradient-to-b from-[#f0f9e8]/40 via-white to-[#f8fafc] py-20 sm:py-24"
    >
      <SectionBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            badge="Comment ça marche"
            badgeIcon={<Settings className="h-3.5 w-3.5" />}
            title={
              <>
                Simple, rapide et <AccentUnderline>pensé pour les écoles</AccentUnderline>
              </>
            }
            description="4 étapes simples pour digitaliser entièrement la gestion de votre établissement scolaire."
          />
        </ScrollReveal>

        <HowItWorksStepsGrid />

        <ScrollReveal delay={0.1} className="mt-14">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#7AB832]/20 bg-[#f0f9e8]/70 p-6 sm:flex-row sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#7AB832]/20">
                <Rocket className="h-7 w-7 text-[#1a4d2e]" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  Prêt à transformer la gestion de votre école ?
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Rejoignez les établissements qui modernisent déjà leur scolarité avec EduNation.
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/register/school"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a4d2e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a4d2e]/20 transition hover:bg-[#2d6a4f]"
              >
                Demander une démo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register/school"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a4d2e]/25 bg-white px-6 py-3 text-sm font-bold text-[#1a4d2e] transition hover:bg-[#f0f9e8]"
              >
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </ScrollSection>
  )
}
