import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, Table, Badge, Button, Modal, type Column } from '../common'
import { useUserVeNFTs, useVeNFT } from '../../hooks/useVeNFT'
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

export function MyVeNFTs() {
  const { isConnected } = useAccount()
  const { balance, nfts: rawNfts, isLoading } = useUserVeNFTs()
  const { increaseAmount, increaseUnlockTime, withdraw, isPending, isSuccess } = useVeNFT()

  // Modal 状态管理
  const [increaseAmountModal, setIncreaseAmountModal] = useState<{
    isOpen: boolean
    tokenId?: bigint
    amount: string
  }>({ isOpen: false, amount: '' })

  const [increaseTimeModal, setIncreaseTimeModal] = useState<{
    isOpen: boolean
    tokenId?: bigint
    days: string
  }>({ isOpen: false, days: '' })

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
                onClick={() => setIncreaseTimeModal({ isOpen: true, tokenId: record.tokenId, days: '' })}
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
    if (!increaseTimeModal.tokenId || !increaseTimeModal.days) return

    try {
      const days = parseInt(increaseTimeModal.days)
      const duration = days * 24 * 60 * 60 // 转换为秒
      await increaseUnlockTime(increaseTimeModal.tokenId, duration)
      setIncreaseTimeModal({ isOpen: false, days: '' })
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
                color: colors.text,
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
        onClose={() => setIncreaseTimeModal({ isOpen: false, days: '' })}
        title="延长锁仓时间"
      >
        <div style={{ padding: spacing.md }}>
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ display: 'block', marginBottom: spacing.xs, fontSize: fontSize.sm }}>
              延长天数
            </label>
            <input
              type="number"
              value={increaseTimeModal.days}
              onChange={(e) => setIncreaseTimeModal({ ...increaseTimeModal, days: e.target.value })}
              placeholder="输入要延长的天数"
              style={{
                width: '100%',
                padding: spacing.sm,
                fontSize: fontSize.sm,
                borderRadius: radius.sm,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bgSecondary,
                color: colors.text,
              }}
            />
            <div style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs }}>
              💡 延长后的总锁仓时间不能超过 4 年
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setIncreaseTimeModal({ isOpen: false, days: '' })}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleIncreaseTime}
              disabled={isPending || !increaseTimeModal.days}
            >
              {isPending ? '处理中...' : '确认延长'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
