import { useCallback } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { type Address, zeroAddress } from 'viem'
import VoterABI from '../abis/Voter.json'
import { contracts } from '../config/web3'

/**
 * 自动Gauge管理Hook
 * 用于检查和创建Gauge
 */
export function useAutoGauge() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  /**
   * 创建Gauge
   * 使用useCallback确保函数引用稳定
   */
  const createGauge = useCallback(
    async (poolAddress: Address) => {
      console.log('🎯 [AutoGauge] 准备为池子创建Gauge:', poolAddress)

      return writeContract({
        address: contracts.voter,
        abi: VoterABI,
        functionName: 'createGauge',
        args: [poolAddress],
      })
    },
    [writeContract]
  )

  return {
    createGauge,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询池子的Gauge地址
 */
export function useGaugeAddress(poolAddress?: Address) {
  const { data: gaugeAddress, refetch } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'gauges',
    args: poolAddress ? [poolAddress] : undefined,
    query: {
      enabled: !!poolAddress,
    },
  })

  const hasGauge = gaugeAddress && gaugeAddress !== zeroAddress

  return {
    gaugeAddress: gaugeAddress as Address | undefined,
    hasGauge,
    refetch,
  }
}
