import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { type Address } from 'viem'
import VoterABI from '../abis/Voter.json'
import { contracts } from '../config/web3'

export interface VoteParams {
  tokenId: bigint
  poolVotes: Address[]
  weights: bigint[]
}

/**
 * 投票操作 Hook
 */
export function useVote() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 投票
  const vote = async (params: VoteParams) => {
    return writeContract({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'vote',
      args: [params.tokenId, params.poolVotes, params.weights],
    })
  }

  // 重置投票
  const reset = async (tokenId: bigint) => {
    return writeContract({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'reset',
      args: [tokenId],
    })
  }

  return {
    vote,
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询 Gauge 信息
 */
export function useGaugeInfo(poolAddress?: Address) {
  // 查询池对应的 Gauge 地址
  const { data: gaugeAddress } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'gauges',
    args: poolAddress ? [poolAddress] : undefined,
    query: {
      enabled: !!poolAddress,
    },
  })

  // 查询 Gauge 获得的投票权重
  const { data: votes } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'weights',
    args: poolAddress ? [poolAddress] : undefined,
    query: {
      enabled: !!poolAddress,
    },
  })

  return {
    gaugeAddress: gaugeAddress as Address | undefined,
    votes: votes as bigint | undefined,
  }
}

/**
 * 查询所有 Gauge 列表
 */
export function useAllGauges() {
  // 查询 Gauge 数量
  const { data: length } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'gaugesLength',
  })

  // TODO: 需要遍历获取所有 Gauge 地址
  // 实际应该使用 multicall 批量查询

  return {
    length: length as bigint | undefined,
    // gauges: [] as Address[], // 实际项目中需要实现完整的查询逻辑
  }
}

/**
 * 查询用户的投票历史
 */
export function useUserVotes(tokenId?: bigint, poolAddress?: Address) {
  // 查询用户对某个池的投票权重
  const { data: poolVote } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'votes',
    args: tokenId !== undefined && poolAddress ? [tokenId, poolAddress] : undefined,
    query: {
      enabled: tokenId !== undefined && !!poolAddress,
    },
  })

  return {
    poolVote: poolVote as bigint | undefined,
  }
}
