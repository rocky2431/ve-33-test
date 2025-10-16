import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, type Column } from '../common'
import { usePoolInfo, usePairAddress } from '../../hooks/useLiquidity'
import { formatTokenAmount } from '../../utils/format'
import { TOKENS } from '../../constants/tokens'
import { colors, spacing, fontSize } from '../../constants/theme'

interface LiquidityPosition {
  tokenA: string
  tokenB: string
  stable: boolean
  lpBalance: bigint
  share: string
  value: string
}

export function MyLiquidity() {
  const { isConnected } = useAccount()

  // 示例：查询 SOLID/WBNB 池
  const solidWbnbPair = usePairAddress(TOKENS.SOLID.address, TOKENS.WBNB.address, false)
  const solidWbnbInfo = usePoolInfo(solidWbnbPair)

  // 构建持仓列表（实际应该遍历所有池）
  const positions: LiquidityPosition[] = []

  if (solidWbnbInfo.lpBalance && solidWbnbInfo.lpBalance > 0n) {
    const share =
      solidWbnbInfo.totalSupply && solidWbnbInfo.totalSupply > 0n
        ? Number((solidWbnbInfo.lpBalance * 10000n) / solidWbnbInfo.totalSupply) / 100
        : 0

    positions.push({
      tokenA: 'SOLID',
      tokenB: 'WBNB',
      stable: false,
      lpBalance: solidWbnbInfo.lpBalance,
      share: share.toFixed(2) + '%',
      value: '-', // 需要价格预言机
    })
  }

  const columns: Column<LiquidityPosition>[] = [
    {
      key: 'pool',
      title: '流动性池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {record.tokenA} / {record.tokenB}
          </div>
          <Badge variant={record.stable ? 'info' : 'default'}>
            {record.stable ? '稳定币池' : '波动性池'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'lpBalance',
      title: 'LP Token',
      render: (_, record) => formatTokenAmount(record.lpBalance, 18, 6),
    },
    {
      key: 'share',
      title: '池份额',
      render: (_, record) => record.share,
    },
    {
      key: 'value',
      title: '价值 (USD)',
      render: (_, record) => record.value,
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: () => (
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => {
              // 跳转到添加流动性
            }}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            添加
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // 跳转到移除流动性
            }}
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
          <Button onClick={() => {/* 跳转到添加流动性 */}}>
            添加流动性
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="我的流动性">
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
        rowKey={(record) => `${record.tokenA}-${record.tokenB}-${record.stable}`}
        onRowClick={() => {
          // 选择位置
        }}
      />
    </Card>
  )
}
