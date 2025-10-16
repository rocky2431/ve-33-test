import type { CSSProperties} from 'react'
import type { ReactNode } from 'react'
import { colors, spacing } from '../../constants/theme'
import { useResponsive } from '../../hooks/useResponsive'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isMobile } = useResponsive()

  const layoutStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingBottom: isMobile ? '80px' : '0', // 为移动端底部导航留空间
  }

  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.lg,
  }

  return (
    <div style={layoutStyle}>
      <Header />
      <main style={containerStyle}>{children}</main>
      {isMobile && <MobileNav />}
    </div>
  )
}
