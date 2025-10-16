import { defaultWagmiConfig } from '@web3modal/wagmi'
import { bscTestnet } from 'wagmi/chains'

// 项目元数据
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set')
}

// Web3Modal 元数据
const metadata = {
  name: 've(3,3) DEX',
  description: 'Vote-Escrowed Decentralized Exchange on BSC',
  url: 'http://localhost:3001',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Wagmi 配置
export const config = defaultWagmiConfig({
  chains: [bscTestnet],
  projectId,
  metadata,
})

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
