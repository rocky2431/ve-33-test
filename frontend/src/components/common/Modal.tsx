import { useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { colors, radius, spacing, fontSize, shadow, transition } from '../../constants/theme'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  showCloseButton = true,
}: ModalProps) {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  }

  const modalStyle: CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: shadow.xl,
    animation: 'slideUp 0.3s ease',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  }

  const bodyStyle: CSSProperties = {
    padding: spacing.lg,
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          {(title || showCloseButton) && (
            <div style={headerStyle}>
              {title && (
                <h2
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: radius.md,
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: fontSize.lg,
                    transition: transition.normal,
                    marginLeft: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgTertiary
                    e.currentTarget.style.color = colors.textPrimary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.textSecondary
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div style={bodyStyle}>{children}</div>
        </div>
      </div>
    </>
  )
}
