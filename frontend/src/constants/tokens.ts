import type { Token } from '../types'

// BSC Testnet Token 列表
export const TOKENS: Record<string, Token> = {
  SOLID: {
    address: import.meta.env.VITE_CONTRACT_TOKEN as `0x${string}`,
    symbol: 'SOLID',
    name: 'Solidly Token',
    decimals: 18,
  },
  WBNB: {
    address: import.meta.env.VITE_CONTRACT_WETH as `0x${string}`,
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
  },
}

// Token 列表数组（用于下拉选择）
export const TOKEN_LIST: Token[] = Object.values(TOKENS)

// 根据地址查找 Token
export function getTokenByAddress(address: string): Token | undefined {
  return TOKEN_LIST.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  )
}

// 根据符号查找 Token
export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS[symbol]
}
