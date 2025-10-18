/**
 * PageContainer 组件 - 页面容器
 * 统一的页面布局容器，支持动画和响应式
 */

import { Container, Box, type ContainerProps } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageContainerProps extends ContainerProps {
  children: ReactNode
  animate?: boolean
}

const MotionBox = motion(Box)

export function PageContainer({ children, animate = true, ...containerProps }: PageContainerProps) {
  const content = (
    <Container
      maxW="container.xl"
      py={8}
      px={{ base: 4, md: 6 }}
      minH="calc(100vh - 80px - 60px)" // 100vh - header - footer
      {...containerProps}
    >
      {children}
    </Container>
  )

  if (!animate) {
    return content
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      {content}
    </MotionBox>
  )
}
