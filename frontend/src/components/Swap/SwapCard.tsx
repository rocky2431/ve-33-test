import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { Token, Route } from '../../types'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { TokenInput } from './TokenInput'
import { useTokenBalance } from '../../hooks/useTokenBalance'
import { useTokenApprove } from '../../hooks/useTokenApprove'
import { useSwap, useSwapQuote } from '../../hooks/useSwap'
import { parseTokenAmount, formatTokenAmount, calculateMinOutput } from '../../utils/format'
import { TOKENS } from '../../constants/tokens'
import { contracts } from '../../config/web3'

export function SwapCard() {
  const { address: userAddress, isConnected } = useAccount()

  // Token 选择
  const [tokenIn, setTokenIn] = useState<Token | undefined>(TOKENS.SOLID)
  const [tokenOut, setTokenOut] = useState<Token | undefined>(TOKENS.WBNB)

  // 输入金额
  const [amountIn, setAmountIn] = useState('')
  const [slippage] = useState(0.5) // 0.5% 默认滑点

  // Token 余额
  const { balance: balanceIn, refetch: refetchBalanceIn } = useTokenBalance(
    tokenIn?.address,
    userAddress
  )

  // 构建路由
  const routes: Route[] =
    tokenIn && tokenOut
      ? [
          {
            from: tokenIn.address,
            to: tokenOut.address,
            stable: false, // 波动性资产池
          },
        ]
      : []

  // 查询输出金额
  const amountInBigInt = parseTokenAmount(amountIn, tokenIn?.decimals)
  const { amountOut } = useSwapQuote(
    amountInBigInt > 0n ? amountInBigInt : undefined,
    routes.length > 0 ? routes : undefined
  )

  // Token 授权
  const {
    approve,
    isApproved,
    isPending: isApproving,
    isConfirming: isApprovingConfirm,
    isSuccess: isApproveSuccess,
    refetchAllowance,
  } = useTokenApprove(tokenIn?.address, contracts.router)

  // Swap 操作
  const {
    swap,
    isPending: isSwapping,
    isConfirming: isSwappingConfirm,
    isSuccess: isSwapSuccess,
  } = useSwap()

  // 检查是否需要授权
  const needsApproval =
    tokenIn && amountInBigInt > 0n && !isApproved(amountInBigInt)

  // 授权成功后刷新
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  // Swap 成功后刷新余额
  useEffect(() => {
    if (isSwapSuccess) {
      refetchBalanceIn()
      setAmountIn('')
    }
  }, [isSwapSuccess, refetchBalanceIn])

  // 执行授权
  const handleApprove = async () => {
    if (!tokenIn) return
    await approve()
  }

  // 执行 Swap
  const handleSwap = async () => {
    if (!userAddress || !tokenIn || !tokenOut || !amountOut) return

    const amountOutMin = calculateMinOutput(amountOut, slippage)
    const deadline = Math.floor(Date.now() / 1000) + 1200 // 20 分钟

    await swap({
      amountIn: amountInBigInt,
      amountOutMin,
      routes,
      to: userAddress,
      deadline,
    })
  }

  // 交换 Token 位置
  const handleSwitchTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
  }

  // 判断按钮状态
  const getButtonState = () => {
    if (!isConnected) return { text: '连接钱包', disabled: true }
    if (!tokenIn || !tokenOut) return { text: '选择代币', disabled: true }
    if (!amountIn || parseFloat(amountIn) === 0)
      return { text: '输入金额', disabled: true }
    if (balanceIn !== undefined && amountInBigInt > balanceIn)
      return { text: '余额不足', disabled: true }
    if (!amountOut) return { text: '查询价格中...', disabled: true }
    if (needsApproval) return { text: `授权 ${tokenIn.symbol}`, disabled: false }
    return { text: '交换', disabled: false }
  }

  const buttonState = getButtonState()
  const isLoading =
    isApproving || isApprovingConfirm || isSwapping || isSwappingConfirm

  return (
    <Card title="Swap">
      {/* Token 输入 */}
      <TokenInput
        label="卖出"
        value={amountIn}
        onChange={setAmountIn}
        token={tokenIn}
        onSelectToken={setTokenIn}
        balance={balanceIn !== undefined ? balanceIn : undefined}
      />

      {/* 交换按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '16px 0',
        }}
      >
        <button
          onClick={handleSwitchTokens}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#0a0a0a'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a'
          }}
        >
          ⇅
        </button>
      </div>

      {/* Token 输出 */}
      <TokenInput
        label="买入"
        value={
          amountOut && tokenOut
            ? formatTokenAmount(amountOut, tokenOut.decimals)
            : ''
        }
        onChange={() => {}}
        token={tokenOut}
        onSelectToken={setTokenOut}
        readOnly
      />

      {/* 价格信息 */}
      {amountOut && tokenIn && tokenOut && amountInBigInt > 0n && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#0a0a0a',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#888',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span>价格</span>
            <span>
              1 {tokenIn.symbol} ≈{' '}
              {formatTokenAmount(
                (amountOut * BigInt(10 ** tokenIn.decimals)) / amountInBigInt,
                tokenOut.decimals,
                6
              )}{' '}
              {tokenOut.symbol}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>滑点容忍度</span>
            <span>{slippage}%</span>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <Button
        fullWidth
        disabled={buttonState.disabled || isLoading}
        loading={isLoading}
        onClick={needsApproval ? handleApprove : handleSwap}
        style={{ marginTop: '20px' }}
      >
        {buttonState.text}
      </Button>

      {/* 成功提示 */}
      {isSwapSuccess && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#1a4d2e',
            border: '1px solid #4ade80',
            borderRadius: '8px',
            color: '#4ade80',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          ✅ 交换成功！
        </div>
      )}
    </Card>
  )
}
