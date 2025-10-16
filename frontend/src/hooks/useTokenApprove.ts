import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import type { Address } from 'viem'
import TokenABI from '../abis/Token.json'

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

/**
 * Token 授权 Hook
 */
export function useTokenApprove(tokenAddress?: Address, spenderAddress?: Address) {
  // 查询当前授权额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: TokenABI,
    functionName: 'allowance',
    args: spenderAddress ? [spenderAddress as Address, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!spenderAddress,
    },
  })

  // 授权操作
  const { writeContract, data: hash, isPending } = useWriteContract()

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * 执行授权
   * @param amount 授权金额，不传则授权最大值
   */
  const approve = async (amount?: bigint) => {
    if (!tokenAddress || !spenderAddress) {
      throw new Error('Token address or spender address not provided')
    }

    writeContract({
      address: tokenAddress,
      abi: TokenABI,
      functionName: 'approve',
      args: [spenderAddress, amount || MAX_UINT256],
    })
  }

  /**
   * 检查是否已授权足够额度
   */
  const isApproved = (requiredAmount: bigint): boolean => {
    if (!allowance) return false
    return allowance >= requiredAmount
  }

  return {
    allowance,
    approve,
    isApproved,
    isPending,
    isConfirming,
    isSuccess,
    refetchAllowance,
  }
}
