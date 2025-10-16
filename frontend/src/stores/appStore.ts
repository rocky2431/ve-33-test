/**
 * 应用全局状态管理 Store
 * 使用 Zustand 进行轻量级状态管理
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 滑点容忍度预设值
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 2.0] as const

// 交易截止时间预设值 (分钟)
export const DEADLINE_PRESETS = [10, 20, 30, 60] as const

interface AppState {
  // 交易设置
  slippageTolerance: number // 滑点容忍度 (%)
  transactionDeadline: number // 交易截止时间 (分钟)
  expertMode: boolean // 专家模式

  // UI 设置
  showTransactionDetails: boolean // 显示交易详情

  // Actions
  setSlippageTolerance: (value: number) => void
  setTransactionDeadline: (value: number) => void
  setExpertMode: (value: boolean) => void
  setShowTransactionDetails: (value: boolean) => void

  // 重置为默认值
  resetSettings: () => void
}

// 默认值
const defaultState = {
  slippageTolerance: 0.5,
  transactionDeadline: 20,
  expertMode: false,
  showTransactionDetails: true,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...defaultState,

      setSlippageTolerance: (value: number) => {
        // 验证滑点范围 (0.01% - 50%)
        const validValue = Math.max(0.01, Math.min(50, value))
        set({ slippageTolerance: validValue })
      },

      setTransactionDeadline: (value: number) => {
        // 验证截止时间范围 (1 - 180 分钟)
        const validValue = Math.max(1, Math.min(180, value))
        set({ transactionDeadline: validValue })
      },

      setExpertMode: (value: boolean) => set({ expertMode: value }),

      setShowTransactionDetails: (value: boolean) =>
        set({ showTransactionDetails: value }),

      resetSettings: () => set(defaultState),
    }),
    {
      name: 'app-settings', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // 只持久化特定字段
      partialize: (state) => ({
        slippageTolerance: state.slippageTolerance,
        transactionDeadline: state.transactionDeadline,
        expertMode: state.expertMode,
        showTransactionDetails: state.showTransactionDetails,
      }),
    }
  )
)

// 便捷的 hooks
export const useSlippageTolerance = () =>
  useAppStore((state) => state.slippageTolerance)

export const useTransactionDeadline = () =>
  useAppStore((state) => state.transactionDeadline)

export const useExpertMode = () =>
  useAppStore((state) => state.expertMode)
