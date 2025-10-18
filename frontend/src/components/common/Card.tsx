/**
 * Card 组件 - 基于 Chakra UI
 * 现代化的卡片容器，支持主题和暗色模式
 */

import { Box, Heading, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface CardProps extends BoxProps {
  children: ReactNode
  title?: string
  extra?: ReactNode
}

export function Card({ children, title, extra, ...boxProps }: CardProps) {
  return (
    <Box
      bg="gray.800"
      p={8}
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.700"
      boxShadow="md"
      transition="all 0.2s"
      _hover={{
        borderColor: 'gray.600',
        boxShadow: 'lg',
      }}
      {...boxProps}
    >
      {(title || extra) && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          {title && (
            <Heading
              as="h2"
              size="lg"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
            >
              {title}
            </Heading>
          )}
          {extra && <Box>{extra}</Box>}
        </Box>
      )}
      {children}
    </Box>
  )
}
