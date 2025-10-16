import type { CSSProperties } from 'react'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Page } from './Header'

interface MobileNavProps {
  currentPage?: Page
  onPageChange?: (page: Page) => void
}

export function MobileNav({ currentPage, onPageChange }: MobileNavProps) {
  const navItems: { key: Page; label: string; icon: string }[] = [
    { key: 'dashboard', label: '首页', icon: '📊' },
    { key: 'swap', label: 'Swap', icon: '🔄' },
    { key: 'liquidity', label: '流动性', icon: '💧' },
    { key: 'lock', label: '锁仓', icon: '🔒' },
    { key: 'vote', label: '投票', icon: '🗳️' },
  ]

  const navStyle: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgSecondary,
    borderTop: `1px solid ${colors.border}`,
    display: 'grid',
    gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
    zIndex: 100,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
  }

  const itemStyle = (isActive: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.sm} ${spacing.xs}`,
    gap: '4px',
    backgroundColor: isActive ? colors.bgTertiary : 'transparent',
    color: isActive ? colors.primary : colors.textSecondary,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '64px', // 确保足够的触摸区域
  })

  return (
    <nav style={navStyle}>
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => onPageChange?.(item.key)}
          style={itemStyle(currentPage === item.key)}
        >
          <span style={{ fontSize: fontSize.xl }}>{item.icon}</span>
          <span style={{ fontSize: fontSize.xs, fontWeight: '500' }}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
