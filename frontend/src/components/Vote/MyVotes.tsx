import { useAccount } from 'wagmi'
import { Card, Table, Badge, type Column } from '../common'
import { useUserVotes } from '../../hooks/useVote'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Address } from 'viem'

interface VoteRecord {
  poolAddress: Address
  poolName: string
  tokenA: string
  tokenB: string
  stable: boolean
  weight: number
  votingPower: bigint
  estimatedRewards: string
}

export function MyVotes() {
  const { address: userAddress, isConnected } = useAccount()
  const { lastVoted } = useUserVotes(userAddress)

  // 示例投票记录
  const voteRecords: VoteRecord[] = [
    {
      poolAddress: '0x1234...' as Address,
      poolName: 'SOLID/WBNB',
      tokenA: 'SOLID',
      tokenB: 'WBNB',
      stable: false,
      weight: 60,
      votingPower: 1000000000000000000n,
      estimatedRewards: '125.5 USDT',
    },
    {
      poolAddress: '0x5678...' as Address,
      poolName: 'USDT/USDC',
      tokenA: 'USDT',
      tokenB: 'USDC',
      stable: true,
      weight: 40,
      votingPower: 666666666666666666n,
      estimatedRewards: '83.2 USDT',
    },
  ]

  const columns: Column<VoteRecord>[] = [
    {
      key: 'pool',
      title: '流动性池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {record.tokenA} / {record.tokenB}
          </div>
          <Badge variant={record.stable ? 'info' : 'default'} size="sm">
            {record.stable ? '稳定币池' : '波动性池'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'weight',
      title: '权重',
      render: (_, record) => (
        <span style={{ fontWeight: '600', color: colors.primary }}>{record.weight}%</span>
      ),
    },
    {
      key: 'votingPower',
      title: '投票权重',
      render: (_, record) => formatTokenAmount(record.votingPower, 18, 2),
    },
    {
      key: 'rewards',
      title: '预估奖励',
      align: 'right',
      render: (_, record) => (
        <span style={{ color: colors.success, fontWeight: '600' }}>
          {record.estimatedRewards}
        </span>
      ),
    },
  ]

  if (!isConnected) {
    return (
      <Card title="我的投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>👛</div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (voteRecords.length === 0) {
    return (
      <Card title="我的投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🗳️</div>
          <div>您还没有进行投票</div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="我的投票">
      {/* 投票状态 */}
      <div
        style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
        }}
      >
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          上次投票时间
        </div>
        <div style={{ fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.xs }}>
          {lastVoted ? new Date(Number(lastVoted) * 1000).toLocaleString('zh-CN') : '尚未投票'}
        </div>
      </div>

      {/* 投票记录 */}
      <Table columns={columns} data={voteRecords} rowKey={(record) => record.poolAddress} />

      {/* 总计 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
          }}
        >
          <span style={{ color: colors.textSecondary }}>总投票权重</span>
          <span style={{ fontWeight: '600' }}>100%</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: colors.textSecondary }}>预估总奖励 (本周期)</span>
          <span style={{ fontWeight: '600', color: colors.success }}>208.7 USDT</span>
        </div>
      </div>
    </Card>
  )
}
