import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, Modal, type Column } from '../common'
import { useUserVeNFTs, useVeNFT, useMaxLockDuration } from '../../hooks/useVeNFT'
import { formatTokenAmount } from '../../utils/format'
import { formatRemainingTime } from '../../utils/calculations'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import { contracts } from '../../config/web3'
import { parseUnits } from 'viem'

interface VeNFTItem {
  tokenId: bigint
  amount: bigint
  end: bigint
  votingPower: bigint
  isExpired: boolean
}

// 延长时长预设选项
const durationPresets = [
  { label: '1 周', value: 7 * 86400 },
  { label: '1 个月', value: 30 * 86400 },
  { label: '3 个月', value: 90 * 86400 },
  { label: '6 个月', value: 180 * 86400 },
  { label: '1 年', value: 365 * 86400 },
  { label: '2 年', value: 2 * 365 * 86400 },
  { label: '4 年', value: 4 * 365 * 86400 },
]

export function MyVeNFTs() {
  const { isConnected } = useAccount()
  const { balance, nfts: rawNfts, isLoading } = useUserVeNFTs()
  const { increaseAmount, increaseUnlockTime, withdraw, isPending } = useVeNFT()
  const maxLockDuration = useMaxLockDuration() || BigInt(4 * 365 * 86400) // 默认4年

  // Modal 状态管理
  const [increaseAmountModal, setIncreaseAmountModal] = useState<{
    isOpen: boolean
    tokenId?: bigint
    amount: string
  }>({ isOpen: false, amount: '' })

  const [increaseTimeModal, setIncreaseTimeModal] = useState<{
    isOpen: boolean
    tokenId?: bigint
    lockDuration: number  // 延长的时间（秒）
  }>({ isOpen: false, lockDuration: 7 * 86400 })  // 默认延长1周

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
      render: (_, record) => `${formatTokenAmount(record.amount, 18, 4)} SRT`,
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
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={() => addNFTToWallet(record.tokenId)}
            style={{ padding: '8px 12px', fontSize: fontSize.xs, whiteSpace: 'nowrap' }}
          >
            📱 添加到钱包
          </Button>
          {!record.isExpired ? (
            <>
              <Button
                variant="secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
                onClick={() => setIncreaseAmountModal({ isOpen: true, tokenId: record.tokenId, amount: '' })}
              >
                增加金额
              </Button>
              <Button
                variant="secondary"
                style={{ padding: '8px 16px', fontSize: '14px' }}
                onClick={() => setIncreaseTimeModal({ isOpen: true, tokenId: record.tokenId, lockDuration: 7 * 86400 })}
              >
                延长时间
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
              onClick={() => handleWithdraw(record.tokenId)}
              disabled={isPending}
            >
              {isPending ? '提取中...' : '提取'}
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

  // 添加NFT到MetaMask
  const addNFTToWallet = async (tokenId: bigint) => {
    try {
      const wasAdded = await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: contracts.votingEscrow,
            tokenId: tokenId.toString(),
          },
        },
      })

      if (wasAdded) {
        alert('✅ ve-NFT 已成功添加到钱包!')
      }
    } catch (error) {
      console.error('添加NFT失败:', error)
      alert('❌ 添加失败，请确保您的钱包支持此功能')
    }
  }

  // 处理增加金额
  const handleIncreaseAmount = async () => {
    if (!increaseAmountModal.tokenId || !increaseAmountModal.amount) return

    try {
      const amount = parseUnits(increaseAmountModal.amount, 18)
      await increaseAmount(increaseAmountModal.tokenId, amount)
      setIncreaseAmountModal({ isOpen: false, amount: '' })
      alert('✅ 增加金额交易已提交!')
    } catch (error) {
      console.error('增加金额失败:', error)
      alert('❌ 交易失败')
    }
  }

  // 处理延长时间
  const handleIncreaseTime = async () => {
    if (!increaseTimeModal.tokenId || !increaseTimeModal.lockDuration) return

    try {
      await increaseUnlockTime(increaseTimeModal.tokenId, increaseTimeModal.lockDuration)
      setIncreaseTimeModal({ isOpen: false, lockDuration: 7 * 86400 })
      alert('✅ 延长时间交易已提交!')
    } catch (error) {
      console.error('延长时间失败:', error)
      alert('❌ 交易失败')
    }
  }

  // 处理提取
  const handleWithdraw = async (tokenId: bigint) => {
    try {
      await withdraw(tokenId)
      alert('✅ 提取交易已提交!')
    } catch (error) {
      console.error('提取失败:', error)
      alert('❌ 交易失败')
    }
  }

  // 复制地址到剪贴板
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ ${label}已复制到剪贴板!`)
    })
  }

  return (
    <Card title="我的 ve-NFT">
      {/* NFT合约信息 */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: radius.md,
          marginBottom: spacing.lg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm }}>
          📜 ve-NFT 合约信息
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
              合约地址
            </span>
            <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
              <code
                style={{
                  fontSize: fontSize.xs,
                  padding: '4px 8px',
                  backgroundColor: colors.bgSecondary,
                  borderRadius: radius.sm,
                  fontFamily: 'monospace',
                }}
              >
                {contracts.votingEscrow.slice(0, 6)}...{contracts.votingEscrow.slice(-4)}
              </code>
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(contracts.votingEscrow, '合约地址')}
                style={{ padding: '4px 8px', fontSize: fontSize.xs }}
              >
                复制
              </Button>
            </div>
          </div>
          <div style={{ fontSize: fontSize.xs, color: colors.textTertiary, lineHeight: 1.6 }}>
            💡 这是 ERC-721 NFT 合约，您可以在 OpenSea 等平台查看和交易您的 ve-NFT
          </div>
        </div>
      </div>

      {/* NFT数量统计 */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: radius.md,
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

      {/* 增加金额 Modal */}
      <Modal
        isOpen={increaseAmountModal.isOpen}
        onClose={() => setIncreaseAmountModal({ isOpen: false, amount: '' })}
        title="增加锁仓金额"
      >
        <div style={{ padding: spacing.md }}>
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ display: 'block', marginBottom: spacing.xs, fontSize: fontSize.sm }}>
              增加数量 (SRT)
            </label>
            <input
              type="number"
              value={increaseAmountModal.amount}
              onChange={(e) => setIncreaseAmountModal({ ...increaseAmountModal, amount: e.target.value })}
              placeholder="输入要增加的 SRT 数量"
              style={{
                width: '100%',
                padding: spacing.sm,
                fontSize: fontSize.sm,
                borderRadius: radius.sm,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgSecondary,
                color: colors.textPrimary,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setIncreaseAmountModal({ isOpen: false, amount: '' })}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleIncreaseAmount}
              disabled={isPending || !increaseAmountModal.amount}
            >
              {isPending ? '处理中...' : '确认增加'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 延长时间 Modal */}
      <Modal
        isOpen={increaseTimeModal.isOpen}
        onClose={() => setIncreaseTimeModal({ isOpen: false, lockDuration: 7 * 86400 })}
        title="延长锁仓时间"
      >
        <div style={{ padding: spacing.md }}>
          {/* 获取当前NFT信息用于预览 */}
          {(() => {
            const currentNFT = nfts.find((nft) => nft.tokenId === increaseTimeModal.tokenId)
            const currentEnd = currentNFT?.end || 0n
            const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))

            // 简化逻辑：滑块范围从1周到MAX_LOCK_DURATION
            // 具体的4年限制（从创建时间算起）由合约验证
            const minDuration = 7 * 86400 // 最小延长1周
            const maxDuration = Number(maxLockDuration) // 使用合约的MAX_LOCK_DURATION

            // 确保当前选中的duration在有效范围内
            const safeDuration = Math.max(minDuration, Math.min(increaseTimeModal.lockDuration, maxDuration))
            const newEnd = currentEnd + BigInt(safeDuration)

            return (
              <>
                {/* 时长预设按钮 */}
                <div style={{ marginBottom: spacing.lg }}>
                  <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: fontSize.sm, fontWeight: '500' }}>
                    快速选择延长时长
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing.xs }}>
                    {durationPresets.map((preset) => {
                      // 只显示在有效范围内的预设选项
                      const isValid = preset.value >= minDuration && preset.value <= maxDuration
                      return (
                        <Button
                          key={preset.value}
                          variant={increaseTimeModal.lockDuration === preset.value ? 'primary' : 'secondary'}
                          onClick={() => setIncreaseTimeModal({ ...increaseTimeModal, lockDuration: preset.value })}
                          disabled={!isValid}
                          style={{
                            padding: '8px 12px',
                            fontSize: fontSize.xs,
                            whiteSpace: 'nowrap',
                            opacity: isValid ? 1 : 0.5
                          }}
                        >
                          {preset.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* 时间滑块 */}
                <div style={{ marginBottom: spacing.lg }}>
                  <label style={{ display: 'block', marginBottom: spacing.sm, fontSize: fontSize.sm, fontWeight: '500' }}>
                    延长时长
                  </label>
                  <input
                    type="range"
                    min={minDuration}
                    max={maxDuration}
                    step={7 * 86400} // 步长 1 周
                    value={safeDuration}
                    onChange={(e) =>
                      setIncreaseTimeModal({ ...increaseTimeModal, lockDuration: parseInt(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: radius.full,
                      outline: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
                        maxDuration > minDuration ? ((safeDuration - minDuration) / (maxDuration - minDuration)) * 100 : 0
                      }%, ${colors.border} ${
                        maxDuration > minDuration ? ((safeDuration - minDuration) / (maxDuration - minDuration)) * 100 : 0
                      }%, ${colors.border} 100%)`,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    <span style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>
                      最少 1 周
                    </span>
                    <span style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>
                      最多 {Math.floor(maxDuration / 86400 / 365)} 年
                    </span>
                  </div>
                </div>

                {/* 预览信息 */}
                <div
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.bgPrimary,
                    borderRadius: radius.md,
                    marginBottom: spacing.lg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm, color: colors.primary }}>
                    📊 延长预览
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>当前剩余时间</span>
                      <span style={{ fontSize: fontSize.sm, fontWeight: '500' }}>
                        {formatRemainingTime(currentEnd)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>延长时长</span>
                      <span style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.warning }}>
                        + {formatRemainingTime(BigInt(safeDuration) + currentTimestamp)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '1px',
                        backgroundColor: colors.border,
                        margin: `${spacing.xs} 0`
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>延长后剩余时间</span>
                      <span style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.success }}>
                        {formatRemainingTime(newEnd)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>到期时间</span>
                      <span style={{ fontSize: fontSize.xs, color: colors.textTertiary }}>
                        {new Date(Number(newEnd) * 1000).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.sm, lineHeight: 1.6 }}>
                    💡 合约会验证：从 NFT 创建时间算起，总锁定时间不超过 {Math.floor(Number(maxLockDuration) / 86400 / 365)} 年
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setIncreaseTimeModal({ isOpen: false, lockDuration: 7 * 86400 })}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleIncreaseTime}
                    disabled={isPending || !increaseTimeModal.lockDuration}
                  >
                    {isPending ? '处理中...' : '确认延长'}
                  </Button>
                </div>
              </>
            )
          })()}
        </div>
      </Modal>
    </Card>
  )
}
