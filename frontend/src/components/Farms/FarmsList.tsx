import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, Input, type Column } from '../common'
import { useAllGauges, type PoolInfo } from '../../hooks/useVote'
import { useTokenPrice, formatUSDPrice } from '../../hooks/useTokenPrice'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'

export function FarmsList() {
  const { isConnected } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'stable' | 'volatile'>('all')

  // 获取所有池子数据
  const { pools, isLoading, isError } = useAllGauges()

  // 价格计算Hook
  const { calculatePoolTVL, isReady: isPriceReady } = useTokenPrice()

  // 过滤池列表
  const filteredPools = useMemo(() => {
    if (!pools) return []

    let filtered = pools

    // 按类型过滤
    if (filterType === 'stable') {
      filtered = filtered.filter((pool) => pool.stable)
    } else if (filterType === 'volatile') {
      filtered = filtered.filter((pool) => !pool.stable)
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter((pool) => {
        const poolName = `${pool.token0Symbol || 'Unknown'}/${pool.token1Symbol || 'Unknown'}`
        return poolName.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    return filtered
  }, [pools, searchTerm, filterType])

  const columns: Column<PoolInfo>[] = [
    {
      key: 'name',
      title: '流动性池',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            {record.token0Symbol || record.token0.slice(0, 6)} /{' '}
            {record.token1Symbol || record.token1.slice(0, 6)}
          </div>
          <Badge variant={record.stable ? 'info' : 'default'} size="sm">
            {record.stable ? '稳定币池' : '波动性池'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'liquidity',
      title: 'TVL (流动性)',
      render: (_, record) => {
        // 计算USD价值
        let tvlUSD = 0n
        if (isPriceReady && record.reserve0 && record.reserve1 && record.token0 && record.token1) {
          tvlUSD = calculatePoolTVL(record.token0, record.token1, record.reserve0, record.reserve1)
        }

        return (
          <div>
            {tvlUSD > 0n ? (
              <>
                <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: fontSize.md }}>
                  {formatUSDPrice(tvlUSD, 0)}
                </div>
                <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: '2px' }}>
                  {record.reserve0 && record.reserve1
                    ? `${formatTokenAmount(record.reserve0, 18, 0)} / ${formatTokenAmount(record.reserve1, 18, 0)}`
                    : '-'}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: '500' }}>
                  {record.reserve0 && record.reserve1
                    ? `${formatTokenAmount(record.reserve0, 18, 2)} / ${formatTokenAmount(record.reserve1, 18, 2)}`
                    : '-'}
                </div>
                <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: '2px' }}>
                  {isPriceReady ? '无法计算USD价值' : '加载价格中...'}
                </div>
              </>
            )}
          </div>
        )
      },
    },
    {
      key: 'votes',
      title: '投票权重',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {formatTokenAmount(record.currentVotes, 18, 0)}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: '2px' }}>
            veNFT 投票
          </div>
        </div>
      ),
    },
    {
      key: 'apr',
      title: 'APR',
      render: () => (
        <div>
          <div style={{ fontWeight: '600', color: colors.success }}>计算中...</div>
          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: '2px' }}>
            基于投票 + 手续费
          </div>
        </div>
      ),
    },
    {
      key: 'bribe',
      title: '贿赂奖励',
      render: (_, record) => (
        <div style={{ fontSize: fontSize.sm }}>
          {record.bribeAddress ? (
            <Badge variant="success" size="sm">
              有奖励
            </Badge>
          ) : (
            <span style={{ color: colors.textSecondary }}>无</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={() => {
              window.navigateTo?.('liquidity')
            }}
            style={{ padding: '6px 12px', fontSize: fontSize.sm }}
          >
            添加流动性
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              window.navigateTo?.('vote')
            }}
            style={{ padding: '6px 12px', fontSize: fontSize.sm }}
          >
            投票
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Card title="流动性挖矿 (Farms)">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载池子数据中...</div>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card title="流动性挖矿 (Farms)">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>❌</div>
          <div style={{ marginBottom: spacing.md }}>加载池数据失败</div>
          <div style={{ fontSize: fontSize.sm }}>请检查网络连接或稍后重试</div>
        </div>
      </Card>
    )
  }

  if (!pools || pools.length === 0) {
    return (
      <Card title="流动性挖矿 (Farms)">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>📊</div>
          <div style={{ marginBottom: spacing.md }}>暂无流动性池</div>
          <div style={{ fontSize: fontSize.sm }}>
            创建流动性池后,对应的 Farm 将自动出现在这里
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="流动性挖矿 (Farms)">
      {/* 搜索和过滤 */}
      <div style={{ marginBottom: spacing.lg }}>
        <Input
          placeholder="搜索流动性池..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />

        {/* 类型过滤 */}
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          <Button
            variant={filterType === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilterType('all')}
            style={{ flex: 1 }}
          >
            全部池子 ({pools.length})
          </Button>
          <Button
            variant={filterType === 'volatile' ? 'primary' : 'secondary'}
            onClick={() => setFilterType('volatile')}
            style={{ flex: 1 }}
          >
            波动性池 ({pools.filter((p) => !p.stable).length})
          </Button>
          <Button
            variant={filterType === 'stable' ? 'primary' : 'secondary'}
            onClick={() => setFilterType('stable')}
            style={{ flex: 1 }}
          >
            稳定币池 ({pools.filter((p) => p.stable).length})
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {/* 总TVL统计 */}
        {isPriceReady && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.bgPrimary,
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>总锁定价值</div>
            <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs, color: colors.success }}>
              {formatUSDPrice(
                filteredPools.reduce((sum, p) => {
                  if (p.reserve0 && p.reserve1 && p.token0 && p.token1) {
                    const tvl = calculatePoolTVL(p.token0, p.token1, p.reserve0, p.reserve1)
                    return sum + tvl
                  }
                  return sum
                }, 0n),
                0
              )}
            </div>
          </div>
        )}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>总池子数</div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {filteredPools.length}
          </div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>总投票权重</div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {formatTokenAmount(
              filteredPools.reduce((sum, p) => sum + (p.currentVotes || 0n), 0n),
              18,
              0
            )}
          </div>
        </div>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>有贿赂奖励</div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {filteredPools.filter((p) => p.bribeAddress).length}
          </div>
        </div>
      </div>

      {/* 池列表 */}
      <Table columns={columns} data={filteredPools} rowKey={(record) => record.address} />

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
          💡 如何参与流动性挖矿
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg, lineHeight: 1.8 }}>
          <li>添加流动性获得 LP Token</li>
          <li>将 LP Token 质押到对应的 Gauge</li>
          <li>获得 SRT 代币排放奖励</li>
          <li>获得交易手续费分成（自动复投到 LP）</li>
          <li>如果有贿赂奖励,还可以领取额外代币</li>
        </ul>
      </div>

      {/* 池子类型说明 */}
      <div
        style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: `${colors.info}11`,
          border: `1px solid ${colors.info}33`,
          borderRadius: '8px',
          fontSize: fontSize.sm,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.info }}>
          📊 池子类型说明
        </div>
        <div style={{ color: colors.textSecondary, lineHeight: 1.8 }}>
          <div style={{ marginBottom: spacing.xs }}>
            <strong style={{ color: colors.textPrimary }}>• 波动性池：</strong>
            使用恒定乘积公式 (x×y=k), 适合价格波动大的代币对, 如 SRT/WSRT, STE/STF
          </div>
          <div>
            <strong style={{ color: colors.textPrimary }}>• 稳定币池：</strong>
            使用 StableSwap 曲线, 适合价格稳定的代币对, 如 USDT/USDC, 滑点更低
          </div>
        </div>
      </div>
    </Card>
  )
}
