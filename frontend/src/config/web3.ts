import { defaultWagmiConfig } from '@web3modal/wagmi'
import { bscTestnet } from 'wagmi/chains'

// 项目元数据
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set')
}

// Web3Modal 元数据
export const metadata = {
  name: 've(3,3) DEX',
  description: 'Vote-Escrowed Decentralized Exchange on BSC',
  url: 'https://ve33dex.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 支持的链
const chains = [bscTestnet] as const

// Wagmi 配置
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// 导出 bscTestnet 供其他地方使用
export { bscTestnet }

// 合约地址
export const contracts = {
  token: import.meta.env.VITE_CONTRACT_TOKEN as `0x${string}`,
  factory: import.meta.env.VITE_CONTRACT_FACTORY as `0x${string}`,
  router: import.meta.env.VITE_CONTRACT_ROUTER as `0x${string}`,
  weth: import.meta.env.VITE_CONTRACT_WETH as `0x${string}`,
  votingEscrow: import.meta.env.VITE_CONTRACT_VOTING_ESCROW as `0x${string}`,
  voter: import.meta.env.VITE_CONTRACT_VOTER as `0x${string}`,
  minter: import.meta.env.VITE_CONTRACT_MINTER as `0x${string}`,
}

// 链配置
export const chainConfig = {
  id: bscTestnet.id,
  name: bscTestnet.name,
  explorerUrl: import.meta.env.VITE_BLOCK_EXPLORER,
}
