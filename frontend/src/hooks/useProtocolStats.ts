import { useReadContract } from 'wagmi'
import { contracts } from '../config/web3'
import { useAllGauges } from './useVote'
import { useTokenPrice } from './useTokenPrice'

/**
 * 协议全局统计数据Hook
 * 返回TVL、池数量、ve-NFT锁仓价值等关键指标
 */
export function useProtocolStats() {
  const { pools, isLoading: isPoolsLoading } = useAllGauges()
  const { calculatePoolTVL, isReady: isPriceReady } = useTokenPrice()

  // 查询 veNFT 总供应量
  const { data: veNFTTotalSupply } = useReadContract({
    address: contracts.votingEscrow,
    abi: [
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'totalSupply',
  })

  // 计算协议总TVL
  const protocolTVL = pools && isPriceReady
    ? pools.reduce((sum, pool) => {
        if (pool.reserve0 && pool.reserve1 && pool.token0 && pool.token1) {
          const tvl = calculatePoolTVL(pool.token0, pool.token1, pool.reserve0, pool.reserve1)
          return sum + tvl
        }
        return sum
      }, 0n)
    : 0n

  // 计算24h交易量（模拟数据，实际需要从事件日志获取）
  const volume24h = protocolTVL > 0n ? (protocolTVL * 15n) / 1000n : 0n // 假设日交易量为TVL的1.5%

  // ve-NFT数量
  const veNFTCount = pools?.filter((p) => p.gaugeAddress).length || 0

  return {
    protocolTVL,
    volume24h,
    poolCount: pools?.length || 0,
    veNFTCount,
    veNFTTotalSupply: veNFTTotalSupply || 0n,
    isLoading: isPoolsLoading || !isPriceReady,
  }
}
