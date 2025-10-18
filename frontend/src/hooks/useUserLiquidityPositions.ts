import { useAccount, useReadContract, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { type Address } from 'viem'
import VoterABI from '../abis/Voter.json'
import PairABI from '../abis/Pair.json'
import { contracts } from '../config/web3'
import { useEffect, useState } from 'react'

export interface LiquidityPosition {
  pairAddress: Address
  token0: Address
  token1: Address
  token0Symbol?: string
  token1Symbol?: string
  stable: boolean
  lpBalance: bigint
  totalSupply: bigint
  reserve0: bigint
  reserve1: bigint
  sharePercentage: number
  gaugeAddress?: Address
}

/**
 * 动态查询用户所有流动性位置
 * 从Voter合约获取所有Gauge，然后查询用户在每个池子的余额
 */
export function useUserLiquidityPositions() {
  const { address: userAddress } = useAccount()
  const wagmiConfig = useConfig()
  const [positions, setPositions] = useState<LiquidityPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 1. 查询所有Gauge数量
  const { data: gaugesLength } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'gaugesLength',
    query: {
      enabled: !!userAddress,
    },
  })

  // 2. 动态获取所有用户的流动性位置
  useEffect(() => {
    if (!userAddress || !gaugesLength) return

    const fetchAllPositions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const allPositions: LiquidityPosition[] = []
        const totalGauges = Number(gaugesLength)

        // 遍历所有Gauge
        for (let i = 0; i < totalGauges; i++) {
          try {
            // 查询Gauge地址
            const gaugeAddress = (await readContract(wagmiConfig, {
              address: contracts.voter,
              abi: VoterABI,
              functionName: 'allGauges',
              args: [BigInt(i)],
            })) as Address

            // 查询对应的池子地址
            const poolAddress = (await readContract(wagmiConfig, {
              address: contracts.voter,
              abi: VoterABI,
              functionName: 'poolForGauge',
              args: [gaugeAddress],
            })) as Address

            if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
              continue
            }

            // 查询用户在这个池子的LP余额
            const lpBalance = (await readContract(wagmiConfig, {
              address: poolAddress,
              abi: PairABI,
              functionName: 'balanceOf',
              args: [userAddress],
            })) as bigint

            // 只有余额 > 0 的才继续查询
            if (lpBalance === 0n) continue

            // 并行查询池子详情
            const [token0, token1, reserves, totalSupply, stable] = await Promise.all([
              readContract(wagmiConfig, {
                address: poolAddress,
                abi: PairABI,
                functionName: 'token0',
              }) as Promise<Address>,
              readContract(wagmiConfig, {
                address: poolAddress,
                abi: PairABI,
                functionName: 'token1',
              }) as Promise<Address>,
              readContract(wagmiConfig, {
                address: poolAddress,
                abi: PairABI,
                functionName: 'getReserves',
              }) as Promise<[bigint, bigint, number]>,
              readContract(wagmiConfig, {
                address: poolAddress,
                abi: PairABI,
                functionName: 'totalSupply',
              }) as Promise<bigint>,
              readContract(wagmiConfig, {
                address: poolAddress,
                abi: PairABI,
                functionName: 'stable',
              }) as Promise<boolean>,
            ])

            // 尝试获取token symbol（可选，失败不影响主流程）
            let token0Symbol: string | undefined
            let token1Symbol: string | undefined
            try {
              token0Symbol = (await readContract(wagmiConfig, {
                address: token0,
                abi: [
                  {
                    inputs: [],
                    name: 'symbol',
                    outputs: [{ name: '', type: 'string' }],
                    stateMutability: 'view',
                    type: 'function',
                  },
                ],
                functionName: 'symbol',
              })) as string
            } catch {}
            try {
              token1Symbol = (await readContract(wagmiConfig, {
                address: token1,
                abi: [
                  {
                    inputs: [],
                    name: 'symbol',
                    outputs: [{ name: '', type: 'string' }],
                    stateMutability: 'view',
                    type: 'function',
                  },
                ],
                functionName: 'symbol',
              })) as string
            } catch {}

            const sharePercentage = totalSupply > 0n ? Number((lpBalance * 10000n) / totalSupply) / 100 : 0

            allPositions.push({
              pairAddress: poolAddress,
              token0,
              token1,
              token0Symbol,
              token1Symbol,
              stable,
              lpBalance,
              totalSupply,
              reserve0: reserves[0],
              reserve1: reserves[1],
              sharePercentage,
              gaugeAddress,
            })
          } catch (err) {
            console.error(`查询Gauge ${i} 失败:`, err)
            // 继续下一个
          }
        }

        setPositions(allPositions)
      } catch (err) {
        console.error('查询流动性位置失败:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPositions()
  }, [userAddress, gaugesLength, wagmiConfig, refreshTrigger])

  // 提供手动刷新函数
  const refetch = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return {
    positions,
    isLoading,
    error,
    refetch,
  }
}
