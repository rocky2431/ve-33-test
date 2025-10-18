import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, type Column } from '../common'
import { useUserLiquidityPositions, type LiquidityPosition } from '../../hooks/useUserLiquidityPositions'
import { useLiquidityTab } from './index'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'

export function MyLiquidity() {
  const { isConnected } = useAccount()
  const { positions, isLoading, error, refetch } = useUserLiquidityPositions()
  const { switchToTab } = useLiquidityTab()

  // 计算总价值（简化版，实际需要价格预言机）
  const calculateValue = (position: LiquidityPosition): string => {
    // 计算用户拥有的储备量
    if (position.totalSupply === 0n) return '0'

    const userReserve0 = (position.reserve0 * position.lpBalance) / position.totalSupply
    const userReserve1 = (position.reserve1 * position.lpBalance) / position.totalSupply

    // 这里简化处理，实际需要价格预言机
    // 暂时返回储备量信息
    return `${formatTokenAmount(userReserve0, 18, 2)} / ${formatTokenAmount(userReserve1, 18, 2)}`
  }

  const columns: Column<LiquidityPosition>[] = [
    {
      key: 'pool',
      title: '流动性池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {record.token0Symbol || record.token0.slice(0, 6)} / {record.token1Symbol || record.token1.slice(0, 6)}
          </div>
          <Badge variant={record.stable ? 'info' : 'default'}>
            {record.stable ? '稳定币池' : '波动性池'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'lpBalance',
      title: 'LP TOKEN',
      render: (_, record) => formatTokenAmount(record.lpBalance, 18, 6),
    },
    {
      key: 'share',
      title: '池份额',
      render: (_, record) => `${record.sharePercentage.toFixed(2)}%`,
    },
    {
      key: 'value',
      title: '价值 (USD)',
      render: (_, record) => calculateValue(record),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: () => (
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => switchToTab('add')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            添加
          </Button>
          <Button
            variant="secondary"
            onClick={() => switchToTab('remove')}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            移除
          </Button>
        </div>
      ),
    },
  ]

  if (!isConnected) {
    return (
      <Card title="我的流动性">
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>
            👛
          </div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card title="我的流动性">
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>
            ⏳
          </div>
          <div>正在加载您的流动性位置...</div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title="我的流动性">
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.error,
          }}
        >
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>
            ❌
          </div>
          <div style={{ marginBottom: spacing.md }}>加载失败: {error.message}</div>
          <Button onClick={refetch}>重试</Button>
        </div>
      </Card>
    )
  }

  if (positions.length === 0) {
    return (
      <Card title="我的流动性">
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>
            💧
          </div>
          <div style={{ marginBottom: spacing.md }}>您还没有提供流动性</div>
          <Button onClick={() => switchToTab('add')}>
            添加流动性
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="我的流动性"
      extra={
        <Button
          variant="secondary"
          onClick={refetch}
          style={{ padding: '6px 12px', fontSize: fontSize.sm }}
        >
          🔄 刷新
        </Button>
      }
    >
      {/* 总览卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            流动性池数量
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {positions.length}
          </div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            总价值 (USD)
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            -
          </div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            累计手续费收益
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            -
          </div>
        </div>
      </div>

      {/* 持仓列表 */}
      <Table
        columns={columns}
        data={positions}
        rowKey={(record) => record.pairAddress}
        onRowClick={() => {
          // 选择位置
        }}
      />

      {/* 流动性收益说明 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: `${colors.success}11`,
          border: `1px solid ${colors.success}33`,
          borderRadius: '8px',
          marginBottom: spacing.md,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.success, fontSize: fontSize.md }}>
          💰 流动性提供者收益来源
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 1.8 }}>
          <div style={{ marginBottom: spacing.sm }}>
            <strong style={{ color: colors.textPrimary }}>1. 交易手续费分成 (Trading Fees)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 您提供的流动性池每笔交易收取 0.3% 手续费
              <br />
              • 手续费按您的池份额比例自动分配
              <br />
              • 手续费直接累积在 LP Token 价值中，无需手动领取
            </div>
          </div>
          <div style={{ marginBottom: spacing.sm }}>
            <strong style={{ color: colors.textPrimary }}>2. SRT 排放奖励 (Emission Rewards)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 获得投票的池子将获得 SRT 代币排放
              <br />
              • 排放量取决于该池获得的投票权重
              <br />
              • 需要将 LP Token 质押到 Gauge 才能领取排放奖励
            </div>
          </div>
          <div>
            <strong style={{ color: colors.textPrimary }}>3. 复利增长 (Compounding)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 交易手续费自动复投到流动性池
              <br />
              • LP Token 价值随着手续费累积不断增长
              <br />
              • 无需额外操作即可享受复利效应
            </div>
          </div>
        </div>
      </div>

      {/* 风险提示 */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
          fontSize: fontSize.sm,
          color: colors.textSecondary,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.warning }}>
          ⚠️ 风险提示
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg, lineHeight: 1.8 }}>
          <li>
            <strong>无常损失 (Impermanent Loss)：</strong>
            当池内代币价格发生变化时，可能产生无常损失
          </li>
          <li>
            <strong>智能合约风险：</strong>
            合约虽经审计，但仍存在潜在风险，请谨慎投资
          </li>
          <li>
            <strong>流动性锁定：</strong>
            在高波动时期可能难以快速退出流动性
          </li>
          <li style={{ color: colors.success, fontWeight: '500' }}>
            💡 建议优先选择稳定币对或相关性高的代币对以降低无常损失
          </li>
        </ul>
      </div>
    </Card>
  )
}
