import { useAccount } from 'wagmi'
import { Card } from '../common'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useUserVeNFTs } from '../../hooks/useVeNFT'
import { formatTokenAmount } from '../../utils/format'
import { TOKENS } from '../../constants/tokens'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import type { CSSProperties } from 'react'

export function Dashboard() {
  const { address, isConnected } = useAccount()

  // 查询余额
  const { balance: srtBalance } = useTokenBalance(TOKENS.SRT.address, address)
  const { balance: wsrtBalance } = useTokenBalance(TOKENS.WSRT.address, address)

  // 查询 ve-NFT
  const { balance: veNFTBalance } = useUserVeNFTs()

  const statCardStyle: CSSProperties = {
    padding: spacing.lg,
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
  }

  const statCards = [
    {
      icon: '💰',
      label: 'SRT 余额',
      value: srtBalance ? formatTokenAmount(srtBalance, 18, 4) : '-',
      unit: 'SRT',
    },
    {
      icon: '💎',
      label: 'WSRT 余额',
      value: wsrtBalance ? formatTokenAmount(wsrtBalance, 18, 4) : '-',
      unit: 'WSRT',
    },
    {
      icon: '🔒',
      label: 've-NFT 数量',
      value: veNFTBalance ? veNFTBalance.toString() : '0',
      unit: 'NFTs',
    },
    {
      icon: '🗳️',
      label: '投票权重',
      value: '-',
      unit: '',
    },
  ]

  if (!isConnected) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Card>
          <div
            style={{
              padding: spacing['2xl'],
              textAlign: 'center',
              color: colors.textSecondary,
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: spacing.lg }}>👛</div>
            <div style={{ fontSize: fontSize.xl, marginBottom: spacing.md }}>
              欢迎来到 ve(3,3) DEX
            </div>
            <div style={{ marginBottom: spacing.lg }}>
              请连接钱包以开始使用
            </div>
            <w3m-button />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 欢迎标题 */}
      <div style={{ marginBottom: spacing.lg }}>
        <h2
          style={{
            fontSize: fontSize['2xl'],
            fontWeight: '700',
            margin: 0,
            marginBottom: spacing.sm,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          仪表盘
        </h2>
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: fontSize.md }}>
          管理您的资产和参与治理
        </p>
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {statCards.map((card, index) => (
          <div key={index} style={statCardStyle}>
            <div style={{ fontSize: fontSize['2xl'], marginBottom: spacing.sm }}>
              {card.icon}
            </div>
            <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>
              {card.label}
            </div>
            <div style={{ fontSize: fontSize.xl, fontWeight: '600', color: colors.textPrimary }}>
              {card.value}
              {card.unit && (
                <span style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginLeft: spacing.xs }}>
                  {card.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <Card title="快速操作">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing.md,
          }}
        >
          <QuickAction
            icon="🔄"
            title="Swap"
            description="交换代币"
            href="#swap"
          />
          <QuickAction
            icon="💧"
            title="流动性"
            description="添加流动性"
            href="#liquidity"
          />
          <QuickAction
            icon="🔒"
            title="锁仓"
            description="创建 ve-NFT"
            href="#lock"
          />
          <QuickAction
            icon="🗳️"
            title="投票"
            description="参与治理投票"
            href="#vote"
          />
        </div>
      </Card>

      {/* 协议信息 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.bgSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
        }}
      >
        <h3 style={{ fontSize: fontSize.lg, fontWeight: '600', marginTop: 0, marginBottom: spacing.md }}>
          关于 ve(3,3)
        </h3>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: '1.6' }}>
          <p style={{ marginTop: 0 }}>
            ve(3,3) 是一个创新的去中心化交易所，结合了 Curve 的 ve tokenomics 和 Olympus DAO 的 (3,3) 博弈论设计。
          </p>
          <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
            <li>锁仓 SRT 获得投票权</li>
            <li>投票决定每周激励分配</li>
            <li>获得交易手续费和贿赂奖励</li>
            <li>反稀释机制保护锁仓者权益</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: string
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: spacing.md,
        backgroundColor: colors.bgPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        textDecoration: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgTertiary
        e.currentTarget.style.borderColor = colors.primary
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgPrimary
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      <div style={{ fontSize: fontSize['2xl'], marginBottom: spacing.sm }}>{icon}</div>
      <div style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
        {title}
      </div>
      <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{description}</div>
    </a>
  )
}
