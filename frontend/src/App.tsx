import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import './App.css'
import { SwapCard } from './components/Swap/SwapCard'
import { Vote } from './components/Vote'
import { Rewards } from './components/Rewards'
import { LiquidityPage } from './components/Liquidity'
import { useTokenBalance } from './hooks/useTokenBalance'
import { TOKENS } from './constants/tokens'
import { formatTokenAmount } from './utils/format'

type Page = 'swap' | 'liquidity' | 'vote' | 'rewards' | 'info'

// 全局导航接口
declare global {
  interface Window {
    navigateTo?: (page: Page) => void
  }
}

function App() {
  const { address, isConnected } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('swap')

  // 暴露导航函数到全局
  useEffect(() => {
    window.navigateTo = (page: Page) => {
      setCurrentPage(page)
    }
    return () => {
      delete window.navigateTo
    }
  }, [])

  // 查询 SOLID 余额
  const { balance: solidBalance } = useTokenBalance(
    TOKENS.SRT.address,
    address
  )

  // 查询 WBNB 余额
  const { balance: wbnbBalance } = useTokenBalance(
    TOKENS.WSRT.address,
    address
  )

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '40px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
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
              }}
            >
              ve(3,3) DEX
            </h1>

            {/* 钱包连接按钮 */}
            <w3m-button />
          </div>

          {/* 导航 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            {(['swap', 'liquidity', 'vote', 'rewards', 'info'] as const).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor:
                    currentPage === page ? '#667eea' : '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {page === 'swap'
                  ? 'Swap'
                  : page === 'liquidity'
                  ? '流动性'
                  : page === 'vote'
                  ? '投票'
                  : page === 'rewards'
                  ? '奖励'
                  : '信息'}
              </button>
            ))}
          </div>

          {/* 余额卡片 */}
          {isConnected && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                您的余额
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                }}
              >
                <span>
                  SOLID: {formatTokenAmount(solidBalance, 18, 4)}
                </span>
                <span>
                  WBNB: {formatTokenAmount(wbnbBalance, 18, 4)}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          {currentPage === 'swap' && <SwapCard />}

          {currentPage === 'liquidity' && <LiquidityPage />}

          {currentPage === 'vote' && <Vote />}

          {currentPage === 'rewards' && <Rewards />}

          {currentPage === 'info' && (
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #333',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  marginBottom: '20px',
                  color: '#667eea',
                }}
              >
                合约信息
              </h2>

              <div style={{ display: 'grid', gap: '12px' }}>
                <InfoRow
                  label="SOLID Token"
                  value={import.meta.env.VITE_CONTRACT_TOKEN}
                />
                <InfoRow
                  label="WBNB"
                  value={import.meta.env.VITE_CONTRACT_WETH}
                />
                <InfoRow
                  label="Router"
                  value={import.meta.env.VITE_CONTRACT_ROUTER}
                />
                <InfoRow
                  label="Factory"
                  value={import.meta.env.VITE_CONTRACT_FACTORY}
                />
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#888',
                  textAlign: 'center',
                }}
              >
                🌐 BSC Testnet (Chain ID: 97)
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <p>ve(3,3) DEX - Vote-Escrowed Decentralized Exchange</p>
          <p style={{ marginTop: '8px' }}>
            基于 Solidly 的 ve(3,3) 机制 | BSC Testnet
          </p>
        </footer>
      </div>
    </div>
  )
}

// 信息行组件
function InfoRow({ label, value }: { label: string; value: string }) {
  const shortenAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: '#0a0a0a',
        borderRadius: '8px',
        fontSize: '14px',
      }}
    >
      <span style={{ color: '#aaa' }}>{label}</span>
      <span
        style={{
          fontFamily: 'monospace',
          color: '#ccc',
        }}
      >
        {shortenAddress(value)}
      </span>
    </div>
  )
}

export default App
