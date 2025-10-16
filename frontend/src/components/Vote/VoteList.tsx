import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Button, Input, type Column } from '../common'
import { useVoteWeights, useAllGauges, type PoolInfo } from '../../hooks/useVote'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Address } from 'viem'

export function VoteList() {
  const { address: userAddress, isConnected } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPools, setSelectedPools] = useState<Map<Address, number>>(new Map())

  const { vote, isPending, isSuccess } = useVoteWeights()

  // 从合约查询所有池数据
  const { pools, isLoading } = useAllGauges()

  // 过滤池列表
  const filteredPools = useMemo(() => {
    if (!pools) return []
    return pools.filter((pool) => {
      const poolName = `${pool.token0Symbol || 'Unknown'}/${pool.token1Symbol || 'Unknown'}`
      return poolName.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [pools, searchTerm])

  const handleWeightChange = (poolAddress: Address, weight: number) => {
    const newSelected = new Map(selectedPools)
    if (weight > 0) {
      newSelected.set(poolAddress, weight)
    } else {
      newSelected.delete(poolAddress)
    }
    setSelectedPools(newSelected)
  }

  const totalAllocated = Array.from(selectedPools.values()).reduce((sum, w) => sum + w, 0)
  const canVote = totalAllocated === 100 && selectedPools.size > 0

  const handleVote = async () => {
    if (!userAddress) return

    const poolAddresses = Array.from(selectedPools.keys())
    const weights = Array.from(selectedPools.values())

    await vote(poolAddresses, weights)
  }

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
          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            {record.stable ? '稳定币池' : '波动性池'}
          </div>
        </div>
      ),
    },
    {
      key: 'votes',
      title: '当前投票',
      render: (_, record) => formatTokenAmount(record.currentVotes, 18, 0),
    },
    {
      key: 'apr',
      title: '投票 APR',
      render: () => (
        <span style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>计算中...</span>
      ),
    },
    {
      key: 'bribe',
      title: '贿赂奖励',
      render: (_, record) => (
        <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          {record.bribeAddress ? '有奖励' : '无'}
        </span>
      ),
    },
    {
      key: 'weight',
      title: '投票权重 (%)',
      align: 'right',
      render: (_, record) => (
        <Input
          type="number"
          placeholder="0"
          value={selectedPools.get(record.address)?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0
            handleWeightChange(record.address, Math.min(100, Math.max(0, value)))
          }}
          style={{ width: '100px', textAlign: 'right' }}
        />
      ),
    },
  ]

  if (!isConnected) {
    return (
      <Card title="投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🗳️</div>
          <div>请先连接钱包</div>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card title="投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载池数据中...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="投票">
      {/* 搜索栏 */}
      <div style={{ marginBottom: spacing.lg }}>
        <Input
          placeholder="搜索流动性池..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </div>

      {/* 投票权重统计 */}
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
            已分配权重
          </div>
          <div
            style={{
              fontSize: fontSize.xl,
              fontWeight: '600',
              marginTop: spacing.xs,
              color: totalAllocated === 100 ? colors.success : colors.warning,
            }}
          >
            {totalAllocated}%
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
            剩余权重
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {100 - totalAllocated}%
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
            投票池数量
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {selectedPools.size}
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      {totalAllocated > 0 && totalAllocated !== 100 && (
        <div
          style={{
            marginBottom: spacing.md,
            padding: spacing.md,
            backgroundColor: `${colors.warning}22`,
            border: `1px solid ${colors.warning}`,
            borderRadius: '8px',
            fontSize: fontSize.sm,
            color: colors.warning,
          }}
        >
          ⚠️ 总权重必须等于 100% 才能提交投票
        </div>
      )}

      {/* 池列表 */}
      <Table columns={columns} data={filteredPools} rowKey={(record) => record.address} />

      {/* 投票按钮 */}
      <Button
        fullWidth
        disabled={!canVote || isPending}
        loading={isPending}
        onClick={handleVote}
        style={{ marginTop: spacing.lg }}
      >
        {canVote ? '确认投票' : '请分配 100% 投票权重'}
      </Button>

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
          ✅ 投票成功!下个周期生效
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
          💡 投票说明
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
          <li>使用 ve-NFT 投票权重为流动性池分配激励</li>
          <li>投票决定下个周期各池获得的 SOLID 排放量</li>
          <li>投票池可获得该池的交易手续费分成</li>
          <li>投票池可获得贿赂奖励(Bribe)</li>
          <li>每个周期只能投票一次,投票后无法修改</li>
        </ul>
      </div>
    </Card>
  )
}
