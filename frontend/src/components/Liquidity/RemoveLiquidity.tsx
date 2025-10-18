import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, Input, Button } from '../common'
import { useLiquidity, usePoolInfo } from '../../hooks/useLiquidity'
import { useUserLiquidityPositions } from '../../hooks/useUserLiquidityPositions'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { parseTokenAmount, formatTokenAmount } from '../../utils/format'
import { calculateRemoveLiquidity } from '../../utils/calculations'
import { contracts } from '../../config/web3'
import { colors, spacing, fontSize, radius } from '../../constants/theme'
import type { CSSProperties } from 'react'

export function RemoveLiquidity() {
  const { address: userAddress, isConnected } = useAccount()

  // 获取用户所有流动性位置
  const { positions, isLoading: isLoadingPositions } = useUserLiquidityPositions()

  // 选中的池子
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0)
  const selectedPosition = positions[selectedPoolIndex]

  // 移除比例
  const [percentage, setPercentage] = useState(25)
  const [customAmount, setCustomAmount] = useState('')

  // 滑点
  const [slippage] = useState(0.5)

  // 查询选中池子的实时信息
  const { reserve0, reserve1, totalSupply, lpBalance, refetchBalance } = usePoolInfo(
    selectedPosition?.pairAddress
  )

  // 根据 token0/token1 确定储备顺序（这里使用池子本身的 token0/token1）
  const tokenASymbol = selectedPosition?.token0Symbol || selectedPosition?.token0.slice(0, 6)
  const tokenBSymbol = selectedPosition?.token1Symbol || selectedPosition?.token1.slice(0, 6)
  const reserveA = reserve0
  const reserveB = reserve1

  // LP Token 授权
  const {
    approve,
    isApproved,
    isPending: isApproving,
    isConfirming: isApprovingConfirm,
    isSuccess: isApproveSuccess,
    refetchAllowance,
  } = useTokenApprove(selectedPosition?.pairAddress, contracts.router)

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
  const { amount0: amountA, amount1: amountB } =
    lpAmount > 0n && reserveA && reserveB && totalSupply
      ? calculateRemoveLiquidity(lpAmount, totalSupply, reserveA, reserveB)
      : { amount0: 0n, amount1: 0n }

  const needsApproval = selectedPosition?.pairAddress && lpAmount > 0n && !isApproved(lpAmount)

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

  // 执行授权
  const handleApprove = async () => {
    try {
      console.log('🔑 [RemoveLiquidity] 开始授权 LP Token...', {
        pairAddress: selectedPosition?.pairAddress,
        router: contracts.router,
        lpAmount: lpAmount.toString(),
      })
      await approve()
      console.log('✅ [RemoveLiquidity] 授权请求已发送')
    } catch (error) {
      console.error('❌ [RemoveLiquidity] 授权失败:', error)
    }
  }

  // 执行移除流动性
  const handleRemoveLiquidity = async () => {
    if (!userAddress || !selectedPosition) return

    const amountAMin = (amountA * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const amountBMin = (amountB * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const deadline = Math.floor(Date.now() / 1000) + 1200

    await removeLiquidity({
      tokenA: selectedPosition.token0,
      tokenB: selectedPosition.token1,
      stable: selectedPosition.stable,
      liquidity: lpAmount,
      amountAMin,
      amountBMin,
      to: userAddress,
      deadline,
    })
  }

  const getButtonState = () => {
    if (!isConnected) return { text: '连接钱包', disabled: true, action: null }
    if (positions.length === 0) return { text: '无流动性', disabled: true, action: null }
    if (!selectedPosition) return { text: '请选择池子', disabled: true, action: null }
    if (!lpBalance || lpBalance === 0n) return { text: '无流动性', disabled: true, action: null }
    if (lpAmount === 0n) return { text: '输入数量', disabled: true, action: null }
    if (lpAmount > lpBalance) return { text: 'LP 余额不足', disabled: true, action: null }
    if (needsApproval) return { text: '授权 LP Token', disabled: false, action: handleApprove }
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

  // 未连接钱包
  if (!isConnected) {
    return (
      <Card title="移除流动性">
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

  // 加载中
  if (isLoadingPositions) {
    return (
      <Card title="移除流动性">
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: fontSize.lg, marginBottom: spacing.md }}>
            ⏳
          </div>
          <div>正在加载您的流动性位置...</div>
        </div>
      </Card>
    )
  }

  // 没有流动性
  if (positions.length === 0) {
    return (
      <Card title="移除流动性">
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
          <Button
            onClick={() => {
              // 跳转到添加流动性
            }}
          >
            添加流动性
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="移除流动性">
      {/* 池子选择 */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          选择要移除的流动性池
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: spacing.sm,
          }}
        >
          {positions.map((position, index) => (
            <button
              key={position.pairAddress}
              onClick={() => {
                setSelectedPoolIndex(index)
                setCustomAmount('')
                setPercentage(25)
              }}
              style={{
                padding: spacing.md,
                backgroundColor: selectedPoolIndex === index ? colors.primary : colors.bgPrimary,
                border: `1px solid ${selectedPoolIndex === index ? colors.primary : colors.border}`,
                borderRadius: radius.md,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  fontSize: fontSize.md,
                  fontWeight: '600',
                  marginBottom: spacing.xs,
                  color: selectedPoolIndex === index ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {position.token0Symbol || position.token0.slice(0, 6)} /{' '}
                {position.token1Symbol || position.token1.slice(0, 6)}
              </div>
              <div
                style={{
                  fontSize: fontSize.sm,
                  color: selectedPoolIndex === index ? colors.textSecondary : colors.textTertiary,
                }}
              >
                LP: {formatTokenAmount(position.lpBalance, 18, 4)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 选中池子的信息 */}
      {selectedPosition && (
        <>
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
              {tokenASymbol} / {tokenBSymbol}
            </div>
            <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {selectedPosition.stable ? '稳定币池' : '波动性池'}
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
              <div style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>我的 LP Token</div>
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
          {amountA > 0n && amountB > 0n && (
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
                <span style={{ color: colors.textSecondary }}>{tokenASymbol}</span>
                <span style={{ fontWeight: '600' }}>{formatTokenAmount(amountA, 18, 6)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>{tokenBSymbol}</span>
                <span style={{ fontWeight: '600' }}>{formatTokenAmount(amountB, 18, 6)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* 操作按钮 */}
      <Button fullWidth disabled={buttonState.disabled || isLoading} loading={isLoading} onClick={buttonState.action || undefined}>
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
