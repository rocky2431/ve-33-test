import type { Token } from '../types'

// 重新导出 Token 类型
export type { Token }

// BSC Testnet Token 列表
export const TOKENS: Record<string, Token> = {
  SRT: {
    address: import.meta.env.VITE_CONTRACT_TOKEN as `0x${string}`,
    symbol: 'SRT',
    name: 'SRT Token',
    decimals: 18,
  },
  WSRT: {
    address: import.meta.env.VITE_CONTRACT_WETH as `0x${string}`,
    symbol: 'WSRT',
    name: 'Wrapped SRT',
    decimals: 18,
  },
  // 稳定币
  SRUSD: {
    address: '0x5f3347B3C43821D2783792395B9A4f44A28308A7' as `0x${string}`,
    symbol: 'SRUSD',
    name: 'Star USD',
    decimals: 18,
  },
  // 测试代币
  STE: {
    address: '0x8103319987b2ABB1F59F4b9c8aD20F70C9b64E8c' as `0x${string}`,
    symbol: 'STE',
    name: 'Star Energy',
    decimals: 18,
  },
  STF: {
    address: '0xB83da2B78d2C4734585b5167863881Dbf3Ea3cAb' as `0x${string}`,
    symbol: 'STF',
    name: 'Star Finance',
    decimals: 18,
  },
  STCX: {
    address: '0x4040a8cA682408c8cbD4Bb1bE9358409757b225C' as `0x${string}`,
    symbol: 'STCX',
    name: 'Star Chain X',
    decimals: 18,
  },
  SBF: {
    address: '0x048c72128d414e5FC9B3ab9853bb7457A046e365' as `0x${string}`,
    symbol: 'SBF',
    name: 'Star Base Finance',
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
