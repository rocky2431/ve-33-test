import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import GaugeABI from '../abis/Gauge.json'
import BribeABI from '../abis/Bribe.json'
import VoterABI from '../abis/Voter.json'
import { contracts } from '../config/web3'
import { useMemo } from 'react'
import { useAllGauges } from './useVote'

export interface RewardItem {
  type: 'fee' | 'bribe' | 'emission'
  poolAddress: Address
  poolName: string
  token0Symbol?: string
  token1Symbol?: string
  gaugeAddress?: Address
  bribeAddress?: Address
  rewardToken: string
  rewardTokenAddress: Address
  amount: bigint
  decimals: number
}

/**
 * 奖励领取 Hook
 */
export function useRewards() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 从 Gauge 领取交易手续费奖励
  const claimGaugeRewards = async (gaugeAddress: Address, tokenId: bigint) => {
    return writeContract({
      address: gaugeAddress,
      abi: GaugeABI,
      functionName: 'getReward',
      args: [tokenId],
    })
  }

  // 从 Bribe 领取贿赂奖励
  const claimBribeRewards = async (bribeAddress: Address, tokenId: bigint, tokens: Address[]) => {
    return writeContract({
      address: bribeAddress,
      abi: BribeABI,
      functionName: 'getReward',
      args: [tokenId, tokens],
    })
  }

  // 批量领取所有奖励
  const claimAllRewards = async (gauges: Address[], tokenId: bigint) => {
    return writeContract({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'claimRewards',
      args: [gauges, tokenId],
    })
  }

  return {
    claimGaugeRewards,
    claimBribeRewards,
    claimAllRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询 Gauge 奖励
 */
export function useGaugeRewards(gaugeAddress?: Address, tokenId?: bigint) {
  const { address } = useAccount()

  // 查询可领取的奖励金额
  const { data: earned, refetch } = useReadContract({
    address: gaugeAddress,
    abi: GaugeABI,
    functionName: 'earned',
    args: tokenId !== undefined && address ? [tokenId] : undefined,
    query: {
      enabled: !!gaugeAddress && tokenId !== undefined && !!address,
    },
  })

  return {
    earned: earned as bigint | undefined,
    refetch,
  }
}

/**
 * 查询 Bribe 奖励
 */
export function useBribeRewards(bribeAddress?: Address, tokenId?: bigint, rewardToken?: Address) {
  // 查询可领取的贿赂奖励
  const { data: earned, refetch } = useReadContract({
    address: bribeAddress,
    abi: BribeABI,
    functionName: 'earned',
    args: rewardToken && tokenId !== undefined ? [rewardToken, tokenId] : undefined,
    query: {
      enabled: !!bribeAddress && !!rewardToken && tokenId !== undefined,
    },
  })

  return {
    earned: earned as bigint | undefined,
    refetch,
  }
}

/**
 * 查询 Bribe 合约地址
 */
export function useBribeAddress(gaugeAddress?: Address) {
  const { data: bribeAddress } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'bribes',
    args: gaugeAddress ? [gaugeAddress] : undefined,
    query: {
      enabled: !!gaugeAddress,
    },
  })

  return bribeAddress as Address | undefined
}

/**
 * 查询奖励 Token 列表
 */
export function useRewardTokens(bribeAddress?: Address) {
  // 查询奖励 Token 数量
  const { data: tokensLength } = useReadContract({
    address: bribeAddress,
    abi: BribeABI,
    functionName: 'rewardsListLength',
    query: {
      enabled: !!bribeAddress,
    },
  })

  // TODO: 需要遍历获取所有奖励 Token 地址
  // 实际应该使用 multicall 批量查询

  return {
    tokensLength: tokensLength as bigint | undefined,
    // tokens: [] as Address[], // 实际项目中需要实现完整的查询逻辑
  }
}

/**
 * 查询用户奖励 (基础版本 - 只查询Gauge手续费奖励)
 * TODO: 完整版本需要添加Bribe奖励和Emission奖励查询
 */
export function useUserRewards() {
  const { address } = useAccount()

  // 获取所有池信息
  const { pools, isLoading: poolsLoading } = useAllGauges()

  // 筛选出有gauge的池
  const gaugesWithPools = useMemo(() => {
    if (!pools) return []
    return pools.filter(pool => pool.gaugeAddress && pool.gaugeAddress !== '0x0000000000000000000000000000000000000000')
  }, [pools])

  // 批量查询每个Gauge的可领取手续费奖励
  // 注意：这里简化了逻辑，使用address作为查询参数
  // 实际应该查询用户的ve-NFT tokenId，然后用tokenId查询
  const gaugeRewardContracts = useMemo(() => {
    if (!address || gaugesWithPools.length === 0) return []

    return gaugesWithPools.map(pool => ({
      address: pool.gaugeAddress,
      abi: GaugeABI,
      functionName: 'earned',
      args: [address], // 简化：使用address，实际应使用tokenId
    }))
  }, [gaugesWithPools, address])

  const { data: gaugeRewards } = useReadContracts({
    contracts: gaugeRewardContracts as any,
  })

  // 组合奖励数据
  const rewards = useMemo<RewardItem[]>(() => {
    if (!gaugeRewards || gaugesWithPools.length === 0) return []

    const result: RewardItem[] = []

    gaugesWithPools.forEach((pool, index) => {
      const rewardAmount = gaugeRewards[index]?.result as bigint | undefined

      // 只添加有奖励的池
      if (rewardAmount && rewardAmount > 0n) {
        result.push({
          type: 'fee',
          poolAddress: pool.address,
          poolName: `${pool.token0Symbol || 'Unknown'}/${pool.token1Symbol || 'Unknown'}`,
          token0Symbol: pool.token0Symbol,
          token1Symbol: pool.token1Symbol,
          gaugeAddress: pool.gaugeAddress,
          bribeAddress: pool.bribeAddress,
          rewardToken: pool.token0Symbol || 'Unknown', // 简化：假设奖励是token0
          rewardTokenAddress: pool.token0,
          amount: rewardAmount,
          decimals: 18, // 简化：假设18位小数
        })
      }
    })

    return result
  }, [gaugeRewards, gaugesWithPools])

  // 计算统计数据
  const stats = useMemo(() => {
    const feeRewards = rewards.filter(r => r.type === 'fee')
    const bribeRewards = rewards.filter(r => r.type === 'bribe')
    const emissionRewards = rewards.filter(r => r.type === 'emission')

    return {
      totalRewards: rewards.length,
      feeCount: feeRewards.length,
      bribeCount: bribeRewards.length,
      emissionCount: emissionRewards.length,
    }
  }, [rewards])

  return {
    rewards,
    stats,
    isLoading: poolsLoading || !gaugeRewards,
  }
}

/**
 * 领取奖励 (高级接口)
 */
export function useClaimRewards() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 领取所有奖励
  const claimAll = async () => {
    // TODO: 实现批量领取逻辑
    // 需要收集所有有奖励的 Gauge 地址
    return writeContract({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'claimRewards',
      args: [[]],
    })
  }

  // 领取贿赂奖励
  const claimBribe = async (bribeAddress: Address, tokens: Address[]) => {
    return writeContract({
      address: bribeAddress,
      abi: BribeABI,
      functionName: 'getReward',
      args: [tokens],
    })
  }

  return {
    claimAll,
    claimBribe,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询奖励历史
 */
export function useRewardsHistory(_address?: Address) {
  // TODO: 实现奖励历史查询
  // 可能需要通过事件日志或后端 API 查询

  return {
    history: [], // 历史记录列表
  }
}
