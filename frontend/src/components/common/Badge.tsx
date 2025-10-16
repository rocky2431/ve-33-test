import type { CSSProperties, ReactNode } from 'react'
import { colors, radius, fontSize } from '../../constants/theme'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variantColors: Record<string, { bg: string; text: string; border: string }> = {
    success: {
      bg: `${colors.success}22`,
      text: colors.success,
      border: colors.success,
    },
    error: {
      bg: `${colors.error}22`,
      text: colors.error,
      border: colors.error,
    },
    warning: {
      bg: `${colors.warning}22`,
      text: colors.warning,
      border: colors.warning,
    },
    info: {
      bg: `${colors.info}22`,
      text: colors.info,
      border: colors.info,
    },
    default: {
      bg: colors.bgTertiary,
      text: colors.textSecondary,
      border: colors.border,
    },
  }

  const sizeStyles: Record<string, CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: fontSize.xs },
    md: { padding: '4px 12px', fontSize: fontSize.sm },
    lg: { padding: '6px 16px', fontSize: fontSize.md },
  }

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: variantColors[variant].bg,
    color: variantColors[variant].text,
    border: `1px solid ${variantColors[variant].border}`,
    borderRadius: radius.full,
    fontWeight: '500',
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
  }

  return <span style={badgeStyle}>{children}</span>
}
