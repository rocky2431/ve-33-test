import type { CSSProperties, ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  style?: CSSProperties
}

export function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = 'primary',
  fullWidth,
  style,
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
  }

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#1a1a1a',
      color: '#fff',
      border: '1px solid #333',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#667eea',
      border: '2px solid #667eea',
    },
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      onMouseOver={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)'
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {loading ? '处理中...' : children}
    </button>
  )
}
