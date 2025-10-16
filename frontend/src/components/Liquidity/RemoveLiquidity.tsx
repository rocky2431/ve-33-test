import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, Input, Button } from '../common'
import { useLiquidity, usePairAddress, usePoolInfo } from '../../hooks/useLiquidity'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { parseTokenAmount, formatTokenAmount } from '../../utils/format'
import { calculateRemoveLiquidity } from '../../utils/calculations'
import { TOKENS, type Token } from '../../constants/tokens'
import { contracts } from '../../config/web3'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import type { CSSProperties } from 'react'

export function RemoveLiquidity() {
  const { address: userAddress, isConnected } = useAccount()

  // Token 选择
  const [tokenA] = useState<Token | undefined>(TOKENS.SOLID)
  const [tokenB] = useState<Token | undefined>(TOKENS.WBNB)
  const [stable] = useState(false)

  // 移除比例
  const [percentage, setPercentage] = useState(25)
  const [customAmount, setCustomAmount] = useState('')

  // 滑点
  const [slippage] = useState(0.5)

  // 查询池信息
  const pairAddress = usePairAddress(tokenA?.address, tokenB?.address, stable)
  const { reserve0, reserve1, totalSupply, lpBalance, refetchBalance } = usePoolInfo(pairAddress)

  // LP Token 授权
  const {
    approve,
    isApproved,
    isPending: isApproving,
    isConfirming: isApprovingConfirm,
    isSuccess: isApproveSuccess,
    refetchAllowance,
  } = useTokenApprove(pairAddress, contracts.router)

  // 移除流动性
  const {
    removeLiquidity,
    isPending: isRemoving,
    isConfirming: isRemovingConfirm,
    isSuccess: isRemoveSuccess,
  } = useLiquidity()

  // 计算要移除的 LP Token 数量
  const lpAmount = customAmount
    ? parseTokenAmount(customAmount, 18)
    : lpBalance
    ? (lpBalance * BigInt(percentage)) / 100n
    : 0n

  // 计算能获得的 Token 数量
  const { amount0, amount1 } =
    lpAmount > 0n && reserve0 && reserve1 && totalSupply
      ? calculateRemoveLiquidity(lpAmount, totalSupply, reserve0, reserve1)
      : { amount0: 0n, amount1: 0n }

  const needsApproval = pairAddress && lpAmount > 0n && !isApproved(lpAmount)

  // 授权成功后刷新
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance()
  }, [isApproveSuccess, refetchAllowance])

  // 移除成功后刷新
  useEffect(() => {
    if (isRemoveSuccess) {
      refetchBalance()
      setCustomAmount('')
      setPercentage(25)
    }
  }, [isRemoveSuccess, refetchBalance])

  // 执行移除流动性
  const handleRemoveLiquidity = async () => {
    if (!userAddress || !tokenA || !tokenB) return

    const amountAMin = (amount0 * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const amountBMin = (amount1 * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const deadline = Math.floor(Date.now() / 1000) + 1200

    await removeLiquidity({
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      stable,
      liquidity: lpAmount,
      amountAMin,
      amountBMin,
      to: userAddress,
      deadline,
    })
  }

  const getButtonState = () => {
    if (!isConnected) return { text: '连接钱包', disabled: true, action: null }
    if (!pairAddress) return { text: '池不存在', disabled: true, action: null }
    if (!lpBalance || lpBalance === 0n) return { text: '无流动性', disabled: true, action: null }
    if (lpAmount === 0n) return { text: '输入数量', disabled: true, action: null }
    if (lpAmount > lpBalance) return { text: 'LP 余额不足', disabled: true, action: null }
    if (needsApproval) return { text: '授权 LP Token', disabled: false, action: approve }
    return { text: '移除流动性', disabled: false, action: handleRemoveLiquidity }
  }

  const buttonState = getButtonState()
  const isLoading = isApproving || isApprovingConfirm || isRemoving || isRemovingConfirm

  const percentageButtons = [25, 50, 75, 100]

  const percentageButtonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '500',
    backgroundColor: isActive ? colors.primary : colors.bgTertiary,
    color: isActive ? colors.textPrimary : colors.textSecondary,
    border: `1px solid ${isActive ? colors.primary : colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <Card title="移除流动性">
      {/* Token 对显示 */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        }}
      >
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          Token 对
        </div>
        <div style={{ fontSize: fontSize.lg, fontWeight: '600' }}>
          {tokenA?.symbol} / {tokenB?.symbol}
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          {stable ? '稳定币池' : '波动性池'}
        </div>
      </div>

      {/* LP 余额显示 */}
      {lpBalance !== undefined && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: radius.md,
            marginBottom: spacing.md,
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            我的 LP Token
          </div>
          <div style={{ fontSize: fontSize.xl, fontWeight: '600', marginTop: spacing.xs }}>
            {formatTokenAmount(lpBalance, 18, 6)}
          </div>
        </div>
      )}

      {/* 移除比例选择 */}
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          移除比例
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {percentageButtons.map((pct) => (
            <button
              key={pct}
              onClick={() => {
                setPercentage(pct)
                setCustomAmount('')
              }}
              style={percentageButtonStyle(percentage === pct && !customAmount)}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* 或自定义数量 */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          或输入自定义数量
        </div>
        <Input
          type="number"
          placeholder="0.0"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value)
            setPercentage(0)
          }}
          fullWidth
        />
      </div>

      {/* 预计获得 */}
      {amount0 > 0n && amount1 > 0n && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: radius.md,
            marginBottom: spacing.lg,
          }}
        >
          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md }}>
            预计获得
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <span style={{ color: colors.textSecondary }}>{tokenA?.symbol}</span>
            <span style={{ fontWeight: '600' }}>
              {formatTokenAmount(amount0, tokenA?.decimals, 6)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textSecondary }}>{tokenB?.symbol}</span>
            <span style={{ fontWeight: '600' }}>
              {formatTokenAmount(amount1, tokenB?.decimals, 6)}
            </span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <Button
        fullWidth
        disabled={buttonState.disabled || isLoading}
        loading={isLoading}
        onClick={buttonState.action || undefined}
      >
        {buttonState.text}
      </Button>

      {/* 成功提示 */}
      {isRemoveSuccess && (
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
          ✅ 移除流动性成功！
        </div>
      )}
    </Card>
  )
}
