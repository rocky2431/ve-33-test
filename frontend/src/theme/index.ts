/**
 * Chakra UI 主题配置入口
 * 整合颜色、组件样式等配置
 */

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { colors } from './colors'
import { components } from './components'

// 主题配置
const config: ThemeConfig = {
  initialColorMode: 'light',  // 默认亮色主题
  useSystemColorMode: true,   // 使用系统主题设置
}

// 全局样式
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
    // 滚动条样式
    '*::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '*::-webkit-scrollbar-track': {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
    '*::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
      borderRadius: 'full',
    },
    '*::-webkit-scrollbar-thumb:hover': {
      bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },
  }),
}

// 字体配置
const fonts = {
  heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  mono: `"SF Mono", "Roboto Mono", Menlo, Monaco, Consolas, monospace`,
}

// 断点配置（响应式）
const breakpoints = {
  base: '0px',    // 0px+
  sm: '480px',    // 480px+
  md: '768px',    // 768px+
  lg: '992px',    // 992px+
  xl: '1280px',   // 1280px+
  '2xl': '1536px', // 1536px+
}

// 阴影配置
const shadows = {
  outline: '0 0 0 3px rgba(46, 127, 215, 0.6)',
  'outline-dark': '0 0 0 3px rgba(46, 127, 215, 0.4)',
}

// 导出主题
export const theme = extendTheme({
  config,
  colors,
  components,
  styles,
  fonts,
  breakpoints,
  shadows,
})
