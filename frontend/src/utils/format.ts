import { formatUnits, parseUnits } from 'viem'

/**
 * 格式化 Token 数量（从 wei 到人类可读）
 */
export function formatTokenAmount(
  amount: bigint | undefined,
  decimals: number = 18,
  displayDecimals: number = 6
): string {
  if (!amount) return '0'
  const formatted = formatUnits(amount, decimals)
  const num = parseFloat(formatted)

  if (num === 0) return '0'
  if (num < 0.000001) return '< 0.000001'

  return num.toFixed(displayDecimals).replace(/\.?0+$/, '')
}

/**
 * 解析 Token 数量（从人类可读到 wei）
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  if (!amount || amount === '') return 0n
  try {
    return parseUnits(amount, decimals)
  } catch {
    return 0n
  }
}

/**
 * 格式化地址（缩略显示）
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * 计算滑点后的最小输出
 */
export function calculateMinOutput(amount: bigint, slippagePercent: number): bigint {
  const slippage = BigInt(Math.floor(slippagePercent * 100))
  return (amount * (10000n - slippage)) / 10000n
}
