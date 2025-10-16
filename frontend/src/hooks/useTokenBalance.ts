import { useBalance } from 'wagmi'
import type { Address } from 'viem'

/**
 * 查询 Token 余额
 */
export function useTokenBalance(tokenAddress?: Address, userAddress?: Address) {
  const { data, isLoading, refetch } = useBalance({
    address: userAddress,
    token: tokenAddress,
    query: {
      enabled: !!userAddress && !!tokenAddress,
    },
  })

  return {
    balance: data?.value,
    formatted: data?.formatted,
    symbol: data?.symbol,
    decimals: data?.decimals,
    isLoading,
    refetch,
  }
}
