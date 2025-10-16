import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import RouterABI from '../abis/Router.json'
import type { Route, SwapParams } from '../types'
import { contracts } from '../config/web3'

/**
 * Swap 操作 Hook
 */
export function useSwap() {
  const routerAddress = contracts.router

  // Swap 操作
  const { writeContract, data: hash, isPending } = useWriteContract()

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * 执行 Swap
   */
  const swap = async (params: SwapParams) => {
    writeContract({
      address: routerAddress,
      abi: RouterABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        params.amountIn,
        params.amountOutMin,
        params.routes,
        params.to,
        BigInt(params.deadline),
      ],
    })
  }

  return {
    swap,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  }
}

/**
 * 查询 Swap 输出金额
 */
export function useSwapQuote(amountIn?: bigint, routes?: Route[]) {
  const routerAddress = contracts.router

  const { data: amounts, isLoading } = useReadContract({
    address: routerAddress,
    abi: RouterABI,
    functionName: 'getAmountsOut',
    args: amountIn && routes ? [amountIn, routes] : undefined,
    query: {
      enabled: !!amountIn && !!routes && routes.length > 0 && amountIn > 0n,
    },
  })

  const amountOut = amounts && Array.isArray(amounts) && amounts.length > 1
    ? (amounts[amounts.length - 1] as bigint)
    : undefined

  return {
    amountOut,
    amounts,
    isLoading,
  }
}
