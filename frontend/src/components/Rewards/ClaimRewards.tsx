import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Button, Badge, type Column } from '../common'
import { useClaimRewards, useUserRewards, type RewardItem } from '../../hooks/useRewards'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'

export function ClaimRewards() {
  const { isConnected } = useAccount()
  const { claimAll, isPending, isSuccess } = useClaimRewards()

  // 从合约查询真实奖励数据
  const { rewards: rewardItems, isLoading, isError } = useUserRewards()

  // 计算奖励价值统计（简化：不显示价值，只显示数量）
  const rewardStats = useMemo(() => {
    const feeRewards = rewardItems.filter((r) => r.type === 'fee')
    const bribeRewards = rewardItems.filter((r) => r.type === 'bribe')
    const emissionRewards = rewardItems.filter((r) => r.type === 'emission')

    return {
      feeCount: feeRewards.length,
      bribeCount: bribeRewards.length,
      emissionCount: emissionRewards.length,
      totalCount: rewardItems.length,
    }
  }, [rewardItems])

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
            {record.token0Symbol || 'Unknown'} / {record.token1Symbol || 'Unknown'}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            {record.poolAddress.slice(0, 6)}...{record.poolAddress.slice(-4)}
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
        return `${formatTokenAmount(record.amount, record.decimals, 4)} ${record.rewardToken}`
      },
    },
    {
      key: 'value',
      title: '价值',
      align: 'right',
      render: () => (
        <span style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>计算中...</span>
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

  if (isLoading) {
    return (
      <Card title="领取奖励">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载奖励数据中...</div>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card title="领取奖励">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>❌</div>
          <div style={{ marginBottom: spacing.md }}>加载奖励数据失败</div>
          <div style={{ fontSize: fontSize.sm }}>请检查网络连接或稍后重试</div>
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
            {rewardStats.feeCount} 项
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
            {rewardStats.bribeCount} 项
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
            {rewardStats.emissionCount} 项
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
            奖励总数
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.primary,
            }}
          >
            {rewardStats.totalCount} 项
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
