/**
 * Modal 组件 - 基于 Chakra UI
 * 功能完整的模态框，支持 ESC 关闭、背景滚动阻止和动画
 */

import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  type ModalProps as ChakraModalProps,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
  showCloseButton?: boolean
  size?: ChakraModalProps['size']
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  showCloseButton = true,
  size,
}: ModalProps) {
  return (
    <ChakraModal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />

      <ModalContent
        bg="gray.800"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="2xl"
        boxShadow="2xl"
        maxW={maxWidth}
      >
        {title && (
          <ModalHeader
            fontSize="xl"
            fontWeight="semibold"
            color="white"
            borderBottom="1px solid"
            borderColor="gray.700"
            pb={4}
          >
            {title}
          </ModalHeader>
        )}

        {showCloseButton && (
          <ModalCloseButton
            color="gray.400"
            _hover={{
              bg: 'gray.700',
              color: 'white',
            }}
          />
        )}

        <ModalBody p={6}>{children}</ModalBody>
      </ModalContent>
    </ChakraModal>
  )
}
