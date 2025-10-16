import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { type Address } from 'viem'
import GaugeABI from '../abis/Gauge.json'
import BribeABI from '../abis/Bribe.json'
import VoterABI from '../abis/Voter.json'
import { contracts } from '../config/web3'

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
 * 查询用户奖励 (高级接口)
 */
export function useUserRewards(_address?: Address) {
  // TODO: 实现完整的奖励查询逻辑
  // 需要查询所有 Gauge 和 Bribe 合约的奖励

  return {
    rewards: [], // 所有待领取奖励
    totalValue: '0', // 总价值
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
