/**
 * Table 组件 - 基于 Chakra UI
 * 功能完整的表格组件，支持自定义渲染、加载状态和行交互
 */

import {
  Table as ChakraTable,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

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
  emptyText,
  onRowClick,
}: TableProps<T>) {
  const { t } = useTranslation()

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] ?? index.toString()
  }

  const defaultEmptyText = emptyText || t('common.noData')

  if (loading) {
    return (
      <Box
        bg="gray.800"
        p={8}
        borderRadius="lg"
        textAlign="center"
      >
        <Text color="gray.400">{t('common.loading')}</Text>
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box
        bg="gray.800"
        p={8}
        borderRadius="lg"
        textAlign="center"
      >
        <Text color="gray.500">{defaultEmptyText}</Text>
      </Box>
    )
  }

  return (
    <TableContainer
      bg="gray.800"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.700"
    >
      <ChakraTable variant="simple" colorScheme="gray">
        <Thead bg="gray.900">
          <Tr>
            {columns.map((column) => (
              <Th
                key={column.key}
                textAlign={column.align || 'left'}
                width={column.width}
                color="gray.400"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                borderColor="gray.700"
              >
                {column.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((record, index) => (
            <Tr
              key={getRowKey(record, index)}
              cursor={onRowClick ? 'pointer' : 'default'}
              onClick={() => onRowClick?.(record, index)}
              _hover={
                onRowClick
                  ? {
                      bg: 'gray.700',
                    }
                  : undefined
              }
              transition="background-color 0.15s"
            >
              {columns.map((column) => (
                <Td
                  key={column.key}
                  textAlign={column.align || 'left'}
                  color="gray.200"
                  borderColor="gray.700"
                >
                  {column.render
                    ? column.render(record[column.key], record, index)
                    : record[column.key]}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </ChakraTable>
    </TableContainer>
  )
}
