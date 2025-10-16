/**
 * Footer 组件 - 页脚
 * 简洁的应用页脚，显示版权和链接
 */

import {
  Box,
  Container,
  Flex,
  Text,
  HStack,
  Link,
  useColorModeValue,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'

export function Footer() {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')

  const currentYear = new Date().getFullYear()

  return (
    <Box
      as="footer"
      bg={bgColor}
      borderTop="1px solid"
      borderColor={borderColor}
      py={6}
      mt="auto"
    >
      <Container maxW="container.xl">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          gap={4}
        >
          {/* 版权信息 */}
          <Text fontSize="sm" color={textColor}>
            © {currentYear} ve(3,3) DEX. All rights reserved.
          </Text>

          {/* 链接 */}
          <HStack spacing={6}>
            <Link
              href="https://docs.ve33.com"
              isExternal
              fontSize="sm"
              color={textColor}
              _hover={{
                color: 'brand.500',
                textDecoration: 'none',
              }}
              transition="color 0.2s"
            >
              Docs <ExternalLinkIcon mx="2px" />
            </Link>
            <Link
              href="https://github.com/ve33"
              isExternal
              fontSize="sm"
              color={textColor}
              _hover={{
                color: 'brand.500',
                textDecoration: 'none',
              }}
              transition="color 0.2s"
            >
              GitHub <ExternalLinkIcon mx="2px" />
            </Link>
            <Link
              href="https://twitter.com/ve33dex"
              isExternal
              fontSize="sm"
              color={textColor}
              _hover={{
                color: 'brand.500',
                textDecoration: 'none',
              }}
              transition="color 0.2s"
            >
              Twitter <ExternalLinkIcon mx="2px" />
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
