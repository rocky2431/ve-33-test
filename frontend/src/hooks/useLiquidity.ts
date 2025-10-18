import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type Address } from 'viem'
import RouterABI from '../abis/Router.json'
import PairABI from '../abis/Pair.json'
import { contracts } from '../config/web3'

export interface AddLiquidityParams {
  tokenA: Address
  tokenB: Address
  stable: boolean
  amountADesired: bigint
  amountBDesired: bigint
  amountAMin: bigint
  amountBMin: bigint
  to: Address
  deadline: number
}

export interface RemoveLiquidityParams {
  tokenA: Address
  tokenB: Address
  stable: boolean
  liquidity: bigint
  amountAMin: bigint
  amountBMin: bigint
  to: Address
  deadline: number
}

/**
 * 流动性管理 Hook
 */
export function useLiquidity() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 添加流动性
  const addLiquidity = async (params: AddLiquidityParams) => {
    return writeContract({
      address: contracts.router,
      abi: RouterABI,
      functionName: 'addLiquidity',
      args: [
        params.tokenA,
        params.tokenB,
        params.stable,
        params.amountADesired,
        params.amountBDesired,
        params.amountAMin,
        params.amountBMin,
        params.to,
        params.deadline,
      ],
    })
  }

  // 移除流动性
  const removeLiquidity = async (params: RemoveLiquidityParams) => {
    return writeContract({
      address: contracts.router,
      abi: RouterABI,
      functionName: 'removeLiquidity',
      args: [
        params.tokenA,
        params.tokenB,
        params.stable,
        params.liquidity,
        params.amountAMin,
        params.amountBMin,
        params.to,
        params.deadline,
      ],
    })
  }

  return {
    addLiquidity,
    removeLiquidity,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询流动性池信息
 */
export function usePoolInfo(pairAddress?: Address) {
  const { address } = useAccount()

  // 查询 token0
  const { data: token0 } = useReadContract({
    address: pairAddress,
    abi: PairABI,
    functionName: 'token0',
    query: {
      enabled: !!pairAddress,
    },
  })

  // 查询 token1
  const { data: token1 } = useReadContract({
    address: pairAddress,
    abi: PairABI,
    functionName: 'token1',
    query: {
      enabled: !!pairAddress,
    },
  })

  // 查询储备量
  const { data: reserves } = useReadContract({
    address: pairAddress,
    abi: PairABI,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress,
    },
  })

  // 查询总供应量
  const { data: totalSupply } = useReadContract({
    address: pairAddress,
    abi: PairABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!pairAddress,
    },
  })

  // 查询用户的 LP Token 余额
  const { data: lpBalance, refetch: refetchBalance } = useReadContract({
    address: pairAddress,
    abi: PairABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!pairAddress && !!address,
    },
  })

  return {
    token0: token0 as Address | undefined,
    token1: token1 as Address | undefined,
    reserve0: reserves ? (reserves as [bigint, bigint, bigint])[0] : undefined,
    reserve1: reserves ? (reserves as [bigint, bigint, bigint])[1] : undefined,
    totalSupply: totalSupply as bigint | undefined,
    lpBalance: lpBalance as bigint | undefined,
    refetchBalance,
  }
}

/**
 * 查询流动性池地址
 */
export function usePairAddress(tokenA?: Address, tokenB?: Address, stable?: boolean) {
  const { data: pairAddress } = useReadContract({
    address: contracts.factory,
    abi: [
      {
        inputs: [
          { name: 'tokenA', type: 'address' },
          { name: 'tokenB', type: 'address' },
          { name: 'stable', type: 'bool' },
        ],
        name: 'getPair',
        outputs: [{ name: 'pair', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getPair',
    args: tokenA && tokenB && stable !== undefined ? [tokenA, tokenB, stable] : undefined,
    query: {
      enabled: !!tokenA && !!tokenB && stable !== undefined,
    },
  })

  // 过滤掉零地址（表示池子不存在）
  const zeroAddress = '0x0000000000000000000000000000000000000000' as Address
  if (!pairAddress || pairAddress === zeroAddress) {
    return undefined
  }

  return pairAddress as Address
}
