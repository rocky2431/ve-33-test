import { useAccount } from 'wagmi'
import { Card, Table, Button, Badge, type Column } from '../common'
import { useClaimRewards } from '../../hooks/useRewards'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Address } from 'viem'

interface RewardItem {
  type: 'fee' | 'bribe' | 'emission'
  poolAddress: Address
  poolName: string
  tokenA: string
  tokenB: string
  rewardToken: string
  amount: bigint
  value: string
}

export function ClaimRewards() {
  const { isConnected } = useAccount()
  const { claimAll, isPending, isSuccess } = useClaimRewards()

  // 示例奖励数据
  const rewardItems: RewardItem[] = [
    {
      type: 'fee',
      poolAddress: '0x1234...' as Address,
      poolName: 'SOLID/WBNB',
      tokenA: 'SOLID',
      tokenB: 'WBNB',
      rewardToken: 'WBNB',
      amount: 5000000000000000n,
      value: '$125.50',
    },
    {
      type: 'bribe',
      poolAddress: '0x1234...' as Address,
      poolName: 'SOLID/WBNB',
      tokenA: 'SOLID',
      tokenB: 'WBNB',
      rewardToken: 'USDT',
      amount: 83200000n,
      value: '$83.20',
    },
    {
      type: 'emission',
      poolAddress: '0x5678...' as Address,
      poolName: 'USDT/USDC',
      tokenA: 'USDT',
      tokenB: 'USDC',
      rewardToken: 'SOLID',
      amount: 250000000000000000n,
      value: '$45.30',
    },
  ]

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'fee':
        return { text: '手续费', variant: 'success' as const }
      case 'bribe':
        return { text: '贿赂', variant: 'info' as const }
      case 'emission':
        return { text: '排放', variant: 'warning' as const }
      default:
        return { text: '其他', variant: 'default' as const }
    }
  }

  const columns: Column<RewardItem>[] = [
    {
      key: 'type',
      title: '类型',
      render: (_, record) => {
        const { text, variant } = getRewardTypeLabel(record.type)
        return <Badge variant={variant}>{text}</Badge>
      },
    },
    {
      key: 'pool',
      title: '来源池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600' }}>
            {record.tokenA} / {record.tokenB}
          </div>
        </div>
      ),
    },
    {
      key: 'token',
      title: '奖励代币',
      render: (_, record) => record.rewardToken,
    },
    {
      key: 'amount',
      title: '数量',
      render: (_, record) => {
        const decimals = record.rewardToken === 'USDT' ? 6 : 18
        return `${formatTokenAmount(record.amount, decimals, 4)} ${record.rewardToken}`
      },
    },
    {
      key: 'value',
      title: '价值',
      align: 'right',
      render: (_, record) => (
        <span style={{ color: colors.success, fontWeight: '600' }}>{record.value}</span>
      ),
    },
  ]

  const handleClaimAll = async () => {
    await claimAll()
  }

  if (!isConnected) {
    return (
      <Card title="领取奖励">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>👛</div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (rewardItems.length === 0) {
    return (
      <Card title="领取奖励">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🎁</div>
          <div>暂无可领取的奖励</div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="领取奖励">
      {/* 总奖励统计 */}
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
            手续费奖励
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.success,
            }}
          >
            $125.50
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
            贿赂奖励
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.info,
            }}
          >
            $83.20
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
            排放奖励
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.warning,
            }}
          >
            $45.30
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
            总价值
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.primary,
            }}
          >
            $254.00
          </div>
        </div>
      </div>

      {/* 奖励列表 */}
      <Table columns={columns} data={rewardItems} rowKey={(record: RewardItem) => record.poolAddress} />

      {/* 领取按钮 */}
      <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}>
        <Button
          fullWidth
          disabled={isPending}
          loading={isPending}
          onClick={handleClaimAll}
        >
          领取所有奖励
        </Button>
      </div>

      {/* 成功提示 */}
      {isSuccess && (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: `${colors.success}22`,
            border: `1px solid ${colors.success}`,
            borderRadius: '8px',
            color: colors.success,
            fontSize: fontSize.sm,
            textAlign: 'center',
          }}
        >
          ✅ 奖励领取成功!
        </div>
      )}

      {/* 说明 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
          fontSize: fontSize.sm,
          color: colors.textSecondary,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.textPrimary }}>
          💡 奖励说明
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
          <li>手续费奖励: 投票池产生的交易手续费分成</li>
          <li>贿赂奖励: 流动性提供者为吸引投票提供的额外奖励</li>
          <li>排放奖励: 锁仓 ve-NFT 获得的 SOLID 代币增发补偿</li>
          <li>奖励每周期结算一次,可随时领取</li>
        </ul>
      </div>
    </Card>
  )
}
