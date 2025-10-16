/**
 * Loading 组件 - 基于 Chakra UI
 * 现代化的加载指示器，支持全屏模式和文本提示
 */

import { Spinner, VStack, Text, Box } from '@chakra-ui/react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
  const spinnerSizeMap = {
    sm: 'md',
    md: 'lg',
    lg: 'xl',
  } as const

  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="3px"
        speed="0.8s"
        emptyColor="gray.700"
        color="brand.500"
        size={spinnerSizeMap[size]}
      />
      {text && (
        <Text fontSize="md" color="gray.400">
          {text}
        </Text>
      )}
    </VStack>
  )

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={9999}
      >
        {content}
      </Box>
    )
  }

  return content
}
