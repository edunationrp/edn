'use client'

import {
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'
import { DataTableShell, FilterBar, FilterSearch, FilterSelect } from '@/components/dashboard/filter-bar'

export type DashboardTableColumn = {
  id: string
  label: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
}

export type DashboardTableEmptyState = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function DashboardTableEmpty({ icon, title, description, action }: DashboardTableEmptyState) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function DashboardTableFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
      {children}
    </div>
  )
}

export function DashboardTableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn(dashboard.tableRow, className)} {...props}>
      {children}
    </tr>
  )
}

export function DashboardTableCell({
  className,
  align,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'center' | 'right' }) {
  return (
    <td
      className={cn(
        'px-4 py-3.5 sm:px-5',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

type DashboardDataTableProps<T> = {
  toolbar?: ReactNode
  title?: string
  columns: DashboardTableColumn[]
  data: T[]
  keyExtractor: (item: T) => string
  renderMobileRow: (item: T) => ReactNode
  renderDesktopRow: (item: T) => ReactNode
  footer?: ReactNode
  emptyState: DashboardTableEmptyState
  minWidth?: string
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DashboardDataTable<T>({
  toolbar,
  title,
  columns,
  data,
  keyExtractor,
  renderMobileRow,
  renderDesktopRow,
  footer,
  emptyState,
  minWidth = '720px',
  mobileBreakpoint = 'md',
  className,
}: DashboardDataTableProps<T>) {
  const mobileHidden =
    mobileBreakpoint === 'sm' ? 'sm:hidden' : mobileBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden'
  const desktopHidden =
    mobileBreakpoint === 'sm' ? 'hidden sm:block' : mobileBreakpoint === 'lg' ? 'hidden lg:block' : 'hidden md:block'

  return (
    <DataTableShell className={className}>
      {toolbar}
      {title && (
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
      )}
      {data.length === 0 ? (
        <DashboardTableEmpty {...emptyState} />
      ) : (
        <>
          <div className={cn('divide-y divide-slate-100', mobileHidden)}>
            {data.map(item => (
              <div key={keyExtractor(item)}>{renderMobileRow(item)}</div>
            ))}
          </div>
          <div className={cn(desktopHidden, dashboard.tableWrap)}>
            <table className="w-full text-sm" style={{ minWidth }}>
              <thead>
                <tr className={dashboard.tableHead}>
                  {columns.map(col => (
                    <th
                      key={col.id}
                      className={cn(
                        dashboard.label,
                        'px-4 py-3 sm:px-5',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        !col.align || col.align === 'left' ? 'text-left' : '',
                        col.headerClassName,
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(item => {
                  const row = renderDesktopRow(item)
                  const key = keyExtractor(item)
                  if (isValidElement(row)) {
                    return cloneElement(row as ReactElement<{ key?: string }>, { key })
                  }
                  return row
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {footer && data.length > 0 && <DashboardTableFooter>{footer}</DashboardTableFooter>}
    </DataTableShell>
  )
}

export function filterBySearch<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(item => getSearchableText(item).toLowerCase().includes(q))
}

export function formatListFooter(filtered: number, total: number, hasFilters = false) {
  const label = `${filtered} élément${filtered !== 1 ? 's' : ''}${hasFilters ? ' affiché(s)' : ''}`
  if (hasFilters && filtered !== total) return `${label} · ${total} au total`
  return label
}

export { DataTableShell, FilterBar, FilterSearch, FilterSelect }
