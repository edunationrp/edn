'use client'

import {
  buildEcosystemPath,
  ECOSYSTEM_ACCENT_BAR,
  ECOSYSTEM_NODES,
  ECOSYSTEM_PATH_POINTS,
  type EcosystemNode,
} from '@/lib/marketing/ecosystem-diagram'
import { ScrollItem, ScrollReveal, ScrollStagger } from '@/components/motion/scroll-effects'
import { cn } from '@/lib/utils'

function DiagramNode({
  node,
  xPercent,
  yPercent,
}: {
  node: EcosystemNode
  xPercent: number
  yPercent: number
}) {
  const Icon = node.icon
  const labelAbove = node.labelPosition === 'top'

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
    >
      <div
        className={cn(
          'flex w-[min(11rem,28vw)] flex-col items-center',
          labelAbove ? 'flex-col-reverse' : 'flex-col'
        )}
      >
        <div className="relative flex flex-col items-center">
          {!labelAbove && (
            <span
              className="mb-2 block h-8 w-px border-l border-dashed opacity-50"
              style={{ borderColor: node.color }}
            />
          )}

          <div
            className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg sm:h-20 sm:w-20"
            style={{ boxShadow: `0 8px 28px ${node.color}33` }}
          >
            <div
              className="absolute inset-0 rounded-full border-[3px] sm:border-4"
              style={{ borderColor: node.ring }}
            />
            <div
              className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full sm:h-14 sm:w-14"
              style={{ backgroundColor: `${node.color}18`, color: node.color }}
            >
              <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
            </div>
          </div>

          {labelAbove && (
            <span
              className="mt-2 block h-8 w-px border-l border-dashed opacity-50"
              style={{ borderColor: node.color }}
            />
          )}
        </div>

        <div className={cn('text-center', labelAbove ? 'mb-0' : 'mt-0')}>
          <h3 className="text-sm font-black sm:text-base" style={{ color: node.color }}>
            {node.title}
          </h3>
          <p className="mt-1 max-w-[9.5rem] text-[11px] leading-snug text-gray-600 sm:text-xs sm:leading-relaxed">
            {node.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function MobileNode({ node }: { node: EcosystemNode }) {
  const Icon = node.icon

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
          style={{ boxShadow: `0 4px 16px ${node.color}30` }}
        >
          <div
            className="absolute inset-0 rounded-full border-[3px]"
            style={{ borderColor: node.ring }}
          />
          <Icon className="h-6 w-6" style={{ color: node.color }} strokeWidth={1.75} />
        </div>
        <div className="mt-2 h-full w-px flex-1 bg-gradient-to-b from-gray-200 to-transparent last:hidden" />
      </div>
      <div className="pb-8 pt-1">
        <h3 className="text-base font-black" style={{ color: node.color }}>
          {node.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{node.description}</p>
      </div>
    </div>
  )
}

export function EcosystemDiagram() {
  const pathD = buildEcosystemPath()
  const xPercents = ECOSYSTEM_PATH_POINTS.map(p => (p.x / 1000) * 100)
  const yPercents = ECOSYSTEM_PATH_POINTS.map(p => (p.y / 380) * 100)

  return (
    <div className="mx-auto max-w-6xl">
      <ScrollReveal className="mb-8 text-center">
        <p className="text-lg font-black text-[#1B3A6B] sm:text-xl">EduNation</p>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Plateforme de Gestion Éducative Connectée
        </p>
        <div className="mx-auto mt-5 flex h-1 max-w-lg overflow-hidden rounded-full">
          {ECOSYSTEM_ACCENT_BAR.map(color => (
            <span key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      </ScrollReveal>

      {/* Desktop — parcours ondulé */}
      <ScrollReveal className="relative hidden lg:block">
        <div className="relative mx-auto h-[23rem] max-w-5xl xl:h-[26rem]">
          <svg
            viewBox="0 0 1000 380"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="eco-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.35" />
                <stop offset="25%" stopColor="#F97316" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#1B3A6B" stopOpacity="0.35" />
                <stop offset="75%" stopColor="#9333EA" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#eco-path-gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pathD}
              fill="none"
              stroke="#BFDBFE"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 8"
              opacity="0.9"
            />
          </svg>

          {ECOSYSTEM_NODES.map((node, index) => (
            <DiagramNode
              key={node.id}
              node={node}
              xPercent={xPercents[index]}
              yPercent={yPercents[index]}
            />
          ))}
        </div>
      </ScrollReveal>

      {/* Mobile / tablette — timeline verticale */}
      <ScrollStagger className="mx-auto max-w-md lg:hidden">
        {ECOSYSTEM_NODES.map(node => (
          <ScrollItem key={node.id}>
            <MobileNode node={node} />
          </ScrollItem>
        ))}
      </ScrollStagger>
    </div>
  )
}
