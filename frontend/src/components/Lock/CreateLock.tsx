import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, Input, Button } from '../common'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { useVeNFT } from '../../hooks/useVeNFT'
import { parseTokenAmount, formatTokenAmount } from '../../utils/format'
import { calculateVotingPower, calculateLockEnd, formatRemainingTime } from '../../utils/calculations'
import { TOKENS } from '../../constants/tokens'
import { contracts } from '../../config/web3'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import type { CSSProperties } from 'react'

export function CreateLock() {
  const { address: userAddress, isConnected } = useAccount()

  const [amount, setAmount] = useState('')
  const [lockDuration, setLockDuration] = useState(31536000) // 默认 1 年（秒）

  // SOLID 余额
  const { balance, refetch: refetchBalance } = useTokenBalance(
    TOKENS.SRT.address,
    userAddress
  )

  // SOLID 授权
  const {
    approve,
    isApproved,
    isPending: isApproving,
    isConfirming: isApprovingConfirm,
    isSuccess: isApproveSuccess,
    refetchAllowance,
  } = useTokenApprove(TOKENS.SRT.address, contracts.votingEscrow)

  // 创建锁仓
  const {
    createLock,
    isPending: isCreating,
    isConfirming: isCreatingConfirm,
    isSuccess: isCreateSuccess,
  } = useVeNFT()

  const amountBigInt = parseTokenAmount(amount, 18)
  const needsApproval = amountBigInt > 0n && !isApproved(amountBigInt)

  // 计算锁定结束时间和投票权重
  const lockEnd = calculateLockEnd(lockDuration)
  const votingPower =
    amountBigInt > 0n ? calculateVotingPower(amountBigInt, lockEnd) : 0n

  // 授权成功后刷新
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance()
  }, [isApproveSuccess, refetchAllowance])

  // 创建成功后刷新余额
  useEffect(() => {
    if (isCreateSuccess) {
      refetchBalance()
      setAmount('')
    }
  }, [isCreateSuccess, refetchBalance])

  // 执行授权
  const handleApprove = async () => {
    await approve()
  }

  // 执行创建锁仓
  const handleCreateLock = async () => {
    await createLock(amountBigInt, lockDuration)
  }

  const getButtonState = () => {
    console.log('🔍 [CreateLock] Button State Debug:', {
      isConnected,
      amount,
      amountBigInt: amountBigInt.toString(),
      balance: balance?.toString(),
      needsApproval,
    })

    if (!isConnected) {
      console.log('❌ [CreateLock] 未连接钱包')
      return { text: '连接钱包', disabled: true }
    }
    if (!amount || amountBigInt === 0n) {
      console.log('❌ [CreateLock] 未输入金额')
      return { text: '输入金额', disabled: true }
    }
    if (balance !== undefined && amountBigInt > balance) {
      console.log('❌ [CreateLock] SRT 余额不足')
      return { text: 'SRT 余额不足', disabled: true }
    }
    if (needsApproval) {
      console.log('✅ [CreateLock] 需要授权 SRT')
      return { text: '授权 SRT', disabled: false }
    }
    console.log('✅ [CreateLock] 可以创建锁仓')
    return { text: '创建锁仓', disabled: false }
  }

  const buttonState = getButtonState()
  const isLoading = isApproving || isApprovingConfirm || isCreating || isCreatingConfirm

  // 根据状态决定onClick handler
  const getButtonHandler = () => {
    if (!isConnected || !amount || amountBigInt === 0n) return undefined
    if (balance !== undefined && amountBigInt > balance) return undefined
    if (needsApproval) return handleApprove
    return handleCreateLock
  }

  // 预设锁仓时长
  const durationPresets = [
    { label: '1 周', value: 7 * 86400 },
    { label: '1 个月', value: 30 * 86400 },
    { label: '3 个月', value: 90 * 86400 },
    { label: '6 个月', value: 180 * 86400 },
    { label: '1 年', value: 365 * 86400 },
    { label: '2 年', value: 2 * 365 * 86400 },
    { label: '4 年', value: 4 * 365 * 86400 },
  ]

  const presetButtonStyle = (isActive: boolean): CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: '500',
    backgroundColor: isActive ? colors.primary : colors.bgTertiary,
    color: isActive ? colors.textPrimary : colors.textSecondary,
    border: `1px solid ${isActive ? colors.primary : colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  })

  return (
    <Card title="创建 ve-NFT 锁仓">
      {/* 锁仓金额输入 */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          锁仓数量
        </div>
        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          rightElement={
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
                SOLID
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  if (balance) setAmount(formatTokenAmount(balance, 18))
                }}
                disabled={!balance || balance === 0n}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                MAX
              </Button>
            </div>
          }
        />
        {balance !== undefined && (
          <div style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs }}>
            余额: {formatTokenAmount(balance, 18, 4)} SOLID
          </div>
        )}
      </div>

      {/* 锁仓时长选择 */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          锁仓时长
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          {durationPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setLockDuration(preset.value)}
              style={presetButtonStyle(lockDuration === preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 滑块 */}
        <input
          type="range"
          min={7 * 86400} // 最小 1 周
          max={4 * 365 * 86400} // 最大 4 年
          step={7 * 86400} // 步长 1 周
          value={lockDuration}
          onChange={(e) => setLockDuration(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: radius.full,
            outline: 'none',
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${
              ((lockDuration - 7 * 86400) / (4 * 365 * 86400 - 7 * 86400)) * 100
            }%, ${colors.border} ${
              ((lockDuration - 7 * 86400) / (4 * 365 * 86400 - 7 * 86400)) * 100
            }%, ${colors.border} 100%)`,
          }}
        />
      </div>

      {/* 预览信息 */}
      {amountBigInt > 0n && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: radius.md,
            marginBottom: spacing.lg,
          }}
        >
          <div style={{ fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.md }}>
            锁仓预览
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <span style={{ color: colors.textSecondary }}>锁仓时长</span>
            <span style={{ fontWeight: '500' }}>
              {formatRemainingTime(lockEnd)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <span style={{ color: colors.textSecondary }}>解锁时间</span>
            <span style={{ fontWeight: '500' }}>
              {new Date(Number(lockEnd) * 1000).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textSecondary }}>预估投票权重</span>
            <span style={{ fontWeight: '600', color: colors.primary }}>
              {formatTokenAmount(votingPower, 18, 4)}
            </span>
          </div>

          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.sm,
              backgroundColor: `${colors.info}22`,
              border: `1px solid ${colors.info}`,
              borderRadius: radius.sm,
              fontSize: fontSize.xs,
              color: colors.info,
            }}
          >
            💡 锁仓时间越长，获得的投票权重越高
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <Button
        fullWidth
        disabled={buttonState.disabled || isLoading}
        loading={isLoading}
        onClick={getButtonHandler()}
      >
        {buttonState.text}
      </Button>

      {/* 成功提示 */}
      {isCreateSuccess && (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: `${colors.success}22`,
            border: `1px solid ${colors.success}`,
            borderRadius: radius.md,
            color: colors.success,
            fontSize: fontSize.sm,
            textAlign: 'center',
          }}
        >
          ✅ 创建 ve-NFT 成功！
        </div>
      )}

      {/* 说明 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: radius.md,
          fontSize: fontSize.sm,
          color: colors.textSecondary,
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.textPrimary }}>
          关于 ve-NFT
        </div>
        <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
          <li>锁仓 SOLID 代币获得 ve-NFT（ERC-721）</li>
          <li>ve-NFT 代表您的投票权重</li>
          <li>可用于投票决定每周激励分配</li>
          <li>获得投票池的交易手续费和贿赂奖励</li>
          <li>锁仓期间获得代币增发补偿</li>
        </ul>
      </div>
    </Card>
  )
}
