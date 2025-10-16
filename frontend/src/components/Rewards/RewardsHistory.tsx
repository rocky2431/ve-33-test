import { useAccount } from 'wagmi'
import { Card, Table, Badge, type Column } from '../common'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'

interface HistoryRecord {
  timestamp: number
  type: 'fee' | 'bribe' | 'emission'
  poolName: string
  rewardToken: string
  amount: bigint
  value: string
  txHash: string
}

export function RewardsHistory() {
  const { isConnected } = useAccount()

  // 示例历史记录
  const historyRecords: HistoryRecord[] = [
    {
      timestamp: Date.now() - 86400000,
      type: 'fee',
      poolName: 'SOLID/WBNB',
      rewardToken: 'WBNB',
      amount: 5000000000000000n,
      value: '$125.50',
      txHash: '0xabc123...',
    },
    {
      timestamp: Date.now() - 172800000,
      type: 'bribe',
      poolName: 'USDT/USDC',
      rewardToken: 'USDT',
      amount: 100000000n,
      value: '$100.00',
      txHash: '0xdef456...',
    },
    {
      timestamp: Date.now() - 259200000,
      type: 'emission',
      poolName: '-',
      rewardToken: 'SOLID',
      amount: 500000000000000000n,
      value: '$90.50',
      txHash: '0xghi789...',
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

  const columns: Column<HistoryRecord>[] = [
    {
      key: 'time',
      title: '时间',
      render: (_, record) => (
        <div>
          <div>{new Date(record.timestamp).toLocaleDateString('zh-CN')}</div>
          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            {new Date(record.timestamp).toLocaleTimeString('zh-CN')}
          </div>
        </div>
      ),
    },
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
      title: '来源',
      render: (_, record) => record.poolName,
    },
    {
      key: 'reward',
      title: '奖励',
      render: (_, record) => {
        const decimals = record.rewardToken === 'USDT' ? 6 : 18
        return (
          <div>
            <div style={{ fontWeight: '600' }}>
              {formatTokenAmount(record.amount, decimals, 4)} {record.rewardToken}
            </div>
            <div style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
              {record.value}
            </div>
          </div>
        )
      },
    },
    {
      key: 'tx',
      title: '交易',
      align: 'right',
      render: (_, record) => (
        <a
          href={`https://bscscan.com/tx/${record.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: colors.primary, textDecoration: 'none' }}
        >
          查看 ↗
        </a>
      ),
    },
  ]

  if (!isConnected) {
    return (
      <Card title="奖励历史">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>👛</div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (historyRecords.length === 0) {
    return (
      <Card title="奖励历史">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>📜</div>
          <div>暂无历史记录</div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="奖励历史">
      {/* 统计信息 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
            总领取次数
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {historyRecords.length}
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
            累计价值
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: colors.success,
            }}
          >
            $316.00
          </div>
        </div>
      </div>

      {/* 历史记录表格 */}
      <Table
        columns={columns}
        data={historyRecords}
        rowKey={(record: HistoryRecord) => record.txHash}
      />
    </Card>
  )
}
