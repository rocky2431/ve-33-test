import { useAccount, useReadContract, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { type Address } from 'viem'
import FactoryABI from '../abis/Factory.json'
import PairABI from '../abis/Pair.json'
import { contracts } from '../config/web3'
import { useEffect, useState } from 'react'

export interface UserPoolPosition {
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
}

/**
 * 查询用户在所有池子的流动性（不仅仅是有Gauge的）
 * 从 Factory 合约获取所有池子，然后查询用户余额
 */
export function useAllUserPools() {
  const { address: userAddress } = useAccount()
  const wagmiConfig = useConfig()
  const [positions, setPositions] = useState<UserPoolPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 1. 查询所有池子数量
  const { data: allPairsLength } = useReadContract({
    address: contracts.factory,
    abi: FactoryABI,
    functionName: 'allPairsLength',
    query: {
      enabled: !!userAddress,
    },
  })

  // 2. 动态获取所有用户的流动性位置
  useEffect(() => {
    if (!userAddress || !allPairsLength) return

    const fetchAllPositions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const allPositions: UserPoolPosition[] = []
        const totalPairs = Number(allPairsLength)

        console.log(`🔍 开始查询 ${totalPairs} 个池子...`)

        // 遍历所有池子
        for (let i = 0; i < totalPairs; i++) {
          try {
            // 查询池子地址
            const pairAddress = (await readContract(wagmiConfig, {
              address: contracts.factory,
              abi: FactoryABI,
              functionName: 'allPairs',
              args: [BigInt(i)],
            })) as Address

            if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
              continue
            }

            // 查询用户在这个池子的LP余额
            const lpBalance = (await readContract(wagmiConfig, {
              address: pairAddress,
              abi: PairABI,
              functionName: 'balanceOf',
              args: [userAddress],
            })) as bigint

            // 只有余额 > 0 的才继续查询
            if (lpBalance === 0n) continue

            console.log(`✅ 找到池子 ${i}: ${pairAddress}, 余额: ${lpBalance.toString()}`)

            // 并行查询池子详情
            const [token0, token1, reserves, totalSupply, stable] = await Promise.all([
              readContract(wagmiConfig, {
                address: pairAddress,
                abi: PairABI,
                functionName: 'token0',
              }) as Promise<Address>,
              readContract(wagmiConfig, {
                address: pairAddress,
                abi: PairABI,
                functionName: 'token1',
              }) as Promise<Address>,
              readContract(wagmiConfig, {
                address: pairAddress,
                abi: PairABI,
                functionName: 'getReserves',
              }) as Promise<[bigint, bigint, number]>,
              readContract(wagmiConfig, {
                address: pairAddress,
                abi: PairABI,
                functionName: 'totalSupply',
              }) as Promise<bigint>,
              readContract(wagmiConfig, {
                address: pairAddress,
                abi: PairABI,
                functionName: 'stable',
              }) as Promise<boolean>,
            ])

            // 尝试获取token symbol
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
              pairAddress,
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
            })
          } catch (err) {
            console.error(`查询池子 ${i} 失败:`, err)
            // 继续下一个
          }
        }

        console.log(`✅ 共找到 ${allPositions.length} 个有余额的池子`)
        setPositions(allPositions)
      } catch (err) {
        console.error('查询流动性位置失败:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, allPairsLength, refreshTrigger])

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
