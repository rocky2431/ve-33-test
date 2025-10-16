import type { CSSProperties } from 'react'
import { colors, fontSize } from '../../constants/theme'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const sizeMap = {
    sm: 20,
    md: 40,
    lg: 60,
  }

  const spinnerSize = sizeMap[size]

  const spinnerStyle: CSSProperties = {
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`,
    border: `3px solid ${colors.border}`,
    borderTop: `3px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    ...(fullScreen && {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
    }),
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={containerStyle}>
        <div style={spinnerStyle} />
        {text && (
          <p
            style={{
              margin: 0,
              fontSize: fontSize.md,
              color: colors.textSecondary,
            }}
          >
            {text}
          </p>
        )}
      </div>
    </>
  )
}
