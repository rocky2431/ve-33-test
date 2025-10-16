import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, Input, Button, Modal } from '../common'
import { TokenInput } from '../Swap/TokenInput'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { useLiquidity, usePairAddress, usePoolInfo } from '../../hooks/useLiquidity'
import { parseTokenAmount, formatTokenAmount } from '../../utils/format'
import { TOKENS, type Token } from '../../constants/tokens'
import { contracts } from '../../config/web3'
import { colors, spacing, fontSize } from '../../constants/theme'
import type { CSSProperties } from 'react'

export function AddLiquidity() {
  const { address: userAddress, isConnected } = useAccount()

  // Token 选择
  const [tokenA, setTokenA] = useState<Token | undefined>(TOKENS.SOLID)
  const [tokenB, setTokenB] = useState<Token | undefined>(TOKENS.WBNB)

  // 输入金额
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')

  // 池类型
  const [stable, setStable] = useState(false)

  // 滑点设置
  const [slippage, setSlippage] = useState(0.5)
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
  const { reserve0, reserve1, totalSupply } = usePoolInfo(pairAddress)

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

  // 添加成功后刷新余额
  useEffect(() => {
    if (isAddSuccess) {
      refetchBalanceA()
      refetchBalanceB()
      setAmountA('')
      setAmountB('')
    }
  }, [isAddSuccess, refetchBalanceA, refetchBalanceB])

  // 根据输入自动计算另一个 Token 的数量
  useEffect(() => {
    if (!amountA || !reserve0 || !reserve1 || !totalSupply || totalSupply === 0n) return

    const calculatedB = (amountABigInt * reserve1) / reserve0
    setAmountB(formatTokenAmount(calculatedB, tokenB?.decimals))
  }, [amountA, reserve0, reserve1, totalSupply, amountABigInt, tokenB?.decimals])

  // 执行添加流动性
  const handleAddLiquidity = async () => {
    if (!userAddress || !tokenA || !tokenB) return

    const amountAMin = (amountABigInt * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const amountBMin = (amountBBigInt * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const deadline = Math.floor(Date.now() / 1000) + 1200 // 20分钟

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
    if (!isConnected) return { text: '连接钱包', disabled: true, action: null }
    if (!tokenA || !tokenB) return { text: '选择代币', disabled: true, action: null }
    if (!amountA || !amountB) return { text: '输入金额', disabled: true, action: null }
    if (balanceA !== undefined && amountABigInt > balanceA)
      return { text: `${tokenA.symbol} 余额不足`, disabled: true, action: null }
    if (balanceB !== undefined && amountBBigInt > balanceB)
      return { text: `${tokenB.symbol} 余额不足`, disabled: true, action: null }
    if (needsApprovalA)
      return { text: `授权 ${tokenA.symbol}`, disabled: false, action: approveA }
    if (needsApprovalB)
      return { text: `授权 ${tokenB.symbol}`, disabled: false, action: approveB }
    return { text: '添加流动性', disabled: false, action: handleAddLiquidity }
  }

  const buttonState = getButtonState()
  const isLoading =
    isApprovingA ||
    isApprovingConfirmA ||
    isApprovingB ||
    isApprovingConfirmB ||
    isAdding ||
    isAddingConfirm

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
    <Card title="添加流动性">
      {/* Token A 输入 */}
      <TokenInput
        label="Token A"
        value={amountA}
        onChange={setAmountA}
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
        onChange={setAmountB}
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
      {pairAddress && reserve0 && reserve1 && totalSupply && totalSupply > 0n && (
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
              1 {tokenA?.symbol} ≈ {formatTokenAmount((reserve1 * 10n ** 18n) / reserve0, 18, 6)}{' '}
              {tokenB?.symbol}
            </span>
          </div>
          <div>
            <span>池份额：</span>
            <span style={{ color: colors.textPrimary }}>
              {amountABigInt > 0n && reserve0
                ? ((amountABigInt * 10000n) / (reserve0 + amountABigInt) / 100n).toString()
                : '0'}
              %
            </span>
          </div>
        </div>
      )}

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
        onClick={buttonState.action || undefined}
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
            textAlign: 'center',
          }}
        >
          ✅ 添加流动性成功！
        </div>
      )}

      {/* 设置 Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="交易设置">
        <div>
          <label style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            滑点容忍度 (%)
          </label>
          <Input
            type="number"
            value={slippage.toString()}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </div>
      </Modal>
    </Card>
  )
}
