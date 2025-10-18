import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Button, Input, type Column } from '../common'
import { useVoteWeights, useAllGauges, type PoolInfo } from '../../hooks/useVote'
import { useUserVeNFTs } from '../../hooks/useVeNFT'
import { formatTokenAmount } from '../../utils/format'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { Address } from 'viem'

export function VoteList() {
  const { address: userAddress, isConnected } = useAccount()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPools, setSelectedPools] = useState<Map<Address, number>>(new Map())

  const { vote, isPending, isSuccess } = useVoteWeights()

  // 获取用户的 ve-NFT 列表
  const { nfts, isLoading: isLoadingNFTs } = useUserVeNFTs()

  // 从合约查询所有池数据
  const { pools, isLoading, isError } = useAllGauges()

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
  const canVote = totalAllocated === 100 && selectedPools.size > 0 && nfts.length > 0

  const handleVote = async () => {
    if (!userAddress) return

    // 检查是否有 ve-NFT
    if (!nfts || nfts.length === 0) {
      console.error('❌ [VoteList] 用户没有 ve-NFT')
      return
    }

    // 使用第一个 NFT 进行投票（未来可以让用户选择）
    const tokenId = nfts[0].tokenId
    const currentTime = Math.floor(Date.now() / 1000)

    // 估算NFT创建时间(基于锁定结束时间 - 锁定时长)
    // 注意: 这是一个估算,实际创建时间需要从合约查询
    const estimatedCreationTime = currentTime - 300 // 保守估计创建至少5分钟前

    // 检查是否满足最小持有期(1天 = 86400秒)
    const MIN_HOLDING_PERIOD = 86400
    const timeSinceCreation = currentTime - estimatedCreationTime

    if (timeSinceCreation < MIN_HOLDING_PERIOD) {
      const remainingTime = MIN_HOLDING_PERIOD - timeSinceCreation
      const hours = Math.floor(remainingTime / 3600)
      const minutes = Math.floor((remainingTime % 3600) / 60)

      alert(
        `⏳ 投票失败\n\n` +
        `新创建的 ve-NFT 需要持有至少 1 天才能投票。\n\n` +
        `预计还需等待: ${hours} 小时 ${minutes} 分钟\n\n` +
        `这是为了防止 Flash Loan 攻击的安全措施。`
      )
      return
    }

    const poolAddresses = Array.from(selectedPools.keys())
    const weights = Array.from(selectedPools.values())

    console.log('🗳️ [VoteList] Submitting vote:', {
      tokenId: tokenId.toString(),
      poolAddresses,
      weights,
      totalAllocated,
    })

    try {
      await vote(tokenId, poolAddresses, weights)
    } catch (error: any) {
      console.error('❌ [VoteList] Vote failed:', error)

      // 解析错误消息
      let errorMsg = '投票失败'
      if (error?.message) {
        if (error.message.includes('minimum holding period')) {
          errorMsg = '⏳ 新创建的 ve-NFT 需要持有至少 1 天才能投票'
        } else if (error.message.includes('already voted this week')) {
          errorMsg = '⏳ 该 NFT 本周已投票，请等待 1 周后再投'
        } else if (error.message.includes('creation block')) {
          errorMsg = '⚠️ 不能在 NFT 创建的同一区块投票，请稍等几秒'
        } else if (error.message.includes('no voting power')) {
          errorMsg = '❌ 该 NFT 没有投票权重（可能已过期）'
        } else {
          errorMsg = error.message
        }
      }

      alert(errorMsg)
    }
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

  if (isLoading || isLoadingNFTs) {
    return (
      <Card title="投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>⏳</div>
          <div>加载数据中...</div>
        </div>
      </Card>
    )
  }

  // 检查用户是否有 ve-NFT
  if (!nfts || nfts.length === 0) {
    return (
      <Card title="投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>🔒</div>
          <div style={{ marginBottom: spacing.md }}>您还没有 ve-NFT，无法投票</div>
          <div style={{ fontSize: fontSize.sm, marginBottom: spacing.lg }}>
            请先创建 ve-NFT 以获得投票权
          </div>
          <Button onClick={() => window.location.hash = '#/lock'}>
            创建 ve-NFT
          </Button>
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card title="投票">
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
      <Card title="投票">
        <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>📊</div>
          <div style={{ marginBottom: spacing.md }}>暂无可投票的流动性池</div>
          <div style={{ fontSize: fontSize.sm }}>
            创建流动性池后,对应的 Gauge 将自动出现在这里
          </div>
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
        {!nfts || nfts.length === 0
          ? '需要 ve-NFT 才能投票'
          : canVote
          ? `确认投票 (使用 ve-NFT #${nfts[0].tokenId.toString()})`
          : '请分配 100% 投票权重'}
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

      {/* 收益来源说明 */}
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
          💰 投票收益来源
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 1.8 }}>
          <div style={{ marginBottom: spacing.sm }}>
            <strong style={{ color: colors.textPrimary }}>1. 交易手续费分成 (Trading Fees)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 您投票的池子产生的所有交易手续费(0.3%)将分配给投票者
              <br />
              • 手续费每周自动分发到Bribe合约,可随时领取
            </div>
          </div>
          <div style={{ marginBottom: spacing.sm }}>
            <strong style={{ color: colors.textPrimary }}>2. 贿赂奖励 (Bribe Rewards)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 项目方为吸引投票而提供的额外奖励
              <br />
              • 可能是项目代币或稳定币,每周结算一次
            </div>
          </div>
          <div>
            <strong style={{ color: colors.textPrimary }}>3. SRT 排放加成 (Emission Boost)</strong>
            <div style={{ paddingLeft: spacing.md, marginTop: '4px', color: colors.textTertiary }}>
              • 投票权重越高的池子获得的 SRT 排放量越多
              <br />
              • 提高池子的流动性挖矿收益,间接增加手续费收入
            </div>
          </div>
        </div>
      </div>

      {/* APY 计算说明 */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: `${colors.primary}11`,
          border: `1px solid ${colors.primary}33`,
          borderRadius: '8px',
          marginBottom: spacing.md,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.primary, fontSize: fontSize.md }}>
          📊 APY 计算方式
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 1.8 }}>
          <div style={{ marginBottom: spacing.sm }}>
            <strong style={{ color: colors.textPrimary }}>投票 APY 公式：</strong>
            <div
              style={{
                padding: spacing.sm,
                backgroundColor: colors.bgSecondary,
                borderRadius: '4px',
                fontFamily: 'monospace',
                marginTop: '4px',
                color: colors.textPrimary,
              }}
            >
              APY = (周手续费 + 周贿赂奖励) / 投票权重 × 52 周
            </div>
          </div>
          <div style={{ color: colors.textTertiary }}>
            <strong style={{ color: colors.textPrimary }}>示例：</strong>
            <br />
            • 您的投票权重: 1,000 veNFT
            <br />
            • 池子周交易手续费: 100 SRT
            <br />
            • 周贿赂奖励: 50 SRT
            <br />• 预期年化收益: (100 + 50) / 1,000 × 52 = 780%
          </div>
        </div>
      </div>

      {/* 说明 */}
      <div
        style={{
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
        <ul style={{ margin: 0, paddingLeft: spacing.lg, lineHeight: 1.8 }}>
          <li>使用 ve-NFT 投票权重为流动性池分配激励</li>
          <li>投票决定下个周期各池获得的 SRT 排放量</li>
          <li>投票池可获得该池的交易手续费分成</li>
          <li>投票池可获得贿赂奖励(Bribe)</li>
          <li style={{ color: colors.warning, fontWeight: '500' }}>
            ⏳ 新创建的 ve-NFT 需要持有 <strong>1 天</strong> 后才能首次投票
          </li>
          <li style={{ color: colors.warning, fontWeight: '500' }}>
            ⏳ 每个 ve-NFT 每 <strong>1 周</strong> 只能投票一次
          </li>
          <li>投票后无法修改,请谨慎分配权重</li>
        </ul>
      </div>
    </Card>
  )
}
