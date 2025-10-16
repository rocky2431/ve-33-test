// TypeScript 类型定义

export interface Token {
  address: `0x${string}`
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface Route {
  from: `0x${string}`
  to: `0x${string}`
  stable: boolean
}

export interface SwapParams {
  amountIn: bigint
  amountOutMin: bigint
  routes: Route[]
  to: `0x${string}`
  deadline: number
}

export interface AddLiquidityParams {
  tokenA: `0x${string}`
  tokenB: `0x${string}`
  stable: boolean
  amountADesired: bigint
  amountBDesired: bigint
  amountAMin: bigint
  amountBMin: bigint
  to: `0x${string}`
  deadline: number
}

export interface RemoveLiquidityParams {
  tokenA: `0x${string}`
  tokenB: `0x${string}`
  stable: boolean
  liquidity: bigint
  amountAMin: bigint
  amountBMin: bigint
  to: `0x${string}`
  deadline: number
}

export interface PairMetadata {
  dec0: bigint
  dec1: bigint
  r0: bigint
  r1: bigint
  st: boolean
  t0: `0x${string}`
  t1: `0x${string}`
}
