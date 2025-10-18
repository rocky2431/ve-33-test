import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import PairABI from '../abis/Pair.json'
import { contracts } from '../config/web3'
import { TOKENS } from '../constants/tokens'

/**
 * 计算代币的SRUSD价格
 * 通过SRT/SRUSD池子作为价格锚点
 */
export function useTokenPrice(tokenAddress?: Address) {
  // SRT/SRUSD池子地址（用户刚创建的）
  const SRT_SRUSD_POOL = '0x9af24cE2e9Fa0b96E3a7654ceA2D89517Dc85dD8' as Address

  // 获取SRT/SRUSD池子的储备金
  const { data: srtSrusdReserves } = useReadContract({
    address: SRT_SRUSD_POOL,
    abi: PairABI,
    functionName: 'getReserves',
  })

  // 获取SRT/SRUSD池子的token0
  const { data: srtSrusdToken0 } = useReadContract({
    address: SRT_SRUSD_POOL,
    abi: PairABI,
    functionName: 'token0',
  })

  /**
   * 计算代币的SRUSD价格
   * @param tokenAddr 代币地址
   * @param amount 代币数量（wei）
   * @returns SRUSD价值（wei）
   */
  const calculatePrice = (tokenAddr: Address, amount: bigint): bigint => {
    if (!srtSrusdReserves || !srtSrusdToken0) return 0n
    if (amount === 0n) return 0n

    const reserves = srtSrusdReserves as [bigint, bigint, bigint]
    const reserve0 = reserves[0]
    const reserve1 = reserves[1]

    // 确定SRT和SRUSD的储备金
    const isSrtToken0 = srtSrusdToken0.toLowerCase() === TOKENS.SRT.address.toLowerCase()
    const srtReserve = isSrtToken0 ? reserve0 : reserve1
    const srusdReserve = isSrtToken0 ? reserve1 : reserve0

    if (srtReserve === 0n) return 0n

    // 如果是SRUSD，直接返回
    if (tokenAddr.toLowerCase() === TOKENS.SRUSD.address.toLowerCase()) {
      return amount
    }

    // 如果是SRT，计算USD价值
    if (
      tokenAddr.toLowerCase() === TOKENS.SRT.address.toLowerCase() ||
      tokenAddr.toLowerCase() === TOKENS.WSRT.address.toLowerCase()
    ) {
      // SRT价格 = SRUSD储备 / SRT储备
      return (amount * srusdReserve) / srtReserve
    }

    // 其他代币暂时无法直接计算，需要通过路径查找
    // 这里简化处理，返回0
    return 0n
  }

  /**
   * 计算池子的总USD价值（TVL）
   * @param token0 Token0地址
   * @param token1 Token1地址
   * @param reserve0 Token0储备金
   * @param reserve1 Token1储备金
   * @returns TVL的SRUSD价值（wei）
   */
  const calculatePoolTVL = (
    token0: Address,
    token1: Address,
    reserve0: bigint,
    reserve1: bigint
  ): bigint => {
    const value0 = calculatePrice(token0, reserve0)
    const value1 = calculatePrice(token1, reserve1)
    return value0 + value1
  }

  /**
   * 获取1单位代币的SRUSD价格
   * @param tokenAddr 代币地址
   * @returns 价格（SRUSD，带18位小数）
   */
  const getUnitPrice = (tokenAddr: Address): bigint => {
    return calculatePrice(tokenAddr, 10n ** 18n)
  }

  return {
    calculatePrice,
    calculatePoolTVL,
    getUnitPrice,
    isReady: !!srtSrusdReserves && !!srtSrusdToken0,
  }
}

/**
 * 格式化SRUSD价格为易读字符串
 * @param srusdAmount SRUSD数量（wei）
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatUSDPrice(srusdAmount: bigint, decimals: number = 2): string {
  if (srusdAmount === 0n) return '$0.00'

  const value = Number(srusdAmount) / 1e18

  // 格式化为千分位
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return `$${formatted}`
}
