/**
 * 全局通知工具函数
 * 基于 Sonner 的便捷通知方法
 */

import { toast } from 'sonner'

/**
 * 成功通知
 */
export const notifySuccess = (message: string, description?: string) => {
  return toast.success(message, {
    description,
  })
}

/**
 * 错误通知
 */
export const notifyError = (message: string, description?: string) => {
  return toast.error(message, {
    description,
    duration: 5000, // 错误消息显示更长时间
  })
}

/**
 * 警告通知
 */
export const notifyWarning = (message: string, description?: string) => {
  return toast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * 信息通知
 */
export const notifyInfo = (message: string, description?: string) => {
  return toast.info(message, {
    description,
  })
}

/**
 * 加载通知
 */
export const notifyLoading = (message: string) => {
  return toast.loading(message)
}

/**
 * Promise 通知 (自动处理加载、成功、失败状态)
 */
export const notifyPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) => {
  return toast.promise(promise, messages)
}

/**
 * 交易通知辅助函数
 */
export const notifyTransaction = {
  /**
   * 交易已提交
   */
  submitted: (txHash: string) => {
    return notifyInfo('交易已提交', `交易哈希: ${txHash.slice(0, 10)}...`)
  },

  /**
   * 交易确认中
   */
  confirming: (txHash: string) => {
    return notifyLoading(`等待交易确认... ${txHash.slice(0, 10)}...`)
  },

  /**
   * 交易成功
   */
  success: (message: string, txHash?: string) => {
    return notifySuccess(
      message,
      txHash ? `交易哈希: ${txHash.slice(0, 10)}...` : undefined
    )
  },

  /**
   * 交易失败
   */
  failed: (error: string) => {
    return notifyError('交易失败', error)
  },

  /**
   * 用户拒绝交易
   */
  rejected: () => {
    return notifyWarning('交易已拒绝', '用户取消了交易')
  },
}

/**
 * 授权通知辅助函数
 */
export const notifyApproval = {
  /**
   * 授权进行中
   */
  pending: (tokenSymbol: string) => {
    return notifyLoading(`正在授权 ${tokenSymbol}...`)
  },

  /**
   * 授权成功
   */
  success: (tokenSymbol: string) => {
    return notifySuccess(`${tokenSymbol} 授权成功`)
  },

  /**
   * 授权失败
   */
  failed: (tokenSymbol: string, error: string) => {
    return notifyError(`${tokenSymbol} 授权失败`, error)
  },
}

/**
 * 复制通知
 */
export const notifyCopied = (text: string = '已复制到剪贴板') => {
  return notifySuccess(text)
}

/**
 * 网络错误通知
 */
export const notifyNetworkError = (message: string = '网络连接失败') => {
  return notifyError(message, '请检查您的网络连接')
}

/**
 * 钱包未连接通知
 */
export const notifyWalletNotConnected = () => {
  return notifyWarning('请先连接钱包')
}

/**
 * 余额不足通知
 */
export const notifyInsufficientBalance = (tokenSymbol: string) => {
  return notifyError('余额不足', `您的 ${tokenSymbol} 余额不足`)
}
