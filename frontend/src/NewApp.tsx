import { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChakraProvider, Flex, Box } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import { createWeb3Modal } from '@web3modal/wagmi'
import { config, projectId, metadata, bscTestnet } from './config/web3'
import { theme } from './theme'
import { DashboardV2 as Dashboard } from './components/Dashboard/DashboardV2'
import { SwapCard } from './components/Swap/SwapCard'
import { LiquidityPage } from './components/Liquidity'
import { FarmsList } from './components/Farms'
import { CreateLock } from './components/Lock/CreateLock'
import { MyVeNFTs } from './components/Lock/MyVeNFTs'
import { Vote } from './components/Vote'
import { Rewards } from './components/Rewards'
import { Tabs, type Tab, useToast, ToastContainer, NotificationProvider } from './components/common'
import { Header, Footer, PageContainer, type Page } from './components/Layout'
import { useUserVeNFTs } from './hooks/useVeNFT'
import { useTranslation } from 'react-i18next'
import './App.css'

// 全局导航接口
declare global {
  interface Window {
    navigateTo?: (page: Page) => void
  }
}

// 创建 QueryClient
const queryClient = new QueryClient()

// 创建 Web3Modal 实例
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: bscTestnet,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0ea5e9',
  }
})

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { messages, closeToast } = useToast()
  const { t } = useTranslation()
  const { nfts: veNFTs } = useUserVeNFTs()

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
  }

  // 暴露导航函数到全局，供其他组件使用
  useEffect(() => {
    window.navigateTo = handlePageChange
    return () => {
      delete window.navigateTo
    }
  }, [])  // handlePageChange 是稳定的引用，不需要在依赖数组中

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />

      case 'swap':
        return (
          <Box maxW="600px" mx="auto">
            <SwapCard />
          </Box>
        )

      case 'liquidity':
        return <LiquidityPage />

      case 'farms':
        return (
          <Box maxW="1200px" mx="auto">
            <FarmsList />
          </Box>
        )

      case 'lock':
        const lockTabs: Tab[] = [
          {
            key: 'create',
            label: t('lock.createLock'),
            content: <CreateLock />,
          },
          {
            key: 'my',
            label: t('lock.myVeNFTs'),
            content: <MyVeNFTs />,
          },
        ]
        // 如果用户已有 ve-NFT，默认显示"我的 ve-NFT" tab
        const defaultLockTab = veNFTs && veNFTs.length > 0 ? 'my' : 'create'
        return (
          <Box maxW="600px" mx="auto">
            <Tabs tabs={lockTabs} defaultActiveKey={defaultLockTab} />
          </Box>
        )

      case 'vote':
        return (
          <Box maxW="1000px" mx="auto">
            <Vote />
          </Box>
        )

      case 'rewards':
        return (
          <Box maxW="1000px" mx="auto">
            <Rewards />
          </Box>
        )

      default:
        return <Dashboard />
    }
  }

  return (
    <Flex direction="column" minH="100vh">
      {/* Sonner 通知系统 */}
      <NotificationProvider />

      {/* Header */}
      <Header currentPage={currentPage} onPageChange={handlePageChange} />

      {/* 主内容区域 */}
      <Box flex="1">
        <AnimatePresence mode="wait">
          <PageContainer key={currentPage}>{renderPage()}</PageContainer>
        </AnimatePresence>
      </Box>

      {/* Footer */}
      <Footer />

      {/* Toast 通知（兼容旧系统） */}
      <ToastContainer messages={messages} onClose={closeToast} />
    </Flex>
  )
}

function NewApp() {
  return (
    <ChakraProvider theme={theme}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </WagmiProvider>
    </ChakraProvider>
  )
}

export default NewApp
