import type { CSSProperties, ReactNode } from 'react'
import { colors, radius, spacing, fontSize, transition } from '../../constants/theme'

export interface Column<T = any> {
  key: string
  title: string
  render?: (value: any, record: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface TableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  emptyText?: string
  onRowClick?: (record: T, index: number) => void
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyText = '暂无数据',
  onRowClick,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] ?? index.toString()
  }

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    overflow: 'hidden',
  }

  const theadStyle: CSSProperties = {
    backgroundColor: colors.bgPrimary,
  }

  const thStyle: CSSProperties = {
    padding: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'left',
    borderBottom: `1px solid ${colors.border}`,
  }

  const tdStyle: CSSProperties = {
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderBottom: `1px solid ${colors.border}`,
  }

  const rowStyle = (clickable: boolean): CSSProperties => ({
    cursor: clickable ? 'pointer' : 'default',
    transition: transition.fast,
  })

  if (loading) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.textSecondary,
          backgroundColor: colors.bgSecondary,
          borderRadius: radius.md,
        }}
      >
        加载中...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.textTertiary,
          backgroundColor: colors.bgSecondary,
          borderRadius: radius.md,
        }}
      >
        {emptyText}
      </div>
    )
  }

  return (
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={{
                ...thStyle,
                textAlign: column.align || 'left',
                width: column.width,
              }}
            >
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((record, index) => (
          <tr
            key={getRowKey(record, index)}
            style={rowStyle(!!onRowClick)}
            onClick={() => onRowClick?.(record, index)}
            onMouseEnter={(e) => {
              if (onRowClick) {
                e.currentTarget.style.backgroundColor = colors.bgTertiary
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {columns.map((column) => (
              <td
                key={column.key}
                style={{
                  ...tdStyle,
                  textAlign: column.align || 'left',
                }}
              >
                {column.render
                  ? column.render(record[column.key], record, index)
                  : record[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
