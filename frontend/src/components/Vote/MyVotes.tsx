import { useAccount } from 'wagmi'
import { Card, Table, Badge, type Column } from '../common'
import { useUserVotes } from '../../hooks/useVote'
import { useUserVeNFTs } from '../../hooks/useVeNFT'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Address } from 'viem'

interface VoteRecord {
  poolAddress: Address
  poolName: string
  token0Symbol?: string
  token1Symbol?: string
  stable: boolean
  weight: bigint
  gaugeAddress?: Address
}

export function MyVotes() {
  const { isConnected } = useAccount()

  // 获取用户的 ve-NFT 列表
  const { nfts, isLoading: nftsLoading } = useUserVeNFTs()

  // 使用第一个 NFT 的 tokenId 查询投票历史
  const firstTokenId = nfts.length > 0 ? nfts[0].tokenId : undefined
  const { lastVoted, votes: voteRecords, isLoading: votesLoading, isError } = useUserVotes(firstTokenId)

  const isLoading = nftsLoading || votesLoading

  const columns: Column<VoteRecord>[] = [
    {
      key: 'pool',
      title: '流动性池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {record.token0Symbol || 'Unknown'} / {record.token1Symbol || 'Unknown'}
          </div>
          <Badge variant={record.stable ? 'info' : 'default'} size="sm">
            {record.stable ? '稳定币池' : '波动性池'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'weight',
      title: '投票权重',
      render: (_, record) => formatTokenAmount(record.weight, 18, 2),
    },
    {
      key: 'address',
      title: '池地址',
      render: (_, record) => (
        <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          {record.poolAddress.slice(0, 6)}...{record.poolAddress.slice(-4)}
        </span>
      ),
    },
    {
      key: 'gauge',
      title: 'Gauge 地址',
      align: 'right',
      render: (_, record) => (
        <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          {record.gaugeAddress
            ? `${record.gaugeAddress.slice(0, 6)}...${record.gaugeAddress.slice(-4)}`
            : '-'}
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

  if (isLoading) {
    return (
      <Card title="我的投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载投票数据中...</div>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card title="我的投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>❌</div>
          <div style={{ marginBottom: spacing.md }}>加载投票数据失败</div>
          <div style={{ fontSize: fontSize.sm }}>请检查网络连接或稍后重试</div>
        </div>
      </Card>
    )
  }

  if (nfts.length === 0) {
    return (
      <Card title="我的投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🔒</div>
          <div style={{ marginBottom: spacing.md }}>您还没有创建 ve-NFT</div>
          <div style={{ fontSize: fontSize.sm }}>创建 ve-NFT 后即可进行投票</div>
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
          <span style={{ color: colors.textSecondary }}>投票池数量</span>
          <span style={{ fontWeight: '600' }}>{voteRecords.length} 个</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: colors.textSecondary }}>使用的 NFT</span>
          <span style={{ fontWeight: '600', color: colors.primary }}>
            #{firstTokenId?.toString()}
          </span>
        </div>
      </div>
    </Card>
  )
}
