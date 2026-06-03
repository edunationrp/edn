'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  Clock,
  Euro,
  Eye,
  Folder,
  Globe,
  GraduationCap,
  Handshake,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrgChartBranchData, OrgChartBranchId, SchoolOrgChartData } from '@/lib/staff/org-chart'
import { cn, getInitials } from '@/lib/utils'
import { ROLE_LABELS } from '@/types/roles'
import { dashboard } from '@/lib/dashboard/ui-classes'

type StaffOrgChartProps = {
  data: SchoolOrgChartData
  canInvite?: boolean
  variant?: 'full' | 'preview'
  className?: string
}

type Point = { x: number; y: number }

const SVG_SIZE = 800
const CENTER = SVG_SIZE / 2
const HUB_RADIUS = 54
const ROLE_RADIUS = 200
const MISSION_RADIUS = 305

const BRANCH_ICONS: Record<OrgChartBranchId, typeof Users> = {
  PROVISEUR: Building2,
  CENSEUR: ShieldCheck,
  PROFESSEUR: BookOpen,
  VIE_SCOLAIRE: Eye,
  SECRETAIRE: Headphones,
  INTENDANT: Euro,
  CONSEILLER: GraduationCap,
}

const MISSION_ICONS = [
  Users,
  ClipboardList,
  Handshake,
  Clock,
  BookOpen,
  ShieldCheck,
  MapPin,
  Eye,
  MessageCircle,
  Folder,
  Euro,
  Globe,
  GraduationCap,
  Headphones,
] as const

function polarToCartesian(radius: number, angleRad: number): Point {
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  }
}

function branchAngle(index: number, total: number) {
  return -Math.PI / 2 + (2 * Math.PI * index) / total
}

function missionAngle(baseAngle: number, index: number, total: number) {
  if (total <= 1) return baseAngle
  const spread = Math.min(Math.PI / 3.5, total * 0.12)
  const t = index / (total - 1)
  return baseAngle + spread * (t - 0.5)
}

function MemberRow({ member }: { member: OrgChartBranchData['members'][number] }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5',
        !member.isActive && 'opacity-60',
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1B3A6B] ring-1 ring-slate-200">
        {getInitials(member.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{member.fullName}</p>
        <p className="text-[11px] text-slate-500">{ROLE_LABELS[member.roleCode]}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-[#1B3A6B]"
            title={member.email}
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-[#1B3A6B]"
            title={member.phone}
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

function BranchDetailPanel({
  branch,
  canInvite,
  compact,
}: {
  branch: OrgChartBranchData
  canInvite?: boolean
  compact?: boolean
}) {
  const Icon = BRANCH_ICONS[branch.id]
  const vacant = branch.activeCount === 0

  return (
    <div
      className={cn(
        dashboard.card,
        'overflow-hidden',
        compact ? 'p-4' : 'p-5',
      )}
      style={{ borderColor: branch.lightBorder }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: branch.lightBg, color: branch.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-slate-900">{branch.label}</h4>
            <Badge
              variant="outline"
              className="border-0 text-[11px] font-semibold"
              style={{ backgroundColor: branch.lightBg, color: branch.color }}
            >
              {branch.activeCount} actif{branch.activeCount > 1 ? 's' : ''}
            </Badge>
            {vacant && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                Poste vacant
              </Badge>
            )}
          </div>
          <ul className="mt-3 space-y-1.5">
            {branch.missions.map((mission, i) => {
              const MissionIcon = MISSION_ICONS[i % MISSION_ICONS.length]
              return (
                <li key={mission} className="flex items-start gap-2 text-xs text-slate-600">
                  <MissionIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: branch.color }} />
                  <span>{mission}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className={dashboard.label}>Membres du personnel</p>
        {branch.members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            Aucun membre assigné à ce rôle.
            {canInvite && (
              <div className="mt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/staff/roles-permissions?tab=invitations">
                    <UserPlus className="h-3.5 w-3.5" />
                    Inviter
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          branch.members.map(member => <MemberRow key={member.id} member={member} />)
        )}
      </div>
    </div>
  )
}

function RadialChart({
  data,
  selectedId,
  onSelect,
  showMissions,
}: {
  data: SchoolOrgChartData
  selectedId: OrgChartBranchId | null
  onSelect: (id: OrgChartBranchId) => void
  showMissions: boolean
}) {
  const branches = data.branches
  const total = branches.length

  const layout = useMemo(() => {
    return branches.map((branch, index) => {
      const angle = branchAngle(index, total)
      const rolePoint = polarToCartesian(ROLE_RADIUS, angle)
      const missions = showMissions
        ? branch.missions.map((label, missionIndex) => ({
            label,
            ...polarToCartesian(
              MISSION_RADIUS,
              missionAngle(angle, missionIndex, branch.missions.length),
            ),
          }))
        : []

      return { branch, rolePoint, missions }
    })
  }, [branches, showMissions, total])

  return (
    <div className="relative mx-auto min-w-0 w-full max-w-[720px] overflow-hidden">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="h-auto w-full max-w-full select-none overflow-hidden"
        role="img"
        aria-label={`Organigramme du personnel de ${data.schoolName}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="org-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
          </filter>
        </defs>

        {layout.map(({ branch, rolePoint, missions }) => {
          const isSelected = selectedId === branch.id
          const isDimmed = selectedId !== null && !isSelected

          return (
            <g key={branch.id} opacity={isDimmed ? 0.45 : 1}>
              <path
                d={`M ${CENTER} ${CENTER} Q ${(CENTER + rolePoint.x) / 2} ${(CENTER + rolePoint.y) / 2 - 20} ${rolePoint.x} ${rolePoint.y}`}
                fill="none"
                stroke={branch.color}
                strokeWidth={isSelected ? 3 : 2}
                strokeOpacity={0.35}
              />

              {missions.map(mission => (
                <g key={mission.label}>
                  <line
                    x1={rolePoint.x}
                    y1={rolePoint.y}
                    x2={mission.x}
                    y2={mission.y}
                    stroke={branch.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.25}
                  />
                  <circle cx={mission.x} cy={mission.y} r={5} fill={branch.color} fillOpacity={0.85} />
                  <text
                    x={mission.x + (mission.x - CENTER > 0 ? 10 : -10)}
                    y={mission.y + 4}
                    textAnchor={mission.x - CENTER > 0 ? 'start' : 'end'}
                    className="fill-slate-600 text-[11px] font-medium"
                  >
                    {mission.label.length > 28 ? `${mission.label.slice(0, 26)}…` : mission.label}
                  </text>
                </g>
              ))}

              <g
                className="cursor-pointer transition-transform hover:scale-[1.03]"
                onClick={() => onSelect(branch.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(branch.id)
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${branch.label}, ${branch.activeCount} membre(s) actif(s)`}
              >
                <circle
                  cx={rolePoint.x}
                  cy={rolePoint.y}
                  r={38}
                  fill="white"
                  stroke={branch.color}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  filter="url(#org-shadow)"
                />
                <circle
                  cx={rolePoint.x}
                  cy={rolePoint.y - 8}
                  r={14}
                  fill={branch.lightBg}
                />
                <text
                  x={rolePoint.x}
                  y={rolePoint.y - 4}
                  textAnchor="middle"
                  className="text-[10px] font-bold"
                  style={{ fill: branch.color }}
                >
                  {branch.activeCount}
                </text>
                <text
                  x={rolePoint.x}
                  y={rolePoint.y + 18}
                  textAnchor="middle"
                  className="fill-slate-800 text-[11px] font-bold uppercase tracking-wide"
                >
                  {branch.label.length > 12 ? branch.label.slice(0, 10) : branch.label}
                </text>
                {branch.label.length > 12 && (
                  <text
                    x={rolePoint.x}
                    y={rolePoint.y + 30}
                    textAnchor="middle"
                    className="fill-slate-800 text-[11px] font-bold uppercase tracking-wide"
                  >
                    {branch.label.slice(10)}
                  </text>
                )}
              </g>
            </g>
          )
        })}

        <g filter="url(#org-shadow)">
          <circle cx={CENTER} cy={CENTER} r={HUB_RADIUS} fill="white" stroke="#1B3A6B" strokeWidth={3} />
          <circle cx={CENTER} cy={CENTER} r={HUB_RADIUS - 8} fill="#EEF3FA" />
          {data.schoolLogoUrl ? (
            <>
              <defs>
                <clipPath id="school-logo-clip">
                  <circle cx={CENTER} cy={CENTER - 6} r={26} />
                </clipPath>
              </defs>
              <image
                href={data.schoolLogoUrl}
                x={CENTER - 26}
                y={CENTER - 32}
                width={52}
                height={52}
                preserveAspectRatio="xMidYMid meet"
                clipPath="url(#school-logo-clip)"
              />
            </>
          ) : (
            <foreignObject x={CENTER - 14} y={CENTER - 26} width={28} height={28}>
              <div className="flex h-full w-full items-center justify-center text-[#1B3A6B]">
                <Building2 className="h-6 w-6" />
              </div>
            </foreignObject>
          )}
          <text
            x={CENTER}
            y={CENTER + (data.schoolLogoUrl ? 34 : 24)}
            textAnchor="middle"
            className="fill-[#1B3A6B] text-[10px] font-extrabold uppercase tracking-[0.12em]"
          >
            École
          </text>
        </g>
      </svg>
    </div>
  )
}

function MobileBranchCards({
  data,
  selectedId,
  onSelect,
  canInvite,
}: {
  data: SchoolOrgChartData
  selectedId: OrgChartBranchId | null
  onSelect: (id: OrgChartBranchId | null) => void
  canInvite?: boolean
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {data.branches.map(branch => {
        const Icon = BRANCH_ICONS[branch.id]
        const expanded = selectedId === branch.id

        return (
          <div
            key={branch.id}
            className={cn(dashboard.card, 'overflow-hidden')}
            style={{ borderColor: expanded ? branch.lightBorder : undefined }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80"
              onClick={() => onSelect(expanded ? null : branch.id)}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: branch.lightBg, color: branch.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{branch.label}</p>
                <p className="text-xs text-slate-500">
                  {branch.activeCount} actif{branch.activeCount > 1 ? 's' : ''}
                  {' · '}
                  {branch.missions.length} missions
                </p>
              </div>
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 text-slate-400 transition',
                  expanded && 'rotate-90',
                )}
              />
            </button>
            {expanded && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                <BranchDetailPanel branch={branch} canInvite={canInvite} compact />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StaffOrgChart({
  data,
  canInvite = false,
  variant = 'full',
  className,
}: StaffOrgChartProps) {
  const defaultBranch =
    data.branches.find(b => b.activeCount > 0)?.id ?? data.branches[0]?.id ?? 'PROVISEUR'
  const [selectedId, setSelectedId] = useState<OrgChartBranchId | null>(
    variant === 'preview' ? null : defaultBranch,
  )

  const handleSelect = (id: OrgChartBranchId | null) => {
    setSelectedId(id)
  }

  const selectedBranch = data.branches.find(b => b.id === selectedId) ?? null

  if (variant === 'preview') {
    return (
      <div className={cn('min-w-0 space-y-4', className)}>
        <div className="hidden min-w-0 overflow-hidden sm:block">
          <RadialChart
            data={data}
            selectedId={selectedId}
            onSelect={id => handleSelect(id)}
            showMissions={false}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          {data.branches.map(branch => (
            <div
              key={branch.id}
              className={cn(dashboard.card, 'p-3 text-center')}
              style={{ borderColor: branch.lightBorder }}
            >
              <p className="text-xl font-bold tabular-nums" style={{ color: branch.color }}>
                {branch.activeCount}
              </p>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">
                {branch.label}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{data.totalActive}</strong> membre
            {data.totalActive > 1 ? 's' : ''} actif{data.totalActive > 1 ? 's' : ''} sur{' '}
            {data.totalStaff} au total
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/staff?view=organigramme">
              Voir l&apos;organigramme
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-w-0 space-y-5', className)}>
      <div className="hidden min-w-0 lg:grid lg:grid-cols-1 lg:gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-6">
        <div className={cn(dashboard.card, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
          <RadialChart
            data={data}
            selectedId={selectedId}
            onSelect={id => handleSelect(id)}
            showMissions={false}
          />
          <p className="mt-2 text-center text-xs text-slate-500">
            Cliquez sur un rôle pour voir les membres et les missions associées.
          </p>
        </div>
        {selectedBranch && (
          <BranchDetailPanel branch={selectedBranch} canInvite={canInvite} />
        )}
      </div>

      <MobileBranchCards
        data={data}
        selectedId={selectedId}
        onSelect={handleSelect}
        canInvite={canInvite}
      />
    </div>
  )
}
