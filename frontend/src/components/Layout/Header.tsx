/**
 * Header 组件 - 顶部导航栏
 * 现代化的应用头部，集成钱包连接、主题切换、语言切换
 */

import {
  Box,
  Flex,
  HStack,
  Heading,
  Button,
  Container,
  useColorModeValue,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../common/LanguageSwitcher'
import { ThemeToggle } from '../common/ThemeToggle'

export type Page = 'dashboard' | 'swap' | 'liquidity' | 'farms' | 'lock' | 'vote' | 'rewards'

interface HeaderProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const pages: Page[] = ['dashboard', 'swap', 'liquidity', 'farms', 'lock', 'vote', 'rewards']

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const { t } = useTranslation()

  // 主题颜色
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeBg = useColorModeValue('brand.500', 'brand.500')
  const activeColor = useColorModeValue('white', 'white')
  const inactiveColor = useColorModeValue('gray.600', 'gray.400')
  const inactiveBorder = useColorModeValue('gray.300', 'gray.700')

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
      backdropFilter="blur(10px)"
      boxShadow="sm"
    >
      <Container maxW="container.xl" py={4}>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Heading
            as="h1"
            size="lg"
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
            cursor="pointer"
            onClick={() => onPageChange('dashboard')}
            transition="all 0.2s"
            _hover={{
              transform: 'scale(1.05)',
            }}
          >
            ve(3,3) DEX
          </Heading>

          {/* 导航菜单 */}
          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? 'solid' : 'ghost'}
                colorScheme={currentPage === page ? 'brand' : 'gray'}
                size="md"
                fontWeight="medium"
                borderRadius="lg"
                border={currentPage === page ? 'none' : '1px solid'}
                borderColor={currentPage === page ? 'transparent' : inactiveBorder}
                bg={currentPage === page ? activeBg : 'transparent'}
                color={currentPage === page ? activeColor : inactiveColor}
                _hover={{
                  bg: currentPage === page ? activeBg : useColorModeValue('gray.100', 'gray.800'),
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.2s"
              >
                {t(`nav.${page}`)}
              </Button>
            ))}
          </HStack>

          {/* 右侧工具栏 */}
          <HStack spacing={3}>
            <ThemeToggle />
            <LanguageSwitcher />
            <w3m-button />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
