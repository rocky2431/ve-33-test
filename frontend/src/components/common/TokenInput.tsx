/**
 * TokenInput 组件 - DeFi 专用代币输入框
 * 功能：代币选择、金额输入、余额显示、最大按钮
 */

import {
  Box,
  Flex,
  Input,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Skeleton,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon } from '@chakra-ui/icons'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
  token?: Token
  onTokenSelect?: () => void
  balance?: string
  balanceLoading?: boolean
  showMaxButton?: boolean
  disabled?: boolean
  label?: string
  usdValue?: string
}

export function TokenInput({
  value,
  onChange,
  token,
  onTokenSelect,
  balance,
  balanceLoading = false,
  showMaxButton = true,
  disabled = false,
  label,
  usdValue,
}: TokenInputProps) {
  const { t } = useTranslation()

  const handleMaxClick = () => {
    if (balance) {
      onChange(balance)
    }
  }

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="xl"
      p={4}
      _hover={{
        borderColor: 'gray.600',
      }}
      _focusWithin={{
        borderColor: 'brand.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
      }}
    >
      {/* 标签和余额行 */}
      {(label || balance !== undefined) && (
        <Flex justify="space-between" align="center" mb={2}>
          {label && (
            <Text fontSize="sm" color="gray.400" fontWeight="medium">
              {label}
            </Text>
          )}
          {balance !== undefined && (
            <HStack spacing={1}>
              {balanceLoading ? (
                <Skeleton height="16px" width="80px" />
              ) : (
                <>
                  <Text fontSize="sm" color="gray.500">
                    {t('common.balance')}:
                  </Text>
                  <Text fontSize="sm" color="gray.300" fontWeight="medium">
                    {balance}
                  </Text>
                  {showMaxButton && balance && parseFloat(balance) > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="brand"
                      onClick={handleMaxClick}
                      ml={1}
                    >
                      MAX
                    </Button>
                  )}
                </>
              )}
            </HStack>
          )}
        </Flex>
      )}

      {/* 主输入区域 */}
      <Flex align="center" gap={3}>
        {/* 代币选择器 */}
        <Button
          onClick={onTokenSelect}
          isDisabled={!onTokenSelect || disabled}
          variant="ghost"
          colorScheme="gray"
          size="lg"
          px={3}
          rightIcon={onTokenSelect ? <ChevronDownIcon /> : undefined}
          _hover={{
            bg: onTokenSelect ? 'gray.700' : 'transparent',
          }}
        >
          <HStack spacing={2}>
            {token?.logoURI && (
              <Image
                src={token.logoURI}
                alt={token.symbol}
                boxSize="24px"
                borderRadius="full"
                fallback={
                  <Box
                    boxSize="24px"
                    borderRadius="full"
                    bg="gray.700"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="xs" color="gray.400">
                      {token.symbol.charAt(0)}
                    </Text>
                  </Box>
                }
              />
            )}
            <Text fontWeight="semibold" fontSize="md">
              {token?.symbol || t('common.selectToken')}
            </Text>
          </HStack>
        </Button>

        {/* 金额输入框 */}
        <VStack flex={1} align="flex-end" spacing={1}>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.0"
            type="number"
            isDisabled={disabled || !token}
            variant="unstyled"
            fontSize="2xl"
            fontWeight="semibold"
            textAlign="right"
            color="white"
            _placeholder={{
              color: 'gray.600',
            }}
          />
          {usdValue && (
            <Text fontSize="sm" color="gray.500">
              ≈ ${usdValue}
            </Text>
          )}
        </VStack>
      </Flex>
    </Box>
  )
}
