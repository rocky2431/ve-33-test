/**
 * 通知状态管理 Store
 * 管理应用内的所有通知消息
 */

import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number // 0 表示不自动关闭
  timestamp: number
}

interface NotificationState {
  notifications: Notification[]

  // Actions
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => string

  removeNotification: (id: string) => void

  clearAll: () => void

  // 便捷方法
  success: (title: string, message?: string, duration?: number) => string
  error: (title: string, message?: string, duration?: number) => string
  warning: (title: string, message?: string, duration?: number) => string
  info: (title: string, message?: string, duration?: number) => string
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, title, message, duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, notification],
    }))

    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, duration)
    }

    return id
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  // 便捷方法
  success: (title, message, duration) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type: 'success',
          title,
          message,
          duration: duration ?? 3000,
          timestamp: Date.now(),
        },
      ],
    }))

    if ((duration ?? 3000) > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, duration ?? 3000)
    }

    return id
  },

  error: (title, message, duration) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type: 'error',
          title,
          message,
          duration: duration ?? 5000, // 错误消息显示更长时间
          timestamp: Date.now(),
        },
      ],
    }))

    if ((duration ?? 5000) > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, duration ?? 5000)
    }

    return id
  },

  warning: (title, message, duration) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type: 'warning',
          title,
          message,
          duration: duration ?? 4000,
          timestamp: Date.now(),
        },
      ],
    }))

    if ((duration ?? 4000) > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, duration ?? 4000)
    }

    return id
  },

  info: (title, message, duration) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type: 'info',
          title,
          message,
          duration: duration ?? 3000,
          timestamp: Date.now(),
        },
      ],
    }))

    if ((duration ?? 3000) > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      }, duration ?? 3000)
    }

    return id
  },
}))

// 便捷的全局通知函数
export const notify = {
  success: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().success(title, message, duration),

  error: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().error(title, message, duration),

  warning: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().warning(title, message, duration),

  info: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().info(title, message, duration),
}
