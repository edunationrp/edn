import { formatTuitionLabel } from '@/lib/finance/series'
import { toMoney } from '@/lib/finance/money'

export type TuitionGridRow = {
  levelId: string
  levelName: string
  series: string
  label: string
  rateId: string | null
  amount: number | null
}

export function buildTuitionGrid(
  levels: Array<{ id: string; name: string }>,
  rates: Array<{ id: string; class_level_id: string; series: string; amount: number }>
): TuitionGridRow[] {
  const rows: TuitionGridRow[] = []

  for (const level of levels) {
    const levelRates = rates.filter(r => r.class_level_id === level.id)
    const hasSeries = ['2nde', '1ère', '1ere', 'Tle'].some(s =>
      level.name.toLowerCase().includes(s.toLowerCase())
    )

    if (hasSeries) {
      for (const series of ['', 'A', 'C', 'D']) {
        const rate = levelRates.find(r => (r.series ?? '') === series)
        rows.push({
          levelId: level.id,
          levelName: level.name,
          series,
          label: formatTuitionLabel(level.name, series),
          rateId: rate?.id ?? null,
          amount: rate ? toMoney(rate.amount) : null,
        })
      }
    } else {
      const rate = levelRates.find(r => !r.series)
      rows.push({
        levelId: level.id,
        levelName: level.name,
        series: '',
        label: level.name,
        rateId: rate?.id ?? null,
        amount: rate ? toMoney(rate.amount) : null,
      })
    }
  }

  return rows
}
