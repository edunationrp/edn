/** Classes utilitaires partagées pour tout le dashboard EduNation. */
export const dashboard = {
  page: 'space-y-5 animate-fade-in sm:space-y-6',
  canvas: 'min-h-screen bg-[#F0F4F8]',
  main: 'mt-14 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:px-8 lg:py-7',
  card:
    'rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]',
  cardHover:
    'transition-all duration-200 hover:border-slate-300/80 hover:shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]',
  cardHeader: 'flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4',
  cardBody: 'p-5',
  tableWrap: 'overflow-x-auto',
  tableHead: 'border-b border-slate-100 bg-slate-50/80',
  tableRow: 'border-b border-slate-100/80 last:border-0 transition-colors hover:bg-slate-50/60',
  label: 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500',
  link: 'font-semibold text-[#1B3A6B] transition hover:text-[#7AB832]',
  iconBox:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FA] text-[#1B3A6B] transition group-hover:bg-[#1B3A6B] group-hover:text-white',
  navy: '#1B3A6B',
  green: '#7AB832',
  greenDark: '#1a4d2e',
} as const
