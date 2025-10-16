/**
 * Button 组件 - 基于 Chakra UI
 * 保持向后兼容的同时提供现代化的样式和功能
 */

import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

interface ButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean // 保持兼容性，内部映射到 isLoading
  variant?: 'primary' | 'secondary' | 'outline' // 自定义 variant
  fullWidth?: boolean // 保持兼容性，内部映射到 isFullWidth
}

/**
 * 将自定义 variant 映射到 Chakra UI 的 variant 和 colorScheme
 */
const getChakraVariant = (variant: ButtonProps['variant']) => {
  switch (variant) {
    case 'primary':
      return { variant: 'solid', colorScheme: 'brand' }
    case 'secondary':
      return { variant: 'solid', colorScheme: 'gray' }
    case 'outline':
      return { variant: 'outline', colorScheme: 'brand' }
    default:
      return { variant: 'solid', colorScheme: 'brand' }
  }
}

export function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
  ...chakraProps
}: ButtonProps) {
  const { t } = useTranslation()
  const { variant: chakraVariant, colorScheme } = getChakraVariant(variant)

  return (
    <ChakraButton
      onClick={onClick}
      isDisabled={disabled}
      isLoading={loading}
      loadingText={t('common.loading')}
      variant={chakraVariant}
      colorScheme={colorScheme}
      width={fullWidth ? 'full' : 'auto'}
      size="lg"
      borderRadius="xl"
      fontWeight="semibold"
      transition="all 0.2s"
      _hover={{
        transform: disabled || loading ? 'none' : 'translateY(-2px)',
        boxShadow: disabled || loading ? 'none' : 'lg',
      }}
      {...chakraProps}
    >
      {children}
    </ChakraButton>
  )
}
