import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, Input, Button, Modal } from '../common'
import { TokenInput } from '../Swap/TokenInput'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { useLiquidity, usePairAddress, usePoolInfo } from '../../hooks/useLiquidity'
import { useAutoGauge, useGaugeAddress } from '../../hooks/useAutoGauge'
import { parseTokenAmount, formatTokenAmount } from '../../utils/format'
import { TOKENS, type Token } from '../../constants/tokens'
import { contracts } from '../../config/web3'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { CSSProperties } from 'react'
import { zeroAddress } from 'viem'

export function AddLiquidity() {
  const { address: userAddress, isConnected } = useAccount()

  // Token 选择
  const [tokenA, setTokenA] = useState<Token | undefined>(TOKENS.SRT)
  const [tokenB, setTokenB] = useState<Token | undefined>(TOKENS.WSRT)

  // 输入金额
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')

  // 池类型
  const [stable, setStable] = useState(false)

  // 滑点设置 - 提高默认值到1%以减少失败
  const [slippage, setSlippage] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)

  // Token 余额
  const { balance: balanceA, refetch: refetchBalanceA } = useTokenBalance(
    tokenA?.address,
    userAddress
  )
  const { balance: balanceB, refetch: refetchBalanceB } = useTokenBalance(
    tokenB?.address,
    userAddress
  )

  // 查询池地址和信息
  const pairAddress = usePairAddress(tokenA?.address, tokenB?.address, stable)
  const { token0, token1, reserve0, reserve1, totalSupply } = usePoolInfo(pairAddress)

  // 根据 token0/token1 的顺序，确定 reserveA 和 reserveB
  // tokenA 可能对应 token0 或 token1，需要判断
  const isTokenAFirst = tokenA && token0 && tokenA.address.toLowerCase() === token0.toLowerCase()
  const reserveA = isTokenAFirst ? reserve0 : reserve1
  const reserveB = isTokenAFirst ? reserve1 : reserve0

  // Token 授权
  const {
    approve: approveA,
    isApproved: isApprovedA,
    isPending: isApprovingA,
    isConfirming: isApprovingConfirmA,
    isSuccess: isApproveSuccessA,
    refetchAllowance: refetchAllowanceA,
  } = useTokenApprove(tokenA?.address, contracts.router)

  const {
    approve: approveB,
    isApproved: isApprovedB,
    isPending: isApprovingB,
    isConfirming: isApprovingConfirmB,
    isSuccess: isApproveSuccessB,
    refetchAllowance: refetchAllowanceB,
  } = useTokenApprove(tokenB?.address, contracts.router)

  // 添加流动性
  const {
    addLiquidity,
    isPending: isAdding,
    isConfirming: isAddingConfirm,
    isSuccess: isAddSuccess,
  } = useLiquidity()

  // 自动创建Gauge
  const {
    createGauge,
    isPending: isCreatingGauge,
    isConfirming: isConfirmingGauge,
    isSuccess: isGaugeCreated,
  } = useAutoGauge()

  // 查询池子是否有Gauge
  const { hasGauge, refetch: refetchGauge } = useGaugeAddress(pairAddress)

  const [needsGauge, setNeedsGauge] = useState(false)
  const [isCheckingGauge, setIsCheckingGauge] = useState(false)

  const amountABigInt = parseTokenAmount(amountA, tokenA?.decimals)
  const amountBBigInt = parseTokenAmount(amountB, tokenB?.decimals)

  // 检查授权
  const needsApprovalA = tokenA && amountABigInt > 0n && !isApprovedA(amountABigInt)
  const needsApprovalB = tokenB && amountBBigInt > 0n && !isApprovedB(amountBBigInt)

  // 授权成功后刷新
  useEffect(() => {
    if (isApproveSuccessA) refetchAllowanceA()
  }, [isApproveSuccessA, refetchAllowanceA])

  useEffect(() => {
    if (isApproveSuccessB) refetchAllowanceB()
  }, [isApproveSuccessB, refetchAllowanceB])

  // 添加成功后刷新余额并检查Gauge
  useEffect(() => {
    if (isAddSuccess && tokenA && tokenB && pairAddress) {
      console.log('✅ [AddLiquidity] 流动性添加成功！')
      console.log('🔍 [AutoGauge] 池子地址:', pairAddress)

      refetchBalanceA()
      refetchBalanceB()
      setAmountA('')
      setAmountB('')

      // 等待区块链状态更新后检查Gauge
      const checkAndCreateGauge = async () => {
        setIsCheckingGauge(true)
        console.log('🔍 [AutoGauge] 开始检查池子Gauge状态')

        // 等待区块链状态更新
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // 刷新Gauge状态
        const result = await refetchGauge()
        const currentHasGauge = result.data && result.data !== zeroAddress

        console.log('🔍 [AutoGauge] Gauge检查结果:', {
          poolAddress: pairAddress,
          gaugeAddress: result.data,
          hasGauge: currentHasGauge,
        })

        if (!currentHasGauge) {
          console.log('🎯 [AutoGauge] 池子没有Gauge，将自动创建')
          setNeedsGauge(true)
        } else {
          console.log('✅ [AutoGauge] 池子已有Gauge，无需创建')
        }

        setIsCheckingGauge(false)
      }

      checkAndCreateGauge()
    }
  }, [isAddSuccess, tokenA, tokenB, pairAddress, refetchBalanceA, refetchBalanceB, refetchGauge])

  // 自动创建Gauge
  useEffect(() => {
    if (needsGauge && !isCreatingGauge && !isConfirmingGauge && pairAddress) {
      console.log('🚀 [AutoGauge] 触发创建Gauge...', pairAddress)
      console.log('  - needsGauge:', needsGauge)
      console.log('  - isCreatingGauge:', isCreatingGauge)
      console.log('  - isConfirmingGauge:', isConfirmingGauge)

      // 调用createGauge并处理Promise
      createGauge(pairAddress)
        .then(() => {
          console.log('✅ [AutoGauge] createGauge调用成功')
        })
        .catch((error) => {
          console.error('❌ [AutoGauge] createGauge调用失败:', error)
          // 失败时重置状态，允许用户重试
          setNeedsGauge(false)
        })

      // 注意：不要立即重置needsGauge，让isPending或isConfirming来控制
    }
  }, [needsGauge, isCreatingGauge, isConfirmingGauge, pairAddress])

  // 创建开始时重置needsGauge
  useEffect(() => {
    if (isCreatingGauge || isConfirmingGauge) {
      console.log('🔄 [AutoGauge] Gauge创建进行中，重置needsGauge状态')
      setNeedsGauge(false)
    }
  }, [isCreatingGauge, isConfirmingGauge])

  // Gauge创建成功
  useEffect(() => {
    if (isGaugeCreated) {
      console.log('✅ [AutoGauge] Gauge创建成功！')
      refetchGauge()
    }
  }, [isGaugeCreated, refetchGauge])

  // 跟踪用户最后修改的是哪个输入框
  const [lastChanged, setLastChanged] = useState<'A' | 'B'>('A')

  // 根据输入自动计算另一个 Token 的数量 - 双向同步
  useEffect(() => {
    // 如果池子不存在或没有reserve，不自动计算
    if (!reserveA || !reserveB || !totalSupply || totalSupply === 0n) return

    // 根据最后修改的是哪个输入框，自动计算另一个
    if (lastChanged === 'A') {
      if (amountA && amountABigInt > 0n) {
        const calculatedB = (amountABigInt * reserveB) / reserveA
        const newAmountB = formatTokenAmount(calculatedB, tokenB?.decimals)
        // 只在值真的变化时才更新，避免循环
        if (newAmountB !== amountB) {
          setAmountB(newAmountB)
        }
      } else {
        setAmountB('')
      }
    } else if (lastChanged === 'B') {
      if (amountB && amountBBigInt > 0n) {
        const calculatedA = (amountBBigInt * reserveA) / reserveB
        const newAmountA = formatTokenAmount(calculatedA, tokenA?.decimals)
        // 只在值真的变化时才更新，避免循环
        if (newAmountA !== amountA) {
          setAmountA(newAmountA)
        }
      } else {
        setAmountA('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountABigInt, amountBBigInt, reserveA, reserveB, totalSupply, tokenA?.decimals, tokenB?.decimals, lastChanged])

  // 执行授权 Token A
  const handleApproveA = async () => {
    if (!tokenA) return
    await approveA()
  }

  // 执行授权 Token B
  const handleApproveB = async () => {
    if (!tokenB) return
    await approveB()
  }

  // 执行添加流动性
  const handleAddLiquidity = async () => {
    if (!userAddress || !tokenA || !tokenB) return

    // 对于新池子，使用更宽松的min值（设为0）以避免比例问题
    // 对于已存在的池子，正常使用滑点计算
    const isNewPool = !pairAddress || pairAddress === zeroAddress

    const amountAMin = isNewPool ? 0n : (amountABigInt * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const amountBMin = isNewPool ? 0n : (amountBBigInt * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const deadline = Math.floor(Date.now() / 1000) + 1200 // 20分钟

    console.log('🔍 [AddLiquidity] 添加流动性参数:', {
      isNewPool,
      amountADesired: amountABigInt.toString(),
      amountBDesired: amountBBigInt.toString(),
      amountAMin: amountAMin.toString(),
      amountBMin: amountBMin.toString(),
    })

    await addLiquidity({
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      stable,
      amountADesired: amountABigInt,
      amountBDesired: amountBBigInt,
      amountAMin,
      amountBMin,
      to: userAddress,
      deadline,
    })
  }

  // 判断按钮状态
  const getButtonState = () => {
    console.log('🔍 [AddLiquidity] Button State Debug:', {
      isConnected,
      tokenA: tokenA?.symbol,
      tokenB: tokenB?.symbol,
      amountA,
      amountB,
      amountABigInt: amountABigInt.toString(),
      amountBBigInt: amountBBigInt.toString(),
      balanceA: balanceA?.toString(),
      balanceB: balanceB?.toString(),
      needsApprovalA,
      needsApprovalB,
    })

    if (!isConnected) {
      console.log('❌ [AddLiquidity] 未连接钱包')
      return { text: '连接钱包', disabled: true }
    }
    if (!tokenA || !tokenB) {
      console.log('❌ [AddLiquidity] 未选择代币')
      return { text: '选择代币', disabled: true }
    }
    if (!amountA || !amountB) {
      console.log('❌ [AddLiquidity] 未输入金额')
      return { text: '输入金额', disabled: true }
    }
    if (balanceA !== undefined && amountABigInt > balanceA) {
      console.log('❌ [AddLiquidity] Token A 余额不足')
      return { text: `${tokenA.symbol} 余额不足`, disabled: true }
    }
    if (balanceB !== undefined && amountBBigInt > balanceB) {
      console.log('❌ [AddLiquidity] Token B 余额不足')
      return { text: `${tokenB.symbol} 余额不足`, disabled: true }
    }
    if (needsApprovalA) {
      console.log('✅ [AddLiquidity] 需要授权 Token A')
      return { text: `授权 ${tokenA.symbol}`, disabled: false }
    }
    if (needsApprovalB) {
      console.log('✅ [AddLiquidity] 需要授权 Token B')
      return { text: `授权 ${tokenB.symbol}`, disabled: false }
    }
    console.log('✅ [AddLiquidity] 可以添加流动性')
    return { text: '添加流动性', disabled: false }
  }

  const buttonState = getButtonState()
  const isLoading =
    isApprovingA ||
    isApprovingConfirmA ||
    isApprovingB ||
    isApprovingConfirmB ||
    isAdding ||
    isAddingConfirm

  // 根据状态决定onClick handler
  const getButtonHandler = () => {
    if (!isConnected || !tokenA || !tokenB || !amountA || !amountB) return undefined
    if (balanceA !== undefined && amountABigInt > balanceA) return undefined
    if (balanceB !== undefined && amountBBigInt > balanceB) return undefined
    if (needsApprovalA) return handleApproveA
    if (needsApprovalB) return handleApproveB
    return handleAddLiquidity
  }

  const poolTypeStyle: CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    marginTop: spacing.md,
  }

  const typeButtonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.md,
    fontWeight: '500',
    backgroundColor: isActive ? colors.primary : colors.bgTertiary,
    color: isActive ? colors.textPrimary : colors.textSecondary,
    border: `1px solid ${isActive ? colors.primary : colors.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <Card
      title="添加流动性"
      extra={
        <Button
          variant="secondary"
          onClick={() => setShowSettings(true)}
          style={{ padding: '6px 12px', fontSize: fontSize.sm }}
        >
          ⚙️ 设置
        </Button>
      }
    >
      {/* Token A 输入 */}
      <TokenInput
        label="Token A"
        value={amountA}
        onChange={(value) => {
          setAmountA(value)
          setLastChanged('A')
        }}
        token={tokenA}
        onSelectToken={setTokenA}
        balance={balanceA !== undefined ? balanceA : undefined}
      />

      {/* 加号 */}
      <div style={{ textAlign: 'center', margin: `${spacing.md} 0`, fontSize: fontSize.xl }}>
        +
      </div>

      {/* Token B 输入 */}
      <TokenInput
        label="Token B"
        value={amountB}
        onChange={(value) => {
          setAmountB(value)
          setLastChanged('B')
        }}
        token={tokenB}
        onSelectToken={setTokenB}
        balance={balanceB !== undefined ? balanceB : undefined}
      />

      {/* 池类型选择 */}
      <div style={poolTypeStyle}>
        <button style={typeButtonStyle(!stable)} onClick={() => setStable(false)}>
          <div>波动性池</div>
          <div style={{ fontSize: fontSize.sm, marginTop: '4px' }}>适合常规代币对</div>
        </button>
        <button style={typeButtonStyle(stable)} onClick={() => setStable(true)}>
          <div>稳定币池</div>
          <div style={{ fontSize: fontSize.sm, marginTop: '4px' }}>适合稳定币对</div>
        </button>
      </div>

      {/* 池信息 */}
      {pairAddress && reserveA && reserveB && totalSupply && totalSupply > 0n ? (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.bgPrimary,
            borderRadius: '8px',
            fontSize: fontSize.sm,
            color: colors.textSecondary,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <span>当前价格：</span>
            <span style={{ color: colors.textPrimary }}>
              1 {tokenA?.symbol} ≈ {formatTokenAmount((reserveB * 10n ** 18n) / reserveA, 18, 6)}{' '}
              {tokenB?.symbol}
            </span>
          </div>
          <div>
            <span>池份额：</span>
            <span style={{ color: colors.textPrimary }}>
              {amountABigInt > 0n && reserveA
                ? ((amountABigInt * 10000n) / (reserveA + amountABigInt) / 100n).toString()
                : '0'}
              %
            </span>
          </div>
        </div>
      ) : null}

      {/* 首次创建池提示 */}
      {!pairAddress && tokenA && tokenB && (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: `${colors.info}22`,
            border: `1px solid ${colors.info}`,
            borderRadius: '8px',
            fontSize: fontSize.sm,
            color: colors.info,
          }}
        >
          💡 这将创建一个新的流动性池
        </div>
      )}

      {/* 操作按钮 */}
      <Button
        fullWidth
        disabled={buttonState.disabled || isLoading}
        loading={isLoading}
        onClick={getButtonHandler()}
        style={{ marginTop: spacing.lg }}
      >
        {buttonState.text}
      </Button>

      {/* 成功提示 */}
      {isAddSuccess && (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: `${colors.success}22`,
            border: `1px solid ${colors.success}`,
            borderRadius: '8px',
            color: colors.success,
            fontSize: fontSize.sm,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            ✅ 添加流动性成功！
          </div>

          {/* Gauge创建状态 */}
          {isCheckingGauge && (
            <div style={{ textAlign: 'center', color: colors.info }}>
              🔍 正在检查是否需要创建Gauge...
            </div>
          )}

          {(isCreatingGauge || isConfirmingGauge) && (
            <div style={{ textAlign: 'center', color: colors.info }}>
              🎯 正在为池子创建Gauge... 请确认交易
            </div>
          )}

          {isGaugeCreated && (
            <div style={{ textAlign: 'center', color: colors.success }}>
              🎉 Gauge创建成功！现在可以在Farms页面看到这个池子了
            </div>
          )}

          {!hasGauge && !isCheckingGauge && !isCreatingGauge && !isConfirmingGauge && !isGaugeCreated && (
            <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs }}>
              💡 系统将自动为新池子创建Gauge
            </div>
          )}
        </div>
      )}

      {/* 收益来源说明 */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.bgPrimary,
          borderRadius: '8px',
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: spacing.sm, color: colors.textPrimary, fontSize: fontSize.md }}>
          💰 添加流动性后您将获得
        </div>
        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 1.8 }}>
          <div style={{ marginBottom: spacing.xs }}>
            ✅ <strong style={{ color: colors.textPrimary }}>LP Token</strong>：代表您的流动性份额
          </div>
          <div style={{ marginBottom: spacing.xs }}>
            ✅ <strong style={{ color: colors.textPrimary }}>交易手续费</strong>：0.3% 手续费自动复投，增加 LP 价值
          </div>
          <div style={{ marginBottom: spacing.xs }}>
            ✅ <strong style={{ color: colors.textPrimary }}>SRT 排放奖励</strong>：将 LP Token 质押到 Gauge 可领取
          </div>
          <div style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.bgSecondary, borderRadius: '4px' }}>
            <span style={{ color: colors.primary }}>💡 提示：</span>
            <span style={{ color: colors.textTertiary }}>
              {' '}添加流动性后，前往 "Gauge" 页面质押 LP Token 以获得更多 SRT 排放奖励
            </span>
          </div>
        </div>
      </div>

      {/* 设置 Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="交易设置">
        <div>
          <label style={{ fontSize: fontSize.sm, color: colors.textSecondary, display: 'block', marginBottom: spacing.xs }}>
            滑点容忍度 (%)
          </label>
          <Input
            type="number"
            value={slippage.toString()}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 1.0)}
            fullWidth
            style={{ marginBottom: spacing.md }}
          />

          {/* 预设滑点选项 */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <Button
              variant={slippage === 0.5 ? 'primary' : 'secondary'}
              onClick={() => setSlippage(0.5)}
              style={{ flex: 1, padding: '8px', fontSize: fontSize.sm }}
            >
              0.5%
            </Button>
            <Button
              variant={slippage === 1.0 ? 'primary' : 'secondary'}
              onClick={() => setSlippage(1.0)}
              style={{ flex: 1, padding: '8px', fontSize: fontSize.sm }}
            >
              1.0%
            </Button>
            <Button
              variant={slippage === 2.0 ? 'primary' : 'secondary'}
              onClick={() => setSlippage(2.0)}
              style={{ flex: 1, padding: '8px', fontSize: fontSize.sm }}
            >
              2.0%
            </Button>
          </div>

          {/* 警告提示 */}
          {slippage > 2.0 && (
            <div
              style={{
                marginTop: spacing.md,
                padding: spacing.sm,
                backgroundColor: `${colors.warning}22`,
                border: `1px solid ${colors.warning}`,
                borderRadius: '6px',
                fontSize: fontSize.xs,
                color: colors.warning,
              }}
            >
              ⚠️ 高滑点可能导致价格损失
            </div>
          )}

          <div
            style={{
              marginTop: spacing.md,
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            💡 滑点是指交易执行价格与预期价格的差异。较高的滑点容忍度可以降低交易失败率，但可能会遭受更大的价格滑动。
          </div>
        </div>
      </Modal>
    </Card>
  )
}
