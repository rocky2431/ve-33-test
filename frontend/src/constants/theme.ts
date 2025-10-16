// 设计系统主题配置

export const colors = {
  // 主色
  primary: '#667eea',
  primaryDark: '#5568d3',
  primaryLight: '#7e92ff',

  // 背景
  bgPrimary: '#0a0a0a',
  bgSecondary: '#1a1a1a',
  bgTertiary: '#2a2a2a',

  // 文字
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textTertiary: '#666666',

  // 边框
  border: '#333333',
  borderLight: '#444444',

  // 状态色
  success: '#4ade80',
  error: '#ef4444',
  warning: '#fbbf24',
  info: '#3b82f6',
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
} as const

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
} as const

// 响应式断点工具
export const mediaQuery = {
  mobile: `@media (max-width: ${breakpoints.mobile - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.tablet}px)`,
} as const

// 字体大小
export const fontSize = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
} as const

// 阴影
export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const

// 过渡动画
export const transition = {
  fast: '0.1s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const
