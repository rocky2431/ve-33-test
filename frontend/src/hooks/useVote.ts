import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import VoterABI from '../abis/Voter.json'
import PairABI from '../abis/Pair.json'
import TokenABI from '../abis/Token.json'
import { contracts } from '../config/web3'
import { useMemo } from 'react'

export interface VoteParams {
  tokenId: bigint
  poolVotes: Address[]
  weights: bigint[]
}

export interface PoolInfo {
  address: Address
  gaugeAddress: Address
  bribeAddress?: Address
  token0: Address
  token1: Address
  token0Symbol?: string
  token1Symbol?: string
  stable: boolean
  currentVotes: bigint
  reserve0?: bigint
  reserve1?: bigint
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
 * 查询所有 Gauge 列表并获取完整的池信息
 */
export function useAllGauges() {
  // 第一步：查询 Gauge 数量
  const { data: length } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'gaugesLength',
  })

  // 生成索引数组，用于批量查询所有gauge地址
  const gaugeIndices = useMemo(() => {
    if (!length) return []
    const count = Number(length)
    return Array.from({ length: count }, (_, i) => i)
  }, [length])

  // 第二步：批量查询所有 Gauge 地址
  const gaugeAddressContracts = useMemo(() => {
    return gaugeIndices.map((index) => ({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'allGauges',
      args: [BigInt(index)],
    }))
  }, [gaugeIndices])

  const { data: gaugeAddresses } = useReadContracts({
    contracts: gaugeAddressContracts as any,
  })

  // 提取有效的gauge地址
  const validGaugeAddresses = useMemo(() => {
    if (!gaugeAddresses) return []
    return gaugeAddresses
      .map((result) => result.result as Address)
      .filter((addr): addr is Address => !!addr && addr !== '0x0000000000000000000000000000000000000000')
  }, [gaugeAddresses])

  // 第三步：批量查询每个 Gauge 对应的 Pool 地址
  const poolAddressContracts = useMemo(() => {
    return validGaugeAddresses.map((gaugeAddr) => ({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'poolForGauge',
      args: [gaugeAddr],
    }))
  }, [validGaugeAddresses])

  const { data: poolAddresses } = useReadContracts({
    contracts: poolAddressContracts as any,
  })

  // 第四步：批量查询池的元数据（metadata 函数返回所有信息）
  const poolMetadataContracts = useMemo(() => {
    if (!poolAddresses) return []
    return poolAddresses
      .map((result) => result.result as Address)
      .filter((addr): addr is Address => !!addr && addr !== '0x0000000000000000000000000000000000000000')
      .map((poolAddr) => ({
        address: poolAddr,
        abi: PairABI,
        functionName: 'metadata',
      }))
  }, [poolAddresses])

  const { data: poolMetadata } = useReadContracts({
    contracts: poolMetadataContracts as any,
  })

  // 第五步：批量查询投票权重
  const weightContracts = useMemo(() => {
    if (!poolAddresses) return []
    return poolAddresses
      .map((result) => result.result as Address)
      .filter((addr): addr is Address => !!addr && addr !== '0x0000000000000000000000000000000000000000')
      .map((poolAddr) => ({
        address: contracts.voter,
        abi: VoterABI,
        functionName: 'weights',
        args: [poolAddr],
      }))
  }, [poolAddresses])

  const { data: weights } = useReadContracts({
    contracts: weightContracts as any,
  })

  // 第六步：批量查询 Bribe 地址
  const bribeAddressContracts = useMemo(() => {
    return validGaugeAddresses.map((gaugeAddr) => ({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'bribes',
      args: [gaugeAddr],
    }))
  }, [validGaugeAddresses])

  const { data: bribeAddresses } = useReadContracts({
    contracts: bribeAddressContracts as any,
  })

  // 第七步：批量查询 Token Symbol
  const tokenSymbolContracts = useMemo(() => {
    if (!poolMetadata) return []
    const contracts: any[] = []
    poolMetadata.forEach((metadata) => {
      if (metadata.result) {
        const [, , , , , t0, t1] = metadata.result as any[]
        if (t0 && t0 !== '0x0000000000000000000000000000000000000000') {
          contracts.push({
            address: t0,
            abi: TokenABI,
            functionName: 'symbol',
          })
        }
        if (t1 && t1 !== '0x0000000000000000000000000000000000000000') {
          contracts.push({
            address: t1,
            abi: TokenABI,
            functionName: 'symbol',
          })
        }
      }
    })
    return contracts
  }, [poolMetadata])

  const { data: tokenSymbols } = useReadContracts({
    contracts: tokenSymbolContracts as any,
  })

  // 组合所有数据
  const pools = useMemo<PoolInfo[]>(() => {
    if (!poolAddresses || !poolMetadata || !weights || !bribeAddresses) {
      return []
    }

    const result: PoolInfo[] = []
    let symbolIndex = 0

    poolAddresses.forEach((poolAddrResult, index) => {
      const poolAddr = poolAddrResult.result as Address
      if (!poolAddr || poolAddr === '0x0000000000000000000000000000000000000000') return

      const metadata = poolMetadata[index]?.result as any
      if (!metadata) return

      const [_dec0, _dec1, r0, r1, st, t0, t1] = metadata
      const weight = weights[index]?.result as bigint
      const bribeAddr = bribeAddresses[index]?.result as Address

      // 获取对应的token symbols
      const token0Symbol = tokenSymbols?.[symbolIndex]?.result as string | undefined
      symbolIndex++
      const token1Symbol = tokenSymbols?.[symbolIndex]?.result as string | undefined
      symbolIndex++

      result.push({
        address: poolAddr,
        gaugeAddress: validGaugeAddresses[index],
        bribeAddress: bribeAddr,
        token0: t0 as Address,
        token1: t1 as Address,
        token0Symbol,
        token1Symbol,
        stable: st as boolean,
        currentVotes: weight || 0n,
        reserve0: r0 as bigint,
        reserve1: r1 as bigint,
      })
    })

    return result
  }, [poolAddresses, poolMetadata, weights, bribeAddresses, tokenSymbols, validGaugeAddresses])

  return {
    length: length as bigint | undefined,
    pools,
    isLoading: !poolAddresses || !poolMetadata,
  }
}

/**
 * 查询用户的投票历史
 */
export function useUserVotes(address?: Address) {
  // 查询用户上次投票时间
  const { data: lastVoted } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'lastVoted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    lastVoted: lastVoted as bigint | undefined,
    votes: [], // TODO: 实现完整的投票记录查询
  }
}

/**
 * 查询投票状态
 */
export function useVoteState(_address?: Address) {
  // 查询用户总投票权重
  const { data: totalWeight } = useReadContract({
    address: contracts.voter,
    abi: VoterABI,
    functionName: 'totalWeight',
    query: {
      enabled: true,
    },
  })

  return {
    totalWeight: totalWeight as bigint | undefined,
  }
}

/**
 * 投票权重操作
 */
export function useVoteWeights() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 投票 (简化版本,接受地址数组和权重数组)
  const vote = async (poolAddresses: Address[], weights: number[]) => {
    // 将百分比权重转换为 bigint
    const weightsBigInt = weights.map((w) => BigInt(w))

    return writeContract({
      address: contracts.voter,
      abi: VoterABI,
      functionName: 'vote',
      args: [poolAddresses, weightsBigInt],
    })
  }

  return {
    vote,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
