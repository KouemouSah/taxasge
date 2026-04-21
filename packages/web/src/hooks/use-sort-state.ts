import { useState, useCallback, useMemo } from 'react'
import type { SortState } from '@/components/ui/sortable-header'

/**
 * Reusable sort state hook for tables.
 *
 * @param defaultColumn Initial sort column (null = no sort)
 * @param defaultDirection Initial direction ('asc' or 'desc')
 *
 * Returns [sort, handleSort, sortData]:
 * - sort: current SortState {column, direction}
 * - handleSort: toggle sort on a column
 * - sortData: helper to sort an array client-side (for small tables)
 *
 * Usage (server-side):
 * ```tsx
 * const [sort, handleSort] = useSortState('created_at', 'desc')
 * // Pass sort.column as sort_by and sort.direction as sort_order to API
 * ```
 *
 * Usage (client-side):
 * ```tsx
 * const [sort, handleSort, sortData] = useSortState()
 * const sorted = sortData(items, { name: 'string', amount: 'number', createdAt: 'date' })
 * ```
 */
export function useSortState(
  defaultColumn: string | null = null,
  defaultDirection: 'asc' | 'desc' = 'asc',
) {
  const [sort, setSort] = useState<SortState>({
    column: defaultColumn,
    direction: defaultDirection,
  })

  const handleSort = useCallback((column: string) => {
    setSort(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { column, direction: 'asc' }
    })
  }, [])

  /**
   * Client-side sort helper for small tables.
   *
   * @param data Array of objects to sort
   * @param columnTypes Map of column keys to their types for proper comparison
   *
   * Types: 'string' | 'number' | 'boolean' | 'date'
   */
  const sortData = useCallback(
    <T extends Record<string, unknown>>(
      data: T[],
      columnTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'>,
    ): T[] => {
      if (!sort.column) return data

      const col = sort.column
      const type = columnTypes[col] || 'string'
      const dir = sort.direction === 'asc' ? 1 : -1

      return [...data].sort((a, b) => {
        const va = a[col]
        const vb = b[col]

        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1

        switch (type) {
          case 'number':
            return (Number(va) - Number(vb)) * dir
          case 'boolean':
            return ((va ? 1 : 0) - (vb ? 1 : 0)) * dir
          case 'date':
            return (new Date(String(va)).getTime() - new Date(String(vb)).getTime()) * dir
          default:
            return String(va).localeCompare(String(vb)) * dir
        }
      })
    },
    [sort],
  )

  return [sort, handleSort, sortData] as const
}
