import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi'
import { config, projectId } from './config/web3'
import { Dashboard } from './components/Dashboard/Dashboard'
import { SwapCard } from './components/Swap/SwapCard'
import { LiquidityPage } from './components/Liquidity'
import { CreateLock } from './components/Lock/CreateLock'
import { MyVeNFTs } from './components/Lock/MyVeNFTs'
import { Vote } from './components/Vote'
import { Rewards } from './components/Rewards'
import { Tabs, type Tab, useToast, ToastContainer } from './components/common'
import './App.css'

// 定义 Page 类型
type Page = 'dashboard' | 'swap' | 'liquidity' | 'lock' | 'vote' | 'rewards'

// 创建 QueryClient
const queryClient = new QueryClient()

// 创建 Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
})

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { messages, closeToast } = useToast()

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />

      case 'swap':
        return (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SwapCard />
          </div>
        )

      case 'liquidity':
        return <LiquidityPage />

      case 'lock':
        const lockTabs: Tab[] = [
          {
            key: 'create',
            label: '创建锁仓',
            content: <CreateLock />,
          },
          {
            key: 'my',
            label: '我的 ve-NFT',
            content: <MyVeNFTs />,
          },
        ]
        return (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Tabs tabs={lockTabs} defaultActiveKey="create" />
          </div>
        )

      case 'vote':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Vote />
          </div>
        )

      case 'rewards':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Rewards />
          </div>
        )

      default:
        return <Dashboard />
    }
  }

  return (
    <>
      {/* 自定义 Header */}
      <header
        style={{
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #333',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => handlePageChange('dashboard')}
          >
            ve(3,3) DEX
          </h1>

          <nav style={{ display: 'flex', gap: '12px' }}>
            {(['dashboard', 'swap', 'liquidity', 'lock', 'vote', 'rewards'] as Page[]).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: currentPage === page ? '#667eea' : 'transparent',
                  color: currentPage === page ? '#fff' : '#aaa',
                  border: currentPage === page ? 'none' : '1px solid #333',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {page === 'dashboard' ? '仪表盘' : page === 'swap' ? 'Swap' : page === 'liquidity' ? '流动性' : page === 'lock' ? '锁仓' : page === 'vote' ? '投票' : '奖励'}
              </button>
            ))}
          </nav>

          <w3m-button />
        </div>
      </header>

      {/* 主内容 */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {renderPage()}
      </main>

      {/* Toast 通知 */}
      <ToastContainer messages={messages} onClose={closeToast} />
    </>
  )
}

function NewApp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default NewApp
