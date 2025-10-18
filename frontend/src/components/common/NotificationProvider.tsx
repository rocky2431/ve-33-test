/**
 * Sonner 通知提供者组件
 * 现代化的 toast 通知系统
 */

import { Toaster } from 'sonner'
import { useColorMode } from '@chakra-ui/react'

export function NotificationProvider() {
  const { colorMode } = useColorMode()

  return (
    <Toaster
      position="top-right"
      theme={colorMode}
      richColors
      closeButton
      expand={false}
      duration={3000}
      toastOptions={{
        style: {
          background: colorMode === 'dark' ? '#1a202c' : '#ffffff',
          color: colorMode === 'dark' ? '#ffffff' : '#1a202c',
          border: colorMode === 'dark' ? '1px solid #2d3748' : '1px solid #e2e8f0',
        },
      }}
    />
  )
}
