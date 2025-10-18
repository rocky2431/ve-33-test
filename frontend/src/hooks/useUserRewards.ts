import { useAccount, useReadContract } from 'wagmi'
import { contracts } from '../config/web3'
import { useUserVeNFTs } from './useVeNFT'
import { useAllGauges } from './useVote'

export interface RewardItem {
  type: 'fee' | 'bribe' | 'emission'
  token: string
  tokenSymbol: string
  amount: bigint
  valueUSD: bigint
  source: string // 来源池子或合约
}

/**
 * 用户待领取奖励Hook
 * 聚合所有来源的奖励：手续费、贿赂、质押排放
 */
export function useUserRewards() {
  const { address } = useAccount()
  const { tokens: veNFTs } = useUserVeNFTs()
  const { pools } = useAllGauges()

  // TODO: 实现实际的奖励查询
  // 这需要：
  // 1. 查询每个Bribe合约的earned()
  // 2. 查询每个Gauge的earned()
  // 3. 聚合并分类

  // 暂时返回模拟数据结构
  const rewards: RewardItem[] = []

  // 计算总价值
  const totalRewardsUSD = rewards.reduce((sum, reward) => sum + reward.valueUSD, 0n)

  // 按类型分组
  const feeRewards = rewards.filter((r) => r.type === 'fee')
  const bribeRewards = rewards.filter((r) => r.type === 'bribe')
  const emissionRewards = rewards.filter((r) => r.type === 'emission')

  const totalFeeUSD = feeRewards.reduce((sum, r) => sum + r.valueUSD, 0n)
  const totalBribeUSD = bribeRewards.reduce((sum, r) => sum + r.valueUSD, 0n)
  const totalEmissionUSD = emissionRewards.reduce((sum, r) => sum + r.valueUSD, 0n)

  return {
    rewards,
    totalRewardsUSD,
    totalFeeUSD,
    totalBribeUSD,
    totalEmissionUSD,
    feeRewards,
    bribeRewards,
    emissionRewards,
    hasRewards: rewards.length > 0,
    isLoading: false,
  }
}

/**
 * 一键领取所有奖励Hook
 */
export function useClaimAllRewards() {
  // TODO: 实现批量领取逻辑
  // 需要：
  // 1. 收集所有有奖励的合约地址
  // 2. 批量调用claim()
  // 3. 使用multicall或sequential transaction

  const claimAll = async () => {
    console.log('🎁 开始领取所有奖励...')
    // 实现批量领取逻辑
  }

  return {
    claimAll,
    isPending: false,
    isSuccess: false,
  }
}
