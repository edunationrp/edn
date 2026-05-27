import { createClient } from '@/lib/supabase/server'
import { parseSeriesFromClassName, formatTuitionLabel } from '@/lib/finance/series'
import { toMoney, sumMoney } from '@/lib/finance/money'

export type ExtraFeeLine = {
  id: string
  label: string
  amount: number
  templateId?: string
}

export type OfficialTuition = {
  rateId: string | null
  amount: number
  levelName: string
  series: string
  label: string
  configured: boolean
}

export type EncashmentContext = {
  student: {
    id: string
    firstName: string
    lastName: string
    iun: string
    className: string | null
    levelName: string | null
    series: string
    birthDate: string | null
  }
  parent: {
    firstName: string | null
    lastName: string | null
    phone: string | null
  }
  schoolYear: { id: string; name: string } | null
  officialTuition: OfficialTuition
  extraFees: ExtraFeeLine[]
  extraFeeTemplates: Array<{
    id: string
    name: string
    suggestedAmount: number | null
  }>
  totalDue: number
  totalPaid: number
  remaining: number
  dossierId: string | null
  paymentHistory: Array<{
    id: string
    amount: number
    reference: string | null
    paidAt: string | null
    status: string
  }>
}

type ExtraFeeJson = {
  id?: string
  label?: string
  amount?: number
  template_id?: string
}

async function resolveOfficialTuition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  schoolYearId: string,
  classLevelId: string | null,
  levelName: string,
  series: string
): Promise<OfficialTuition> {
  const base: OfficialTuition = {
    rateId: null,
    amount: 0,
    levelName,
    series,
    label: formatTuitionLabel(levelName, series),
    configured: false,
  }

  if (!classLevelId) return base

  const { data: exactRaw } = await supabase
    .from('official_tuition_rates')
    .select('id, amount')
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .eq('class_level_id', classLevelId)
    .eq('series', series)
    .eq('is_active', true)
    .limit(1)

  let rate = (exactRaw as Array<{ id: string; amount: number }> | null)?.[0]

  if (!rate && series) {
    const { data: fallbackRaw } = await supabase
      .from('official_tuition_rates')
      .select('id, amount')
      .eq('school_id', schoolId)
      .eq('school_year_id', schoolYearId)
      .eq('class_level_id', classLevelId)
      .eq('series', '')
      .eq('is_active', true)
      .limit(1)
    rate = (fallbackRaw as Array<{ id: string; amount: number }> | null)?.[0]
  }

  if (!rate) return base

  return {
    rateId: rate.id,
    amount: toMoney(rate.amount),
    levelName,
    series,
    label: formatTuitionLabel(levelName, series),
    configured: true,
  }
}

function parseExtraFees(raw: unknown): ExtraFeeLine[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => {
      const row = item as ExtraFeeJson
      if (!row.label?.trim()) return null
      return {
        id: row.id ?? `extra-${index}`,
        label: row.label.trim(),
        amount: toMoney(row.amount),
        templateId: row.template_id ?? undefined,
      }
    })
    .filter(Boolean) as ExtraFeeLine[]
}

export async function getEncashmentContext(
  schoolId: string,
  studentId: string
): Promise<EncashmentContext | null> {
  const supabase = await createClient()

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      iun,
      birth_date,
      student_enrollments(
        classes(name, series, level_id, class_levels(name)),
        school_years(id, name, is_active)
      )
    `)
    .eq('school_id', schoolId)
    .eq('id', studentId)
    .limit(1)

  const studentRow = (studentRaw as Array<{
    id: string
    first_name: string
    last_name: string
    iun: string
    birth_date: string
    student_enrollments: Array<{
      classes: {
        name: string
        series: string | null
        level_id: string
        class_levels: { name: string } | null
      } | null
      school_years: { id: string; name: string; is_active: boolean } | null
    }> | null
  }> | null)?.[0]

  if (!studentRow) return null

  const enrollment =
    studentRow.student_enrollments?.find(e => e.school_years?.is_active) ??
    studentRow.student_enrollments?.[0]

  const classInfo = enrollment?.classes
  const levelName = classInfo?.class_levels?.name ?? ''
  const className = classInfo?.name ?? null
  const series =
    classInfo?.series?.trim().toUpperCase() ||
    (className && levelName ? parseSeriesFromClassName(className, levelName) : '')

  let schoolYear = enrollment?.school_years
    ? { id: enrollment.school_years.id, name: enrollment.school_years.name }
    : null

  if (!schoolYear) {
    const { data: yearRaw } = await supabase
      .from('school_years')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .limit(1)
    const y = (yearRaw as Array<{ id: string; name: string }> | null)?.[0]
    if (y) schoolYear = y
  }

  const [templatesResult, paymentsResult, preRegResult, relationResult] = await Promise.all([
    supabase
      .from('school_extra_fee_templates')
      .select('id, name, suggested_amount')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('payments')
      .select('id, amount, reference, paid_at, status')
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .in('status', ['paid', 'partial'])
      .order('created_at', { ascending: false }),
    supabase
      .from('parent_pre_registrations')
      .select('first_name, last_name, phone')
      .eq('school_id', schoolId)
      .eq('linked_student_id', studentId)
      .limit(1),
    supabase
      .from('parent_student_relations')
      .select('profiles(full_name, phone)')
      .eq('student_id', studentId)
      .limit(1),
  ])

  const officialTuition =
    schoolYear && classInfo?.level_id
      ? await resolveOfficialTuition(
          supabase,
          schoolId,
          schoolYear.id,
          classInfo.level_id,
          levelName,
          series
        )
      : {
          rateId: null,
          amount: 0,
          levelName,
          series,
          label: formatTuitionLabel(levelName, series),
          configured: false,
        }

  let dossierId: string | null = null
  let extraFees: ExtraFeeLine[] = []

  if (schoolYear) {
    const { data: dossierRaw } = await supabase
      .from('student_fee_dossiers')
      .select('id, extra_fees, tuition_amount')
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('school_year_id', schoolYear.id)
      .limit(1)

    const dossier = (dossierRaw as Array<{
      id: string
      extra_fees: unknown
      tuition_amount: number
    }> | null)?.[0]

    if (dossier) {
      dossierId = dossier.id
      extraFees = parseExtraFees(dossier.extra_fees)
    } else if (officialTuition.configured) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created } = await (supabase as any)
        .from('student_fee_dossiers')
        .insert({
          school_id: schoolId,
          student_id: studentId,
          school_year_id: schoolYear.id,
          tuition_rate_id: officialTuition.rateId,
          tuition_amount: officialTuition.amount,
          level_name: levelName,
          series,
          extra_fees: [],
        })
        .select('id')
        .single()
      dossierId = (created as { id: string } | null)?.id ?? null
    }
  }

  const extraTotal = sumMoney(extraFees.map(f => f.amount))
  const totalDue = toMoney(officialTuition.amount) + extraTotal
  const paymentRows =
    (paymentsResult.data as Array<{
      id: string
      amount: number
      reference: string | null
      paid_at: string | null
      status: string
    }> | null) ?? []
  const totalPaid = sumMoney(paymentRows.map(p => p.amount))
  const remaining = Math.max(0, totalDue - totalPaid)

  const preReg = (preRegResult.data as Array<{
    first_name: string
    last_name: string
    phone: string | null
  }> | null)?.[0]

  const relation = (relationResult.data as Array<{
    profiles: { full_name: string | null; phone: string | null } | null
  }> | null)?.[0]

  let parent: EncashmentContext['parent'] = {
    firstName: null,
    lastName: null,
    phone: null,
  }

  if (preReg) {
    parent = {
      firstName: preReg.first_name,
      lastName: preReg.last_name,
      phone: preReg.phone,
    }
  } else if (relation?.profiles?.full_name) {
    const parts = relation.profiles.full_name.trim().split(/\s+/)
    parent = {
      firstName: parts.slice(1).join(' ') || parts[0] || null,
      lastName: parts[0] ?? null,
      phone: relation.profiles.phone,
    }
  }

  if (!parent.phone) {
    const { data: admissionRaw } = await supabase
      .from('student_registration_requests')
      .select('metadata, parent_phone')
      .eq('school_id', schoolId)
      .eq('student_id', studentId)
      .eq('status', 'approved')
      .limit(1)

    const admission = (admissionRaw as Array<{
      metadata: Record<string, unknown> | null
      parent_phone: string | null
    }> | null)?.[0]

    if (admission?.metadata) {
      parent = {
        firstName: (admission.metadata.parent_first_name as string) ?? parent.firstName,
        lastName: (admission.metadata.parent_last_name as string) ?? parent.lastName,
        phone:
          (admission.metadata.parent_phone as string) ??
          admission.parent_phone ??
          parent.phone,
      }
    }
  }

  const templates =
    (templatesResult.data as Array<{
      id: string
      name: string
      suggested_amount: number | null
    }> | null) ?? []

  return {
    student: {
      id: studentRow.id,
      firstName: studentRow.first_name,
      lastName: studentRow.last_name,
      iun: studentRow.iun,
      className,
      levelName: levelName || null,
      series,
      birthDate: studentRow.birth_date,
    },
    parent,
    schoolYear,
    officialTuition,
    extraFees,
    extraFeeTemplates: templates.map(t => ({
      id: t.id,
      name: t.name,
      suggestedAmount: t.suggested_amount != null ? toMoney(t.suggested_amount) : null,
    })),
    totalDue,
    totalPaid,
    remaining,
    dossierId,
    paymentHistory: paymentRows.map(p => ({
      id: p.id,
      amount: toMoney(p.amount),
      reference: p.reference,
      paidAt: p.paid_at,
      status: p.status,
    })),
  }
}
