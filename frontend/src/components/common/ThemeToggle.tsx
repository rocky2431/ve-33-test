/**
 * 主题切换组件
 * 支持亮色和暗色主题切换
 */

import { IconButton, useColorMode, Tooltip } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Tooltip label={colorMode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}>
      <IconButton
        aria-label="Toggle theme"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={toggleColorMode}
        size="sm"
        variant="ghost"
      />
    </Tooltip>
  )
}
