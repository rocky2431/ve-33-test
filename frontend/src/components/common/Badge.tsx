/**
 * Badge 组件 - 基于 Chakra UI
 * 简洁的徽章组件，支持多种状态和尺寸
 */

import { Badge as ChakraBadge, type BadgeProps as ChakraBadgeProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface BadgeProps extends Omit<ChakraBadgeProps, 'variant'> {
  children: ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 将自定义 variant 映射到 Chakra UI 的 colorScheme
 */
const getColorScheme = (variant: BadgeProps['variant']) => {
  switch (variant) {
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'warning':
      return 'yellow'
    case 'info':
      return 'blue'
    case 'default':
    default:
      return 'gray'
  }
}

/**
 * 尺寸映射
 */
const getSizeProps = (size: BadgeProps['size']) => {
  switch (size) {
    case 'sm':
      return { fontSize: 'xs', px: 2, py: 0.5 }
    case 'md':
      return { fontSize: 'sm', px: 3, py: 1 }
    case 'lg':
      return { fontSize: 'md', px: 4, py: 1.5 }
    default:
      return { fontSize: 'sm', px: 3, py: 1 }
  }
}

export function Badge({ children, variant = 'default', size = 'md', ...chakraProps }: BadgeProps) {
  const colorScheme = getColorScheme(variant)
  const sizeProps = getSizeProps(size)

  return (
    <ChakraBadge
      colorScheme={colorScheme}
      variant="subtle"
      borderRadius="full"
      fontWeight="medium"
      {...sizeProps}
      {...chakraProps}
    >
      {children}
    </ChakraBadge>
  )
}
