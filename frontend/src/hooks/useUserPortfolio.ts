import { useAccount } from 'wagmi'
import { useTokenBalance } from './useTokenBalance'
import { useUserLiquidityPositions } from './useUserLiquidityPositions'
import { useUserVeNFTs } from './useVeNFT'
import { useTokenPrice } from './useTokenPrice'
import { TOKENS } from '../constants/tokens'

/**
 * 用户资产组合Hook
 * 计算用户所有资产的USD总价值
 */
export function useUserPortfolio() {
  const { address } = useAccount()
  const { calculatePrice, calculatePoolTVL, isReady: isPriceReady } = useTokenPrice()

  // 钱包余额
  const { balance: srtBalance } = useTokenBalance(TOKENS.SRT.address, address)
  const { balance: wsrtBalance } = useTokenBalance(TOKENS.WSRT.address, address)

  // 流动性位置
  const { positions, isLoading: isPositionsLoading } = useUserLiquidityPositions()

  // ve-NFT
  const { balance: veNFTBalance, tokens: veNFTs } = useUserVeNFTs()

  // 计算钱包余额USD价值
  const walletValueUSD = isPriceReady
    ? calculatePrice(TOKENS.SRT.address, srtBalance || 0n) +
      calculatePrice(TOKENS.WSRT.address, wsrtBalance || 0n)
    : 0n

  // 计算流动性USD价值
  const liquidityValueUSD = isPriceReady && positions
    ? positions.reduce((sum, position) => {
        if (position.reserve0 && position.reserve1 && position.lpBalance && position.totalSupply && position.totalSupply > 0n) {
          // 计算用户拥有的储备量
          const userReserve0 = (position.reserve0 * position.lpBalance) / position.totalSupply
          const userReserve1 = (position.reserve1 * position.lpBalance) / position.totalSupply

          // 计算USD价值
          const value0 = calculatePrice(position.token0, userReserve0)
          const value1 = calculatePrice(position.token1, userReserve1)

          return sum + value0 + value1
        }
        return sum
      }, 0n)
    : 0n

  // 计算ve-NFT锁仓价值（简化，实际需要查询每个NFT的锁仓量）
  const veNFTValueUSD = isPriceReady && veNFTs && veNFTs.length > 0
    ? veNFTs.reduce((sum, nft) => {
        // 这里需要查询每个NFT的锁仓量，暂时使用0
        return sum
      }, 0n)
    : 0n

  // 质押资产价值（暂时为0，需要实现Gauge质押查询）
  const stakedValueUSD = 0n

  // 总资产价值
  const totalValueUSD = walletValueUSD + liquidityValueUSD + veNFTValueUSD + stakedValueUSD

  return {
    totalValueUSD,
    walletValueUSD,
    liquidityValueUSD,
    stakedValueUSD,
    veNFTValueUSD,
    veNFTCount: veNFTBalance ? Number(veNFTBalance) : 0,
    liquidityPositions: positions?.length || 0,
    isLoading: isPositionsLoading || !isPriceReady,
  }
}
