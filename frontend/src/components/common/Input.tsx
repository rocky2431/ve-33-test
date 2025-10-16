/**
 * Input 组件 - 基于 Chakra UI
 * 功能完整的表单输入组件，支持 label、error、helper 和附加元素
 */

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  type InputProps as ChakraInputProps,
} from '@chakra-ui/react'
import type { ReactNode, InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  leftElement?: ReactNode
  rightElement?: ReactNode
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  size = 'md',
  leftElement,
  rightElement,
  ...inputProps
}: InputProps) {
  return (
    <FormControl isInvalid={!!error} w={fullWidth ? 'full' : 'auto'}>
      {label && (
        <FormLabel fontSize="sm" color="gray.400" fontWeight="medium">
          {label}
        </FormLabel>
      )}

      <InputGroup size={size}>
        {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}

        <ChakraInput
          bg="gray.800"
          border="1px solid"
          borderColor={error ? 'red.500' : 'gray.700'}
          color="white"
          borderRadius="lg"
          _hover={{
            borderColor: error ? 'red.400' : 'gray.600',
          }}
          _focus={{
            borderColor: error ? 'red.400' : 'brand.500',
            boxShadow: error ? '0 0 0 1px var(--chakra-colors-red-400)' : '0 0 0 1px var(--chakra-colors-brand-500)',
          }}
          _placeholder={{
            color: 'gray.500',
          }}
          {...(inputProps as ChakraInputProps)}
        />

        {rightElement && <InputRightElement>{rightElement}</InputRightElement>}
      </InputGroup>

      {error && (
        <FormErrorMessage fontSize="xs" mt={1}>
          {error}
        </FormErrorMessage>
      )}

      {!error && helperText && (
        <FormHelperText fontSize="xs" color="gray.500" mt={1}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}
