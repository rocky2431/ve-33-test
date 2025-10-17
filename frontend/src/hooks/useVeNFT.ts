import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useMemo } from 'react'
import VotingEscrowABI from '../abis/VotingEscrow.json'
import { contracts } from '../config/web3'

export interface VeNFT {
  tokenId: bigint
  amount: bigint
  end: bigint
  votingPower: bigint
}

/**
 * ve-NFT 操作 Hook
 */
export function useVeNFT() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // 创建锁仓
  const createLock = async (value: bigint, lockDuration: number) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'create_lock',
      args: [value, BigInt(lockDuration)],
    })
  }

  // 增加锁仓金额
  const increaseAmount = async (tokenId: bigint, value: bigint) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'increase_amount',
      args: [tokenId, value],
    })
  }

  // 延长锁仓时间
  const increaseUnlockTime = async (tokenId: bigint, lockDuration: number) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'increase_unlock_time',
      args: [tokenId, BigInt(lockDuration)],
    })
  }

  // 提取（到期后）
  const withdraw = async (tokenId: bigint) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'withdraw',
      args: [tokenId],
    })
  }

  // 合并 ve-NFT
  const merge = async (fromTokenId: bigint, toTokenId: bigint) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'merge',
      args: [fromTokenId, toTokenId],
    })
  }

  // 分割 ve-NFT
  const split = async (tokenId: bigint, amount: bigint) => {
    return writeContract({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'split',
      args: [tokenId, amount],
    })
  }

  return {
    createLock,
    increaseAmount,
    increaseUnlockTime,
    withdraw,
    merge,
    split,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

/**
 * 查询用户的 ve-NFT 列表
 */
export function useUserVeNFTs() {
  const { address } = useAccount()

  // 查询用户拥有的 NFT 数量
  const { data: balance } = useReadContract({
    address: contracts.votingEscrow,
    abi: VotingEscrowABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // 生成索引数组，用于批量查询所有 tokenId
  const indices = useMemo(() => {
    if (!balance || balance === 0n) return []
    const count = Number(balance)
    return Array.from({ length: count }, (_, i) => i)
  }, [balance])

  // 批量查询所有 tokenId
  const tokenIdContracts = useMemo(() => {
    if (!address || indices.length === 0) return []
    return indices.map((index) => ({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [address, BigInt(index)],
    }))
  }, [address, indices])

  const { data: tokenIds } = useReadContracts({
    contracts: tokenIdContracts as any,
  })

  // 提取有效的 tokenId 列表
  const validTokenIds = useMemo(() => {
    if (!tokenIds) return []
    return tokenIds
      .map((result) => result.result as bigint)
      .filter((id): id is bigint => !!id && id > 0n)
  }, [tokenIds])

  // 批量查询每个 NFT 的锁仓信息
  const lockedContracts = useMemo(() => {
    return validTokenIds.map((tokenId) => ({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'locked',
      args: [tokenId],
    }))
  }, [validTokenIds])

  const { data: lockedData } = useReadContracts({
    contracts: lockedContracts as any,
  })

  // 批量查询每个 NFT 的投票权重
  const votingPowerContracts = useMemo(() => {
    return validTokenIds.map((tokenId) => ({
      address: contracts.votingEscrow,
      abi: VotingEscrowABI,
      functionName: 'balanceOfNFT',
      args: [tokenId],
    }))
  }, [validTokenIds])

  const { data: votingPowers } = useReadContracts({
    contracts: votingPowerContracts as any,
  })

  // 组合所有数据
  const nfts = useMemo<VeNFT[]>(() => {
    if (!validTokenIds.length || !lockedData || !votingPowers) return []

    return validTokenIds.map((tokenId, index) => {
      const locked = lockedData[index]?.result as { amount: bigint; end: bigint } | undefined
      const votingPower = votingPowers[index]?.result as bigint | undefined

      return {
        tokenId,
        amount: locked?.amount ? BigInt(locked.amount) : 0n,
        end: locked?.end || 0n,
        votingPower: votingPower || 0n,
      }
    })
  }, [validTokenIds, lockedData, votingPowers])

  return {
    balance: balance as bigint | undefined,
    nfts,
    isLoading: !!address && !!balance && balance > 0n && !lockedData,
  }
}

/**
 * 查询 ve-NFT 详情
 */
export function useVeNFTDetail(tokenId?: bigint) {
  // 查询锁仓余额
  const { data: locked } = useReadContract({
    address: contracts.votingEscrow,
    abi: VotingEscrowABI,
    functionName: 'locked',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  // 查询投票权重
  const { data: votingPower } = useReadContract({
    address: contracts.votingEscrow,
    abi: VotingEscrowABI,
    functionName: 'balanceOfNFT',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  const lockedBalance = locked as { amount: bigint; end: bigint } | undefined

  return {
    amount: lockedBalance?.amount,
    end: lockedBalance?.end,
    votingPower: votingPower as bigint | undefined,
  }
}

/**
 * 检查 NFT 是否已投票
 */
export function useIsVoted(tokenId?: bigint) {
  const { data: voted } = useReadContract({
    address: contracts.votingEscrow,
    abi: VotingEscrowABI,
    functionName: 'voted',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  return voted as boolean | undefined
}
