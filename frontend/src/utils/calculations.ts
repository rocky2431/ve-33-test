// 计算工具函数

/**
 * 计算流动性池的 LP Token 数量
 * 使用 Uniswap V2 公式: liquidity = sqrt(amount0 * amount1)
 */
export function calculateLiquidity(amount0: bigint, amount1: bigint, totalSupply: bigint): bigint {
  if (totalSupply === 0n) {
    // 首次添加流动性
    return sqrt(amount0 * amount1)
  }

  // 后续添加流动性，按比例计算
  // liquidity = min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)
  return amount0 * totalSupply
}

/**
 * 计算移除流动性时能获得的 Token 数量
 */
export function calculateRemoveLiquidity(
  lpAmount: bigint,
  totalSupply: bigint,
  reserve0: bigint,
  reserve1: bigint
): { amount0: bigint; amount1: bigint } {
  const amount0 = (lpAmount * reserve0) / totalSupply
  const amount1 = (lpAmount * reserve1) / totalSupply
  return { amount0, amount1 }
}

/**
 * 计算 ve-NFT 投票权重
 * 权重 = 锁仓金额 * (剩余时间 / 4年)
 */
export function calculateVotingPower(
  lockedAmount: bigint,
  lockEnd: bigint,
  currentTime: bigint = BigInt(Math.floor(Date.now() / 1000))
): bigint {
  const MAXTIME = 4n * 365n * 86400n // 4年（秒）

  if (lockEnd <= currentTime) {
    return 0n
  }

  const remainingTime = lockEnd - currentTime
  const power = (lockedAmount * remainingTime) / MAXTIME
  return power
}

/**
 * 计算锁仓结束时间
 */
export function calculateLockEnd(duration: number): bigint {
  const WEEK = 7 * 86400 // 一周（秒）
  const currentTime = Math.floor(Date.now() / 1000)
  const lockEnd = Math.floor((currentTime + duration) / WEEK) * WEEK
  return BigInt(lockEnd)
}

/**
 * 格式化剩余时间
 */
export function formatRemainingTime(lockEnd: bigint): string {
  const currentTime = BigInt(Math.floor(Date.now() / 1000))

  if (lockEnd <= currentTime) {
    return '已到期'
  }

  const remaining = Number(lockEnd - currentTime)
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)

  if (days > 365) {
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    return `${years}年${remainingDays}天`
  }

  if (days > 0) {
    return `${days}天${hours}小时`
  }

  return `${hours}小时`
}

/**
 * 平方根（用于计算流动性）
 */
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('Square root of negative numbers is not supported')
  }

  if (value < 2n) {
    return value
  }

  // 牛顿迭代法
  let z = value
  let x = value / 2n + 1n

  while (x < z) {
    z = x
    x = (value / x + x) / 2n
  }

  return z
}

/**
 * 计算 APR (年化收益率)
 */
export function calculateAPR(
  weeklyEmission: bigint,
  totalVotingPower: bigint,
  poolLiquidity: bigint,
  tokenPrice: bigint // 价格精度 1e18
): number {
  if (totalVotingPower === 0n || poolLiquidity === 0n) {
    return 0
  }

  // 年化排放 = 周排放 * 52
  const yearlyEmission = weeklyEmission * 52n

  // APR = (年化排放价值 / 流动性价值) * 100
  const emissionValue = yearlyEmission * tokenPrice / 10n**18n
  const apr = Number(emissionValue * 10000n / poolLiquidity) / 100

  return apr
}
