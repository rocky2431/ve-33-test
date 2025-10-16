import type { CSSProperties } from 'react'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import { useResponsive } from '../../hooks/useResponsive'

export type Page = 'swap' | 'liquidity' | 'lock' | 'vote' | 'rewards' | 'dashboard'

interface HeaderProps {
  currentPage?: Page
  onPageChange?: (page: Page) => void
}

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const { isMobile } = useResponsive()

  const headerStyle: CSSProperties = {
    backgroundColor: colors.bgSecondary,
    borderBottom: `1px solid ${colors.border}`,
    padding: isMobile ? spacing.md : spacing.lg,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }

  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  }

  const logoStyle: CSSProperties = {
    fontSize: isMobile ? fontSize.xl : fontSize['3xl'],
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    cursor: 'pointer',
  }

  const navStyle: CSSProperties = {
    display: isMobile ? 'none' : 'flex',
    gap: spacing.sm,
  }

  const navItems: { key: Page; label: string }[] = [
    { key: 'dashboard', label: '仪表盘' },
    { key: 'swap', label: 'Swap' },
    { key: 'liquidity', label: '流动性' },
    { key: 'lock', label: '锁仓' },
    { key: 'vote', label: '投票' },
    { key: 'rewards', label: '奖励' },
  ]

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <h1 style={logoStyle} onClick={() => onPageChange?.('dashboard')}>
          ve(3,3) DEX
        </h1>

        {/* 桌面导航 */}
        <nav style={navStyle}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onPageChange?.(item.key)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                fontSize: fontSize.md,
                fontWeight: '500',
                backgroundColor:
                  currentPage === item.key ? colors.primary : 'transparent',
                color: currentPage === item.key ? colors.textPrimary : colors.textSecondary,
                border: currentPage === item.key ? 'none' : `1px solid ${colors.border}`,
                borderRadius: radius.md,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.key) {
                  e.currentTarget.style.backgroundColor = colors.bgTertiary
                  e.currentTarget.style.color = colors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.key) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colors.textSecondary
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* 钱包连接按钮 */}
        <w3m-button />
      </div>
    </header>
  )
}
