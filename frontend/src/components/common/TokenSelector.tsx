/**
 * TokenSelector 组件 - 代币选择器模态框
 * 功能：搜索代币、显示代币列表、显示余额
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Flex,
  Skeleton,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from 'react'
import type { Token } from './TokenInput'

interface TokenWithBalance extends Token {
  balance?: string
  balanceUSD?: string
}

interface TokenSelectorProps {
  isOpen: boolean
  onClose: () => void
  tokens: TokenWithBalance[]
  onSelect: (token: TokenWithBalance) => void
  loading?: boolean
}

export function TokenSelector({
  isOpen,
  onClose,
  tokens,
  onSelect,
  loading = false,
}: TokenSelectorProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤代币列表
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens

    const query = searchQuery.toLowerCase()
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    )
  }, [tokens, searchQuery])

  const handleSelect = (token: TokenWithBalance) => {
    onSelect(token)
    onClose()
    setSearchQuery('') // 清空搜索
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent
        bg="gray.800"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="2xl"
        maxH="600px"
      >
        <ModalHeader
          fontSize="xl"
          fontWeight="semibold"
          color="white"
          borderBottom="1px solid"
          borderColor="gray.700"
          pb={4}
        >
          {t('common.selectToken')}
        </ModalHeader>

        <ModalCloseButton
          color="gray.400"
          _hover={{
            bg: 'gray.700',
            color: 'white',
          }}
        />

        <ModalBody p={4}>
          {/* 搜索框 */}
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder={t('common.searchToken')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="gray.900"
              border="1px solid"
              borderColor="gray.700"
              _hover={{
                borderColor: 'gray.600',
              }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
              }}
            />
          </InputGroup>

          {/* 代币列表 */}
          <VStack
            spacing={0}
            align="stretch"
            maxH="400px"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.700',
                borderRadius: 'full',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'gray.600',
              },
            }}
          >
            {loading ? (
              // 加载骨架屏
              Array.from({ length: 5 }).map((_, i) => (
                <HStack key={i} p={3} spacing={3}>
                  <Skeleton boxSize="40px" borderRadius="full" />
                  <VStack flex={1} align="flex-start" spacing={1}>
                    <Skeleton height="16px" width="80px" />
                    <Skeleton height="14px" width="120px" />
                  </VStack>
                  <Skeleton height="16px" width="60px" />
                </HStack>
              ))
            ) : filteredTokens.length === 0 ? (
              // 空状态
              <Box py={8} textAlign="center">
                <Text color="gray.500">{t('common.noTokensFound')}</Text>
              </Box>
            ) : (
              // 代币列表
              filteredTokens.map((token) => (
                <Flex
                  key={token.address}
                  p={3}
                  align="center"
                  gap={3}
                  cursor="pointer"
                  borderRadius="lg"
                  transition="all 0.15s"
                  _hover={{
                    bg: 'gray.700',
                  }}
                  onClick={() => handleSelect(token)}
                >
                  {/* 代币图标 */}
                  <Image
                    src={token.logoURI}
                    alt={token.symbol}
                    boxSize="40px"
                    borderRadius="full"
                    fallback={
                      <Box
                        boxSize="40px"
                        borderRadius="full"
                        bg="gray.700"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="sm" color="gray.400" fontWeight="bold">
                          {token.symbol.charAt(0)}
                        </Text>
                      </Box>
                    }
                  />

                  {/* 代币信息 */}
                  <VStack flex={1} align="flex-start" spacing={0}>
                    <Text fontWeight="semibold" color="white">
                      {token.symbol}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {token.name}
                    </Text>
                  </VStack>

                  {/* 余额 */}
                  {token.balance !== undefined && (
                    <VStack align="flex-end" spacing={0}>
                      <Text fontWeight="medium" color="white">
                        {token.balance}
                      </Text>
                      {token.balanceUSD && (
                        <Text fontSize="sm" color="gray.500">
                          ${token.balanceUSD}
                        </Text>
                      )}
                    </VStack>
                  )}
                </Flex>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
