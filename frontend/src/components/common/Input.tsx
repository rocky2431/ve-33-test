import type { CSSProperties, InputHTMLAttributes } from 'react'
import { colors, radius, spacing, fontSize, transition } from '../../constants/theme'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  leftElement,
  rightElement,
  style,
  ...props
}: InputProps) {
  const sizeStyles: Record<string, CSSProperties> = {
    sm: { padding: '8px 12px', fontSize: fontSize.sm },
    md: { padding: '12px 16px', fontSize: fontSize.md },
    lg: { padding: '16px 20px', fontSize: fontSize.lg },
  }

  const inputStyle: CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${error ? colors.error : colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    outline: 'none',
    transition: transition.normal,
    fontFamily: 'inherit',
    ...sizeStyles[size],
    ...(leftElement && { paddingLeft: '48px' }),
    ...(rightElement && { paddingRight: '48px' }),
    ...style,
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    width: fullWidth ? '100%' : 'auto',
  }

  return (
    <div style={containerStyle}>
      {label && (
        <label
          style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            fontWeight: '500',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {leftElement && (
          <div
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: colors.textTertiary,
            }}
          >
            {leftElement}
          </div>
        )}

        <input
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? colors.error : colors.primary
            e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? colors.error : colors.primary}22`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? colors.error : colors.border
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />

        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <span
          style={{
            fontSize: fontSize.xs,
            color: error ? colors.error : colors.textTertiary,
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  )
}
