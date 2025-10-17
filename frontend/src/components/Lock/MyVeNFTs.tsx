import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, type Column } from '../common'
import { useUserVeNFTs } from '../../hooks/useVeNFT'
import { formatTokenAmount } from '../../utils/format'
import { formatRemainingTime } from '../../utils/calculations'
import { colors, spacing, fontSize } from '../../constants/theme'

interface VeNFTItem {
  tokenId: bigint
  amount: bigint
  end: bigint
  votingPower: bigint
  isExpired: boolean
}

export function MyVeNFTs() {
  const { isConnected } = useAccount()
  const { balance, nfts: rawNfts, isLoading } = useUserVeNFTs()

  // 将原始 NFT 数据转换为组件需要的格式,添加 isExpired 字段
  const nfts: VeNFTItem[] = rawNfts.map((nft) => ({
    ...nft,
    isExpired: nft.end > 0n && nft.end < BigInt(Math.floor(Date.now() / 1000)),
  }))

  const columns: Column<VeNFTItem>[] = [
    {
      key: 'tokenId',
      title: 'NFT ID',
      render: (_, record) => `#${record.tokenId.toString()}`,
    },
    {
      key: 'amount',
      title: '锁仓数量',
      render: (_, record) => `${formatTokenAmount(record.amount, 18, 4)} SOLID`,
    },
    {
      key: 'votingPower',
      title: '投票权重',
      render: (_, record) => formatTokenAmount(record.votingPower, 18, 4),
    },
    {
      key: 'end',
      title: '剩余时间',
      render: (_, record) => (
        <div>
          <div>{formatRemainingTime(record.end)}</div>
          {record.isExpired && (
            <div style={{ marginTop: '4px' }}>
              <Badge variant="warning" size="sm">
                已到期
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          {!record.isExpired ? (
            <>
              <Button variant="secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                增加金额
              </Button>
              <Button variant="secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                延长时间
              </Button>
            </>
          ) : (
            <Button variant="primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              提取
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (!isConnected) {
    return (
      <Card title="我的 ve-NFT">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>👛</div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card title="我的 ve-NFT">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载 NFT 数据中...</div>
        </div>
      </Card>
    )
  }

  if (!balance || balance === 0n) {
    return (
      <Card title="我的 ve-NFT">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🔒</div>
          <div style={{ marginBottom: spacing.md }}>您还没有创建 ve-NFT</div>
          <Button>创建 ve-NFT</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="我的 ve-NFT">
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          ve-NFT 数量
        </div>
        <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
          {balance.toString()}
        </div>
      </div>

      <Table columns={columns} data={nfts} rowKey={(record) => record.tokenId.toString()} />
    </Card>
  )
}
