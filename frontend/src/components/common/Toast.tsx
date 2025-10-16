import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { colors, radius, spacing, fontSize, shadow, transition } from '../../constants/theme'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

function ToastItem({ message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 入场动画
    setTimeout(() => setIsVisible(true), 10)

    // 自动关闭
    if (message.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, message.duration || 3000)
      return () => clearTimeout(timer)
    }
  }, [message.duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(message.id), 300)
  }

  const typeConfig: Record<ToastType, { icon: string; color: string; bg: string }> = {
    success: { icon: '✅', color: colors.success, bg: `${colors.success}22` },
    error: { icon: '❌', color: colors.error, bg: `${colors.error}22` },
    warning: { icon: '⚠️', color: colors.warning, bg: `${colors.warning}22` },
    info: { icon: 'ℹ️', color: colors.info, bg: `${colors.info}22` },
  }

  const config = typeConfig[message.type]

  const toastStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${config.color}`,
    borderRadius: radius.md,
    boxShadow: shadow.lg,
    minWidth: '300px',
    maxWidth: '500px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
    transition: `all ${transition.normal}`,
  }

  return (
    <div style={toastStyle}>
      <div
        style={{
          fontSize: fontSize.lg,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {config.icon}
      </div>
      <div style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }}>
        {message.message}
      </div>
      <button
        onClick={handleClose}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: radius.sm,
          backgroundColor: 'transparent',
          border: 'none',
          color: colors.textSecondary,
          cursor: 'pointer',
          fontSize: fontSize.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: transition.fast,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.bgTertiary
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        ✕
      </button>
    </div>
  )
}

interface ToastContainerProps {
  messages: ToastMessage[]
  onClose: (id: string) => void
}

export function ToastContainer({ messages, onClose }: ToastContainerProps) {
  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    pointerEvents: 'none',
  }

  return (
    <div style={containerStyle}>
      {messages.map((msg) => (
        <div key={msg.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem message={msg} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}

// Toast 管理 Hook
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(7)
    setMessages((prev) => [...prev, { id, type, message, duration }])
  }

  const closeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  return {
    messages,
    showToast,
    closeToast,
    success: (msg: string, duration?: number) => showToast('success', msg, duration),
    error: (msg: string, duration?: number) => showToast('error', msg, duration),
    warning: (msg: string, duration?: number) => showToast('warning', msg, duration),
    info: (msg: string, duration?: number) => showToast('info', msg, duration),
  }
}
