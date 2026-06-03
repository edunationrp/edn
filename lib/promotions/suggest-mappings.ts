import { buildClassNameForLevel, extractSectionKey, sectionKeysMatch } from '@/lib/promotions/class-keys'

export type LevelRow = {
  id: string
  name: string
  order: number
}

export type ClassMappingCandidate = {
  id: string
  name: string
  levelId: string
  levelName: string
  levelOrder: number
  series: string | null
  capacity: number | null
  sectionKey: string
}

export type MappingSuggestion = {
  sourceClassId: string
  sourceClassName: string
  sourceLevelName: string
  sourceLevelOrder: number
  hasNextLevel: boolean
  admittedCount: number
  repeatCount: number
  targetClassId: string | null
  repeatTargetClassId: string | null
  targetClassName: string | null
  repeatTargetClassName: string | null
  warnings: string[]
}

function toCandidate(
  row: {
    id: string
    name: string
    level_id: string
    capacity: number | null
    series: string | null
    class_levels: { name: string; order_num: number | null; order_index: number | null } | null
  },
): ClassMappingCandidate {
  const levelName = row.class_levels?.name ?? ''
  const levelOrder = row.class_levels?.order_num ?? row.class_levels?.order_index ?? 0
  return {
    id: row.id,
    name: row.name,
    levelId: row.level_id,
    levelName,
    levelOrder,
    series: row.series,
    capacity: row.capacity,
    sectionKey: extractSectionKey(row.name, levelName),
  }
}

function findTargetClass(
  targets: ClassMappingCandidate[],
  levelId: string,
  sectionKey: string,
  series: string | null,
): ClassMappingCandidate | null {
  const matches = targets.filter(
    t => t.levelId === levelId && sectionKeysMatch(t.sectionKey, sectionKey),
  )
  if (matches.length === 1) return matches[0]
  if (series?.trim()) {
    const withSeries = matches.find(t => (t.series ?? '').trim() === series.trim())
    if (withSeries) return withSeries
  }
  return matches[0] ?? null
}

export function buildMappingSuggestions(input: {
  sourceClasses: Array<{
    id: string
    name: string
    level_id: string
    capacity: number | null
    series: string | null
    class_levels: { name: string; order_num: number | null; order_index: number | null } | null
  }>
  targetClasses: Array<{
    id: string
    name: string
    level_id: string
    capacity: number | null
    series: string | null
    class_levels: { name: string; order_num: number | null; order_index: number | null } | null
  }>
  levels: LevelRow[]
  admittedByClass: Map<string, number>
  repeatByClass: Map<string, number>
}): MappingSuggestion[] {
  const sortedLevels = [...input.levels].sort((a, b) => a.order - b.order)
  const maxOrder = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1].order : 0
  const orderToLevel = new Map(sortedLevels.map(l => [l.order, l]))
  const orderToNextLevel = new Map<number, LevelRow>()
  for (const level of sortedLevels) {
    const next = sortedLevels.find(l => l.order > level.order)
    if (next) orderToNextLevel.set(level.order, next)
  }

  const sources = input.sourceClasses.map(toCandidate)
  const targets = input.targetClasses.map(toCandidate)

  return sources.map(source => {
    const warnings: string[] = []
    const admittedCount = input.admittedByClass.get(source.id) ?? 0
    const repeatCount = input.repeatByClass.get(source.id) ?? 0
    const hasNextLevel = source.levelOrder < maxOrder
    const nextLevel = orderToNextLevel.get(source.levelOrder) ?? null
    const sameLevel = orderToLevel.get(source.levelOrder) ?? null

    let targetClassId: string | null = null
    let targetClassName: string | null = null
    let repeatTargetClassId: string | null = null
    let repeatTargetClassName: string | null = null

    if (hasNextLevel && nextLevel) {
      const expectedName = buildClassNameForLevel(nextLevel.name, source.sectionKey, source.series)
      const match = findTargetClass(targets, nextLevel.id, source.sectionKey, source.series)
      if (match) {
        targetClassId = match.id
        targetClassName = match.name
      } else {
        warnings.push(`Aucune classe cible trouvée pour « ${expectedName} » (année suivante).`)
      }
      if (admittedCount > 0 && match?.capacity != null && admittedCount > match.capacity) {
        warnings.push(
          `Capacité dépassée : ${admittedCount} admis pour ${match.capacity} places (${match.name}).`,
        )
      }
    }

    if (sameLevel) {
      const matchRepeat = findTargetClass(targets, sameLevel.id, source.sectionKey, source.series)
      if (matchRepeat) {
        repeatTargetClassId = matchRepeat.id
        repeatTargetClassName = matchRepeat.name
      } else if (repeatCount > 0) {
        warnings.push(`Aucune classe pour les redoublants (${source.name}, année suivante).`)
      }
      if (repeatCount > 0 && matchRepeat?.capacity != null && repeatCount > matchRepeat.capacity) {
        warnings.push(
          `Capacité redoublement : ${repeatCount} élèves pour ${matchRepeat.capacity} places.`,
        )
      }
    }

    if (!hasNextLevel && admittedCount > 0) {
      warnings.push('Dernier niveau : les admis sont des sortants (pas de classe supérieure).')
    }

    return {
      sourceClassId: source.id,
      sourceClassName: source.name,
      sourceLevelName: source.levelName,
      sourceLevelOrder: source.levelOrder,
      hasNextLevel,
      admittedCount,
      repeatCount,
      targetClassId,
      repeatTargetClassId,
      targetClassName,
      repeatTargetClassName,
      warnings,
    }
  })
}
