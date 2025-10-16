import { useAccount } from 'wagmi'
import './App.css'

function App() {
  const { address, isConnected } = useAccount()

  // 从环境变量读取合约地址
  const contracts = {
    token: import.meta.env.VITE_CONTRACT_TOKEN,
    factory: import.meta.env.VITE_CONTRACT_FACTORY,
    router: import.meta.env.VITE_CONTRACT_ROUTER,
    weth: import.meta.env.VITE_CONTRACT_WETH,
    votingEscrow: import.meta.env.VITE_CONTRACT_VOTING_ESCROW,
    voter: import.meta.env.VITE_CONTRACT_VOTER,
    minter: import.meta.env.VITE_CONTRACT_MINTER,
  }

  const explorerUrl = import.meta.env.VITE_BLOCK_EXPLORER

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 标题和钱包连接 */}
        <header style={{ marginBottom: '60px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ve(3,3) DEX
            </h1>

            {/* 钱包连接按钮 */}
            <w3m-button />
          </div>

          <p style={{ fontSize: '18px', color: '#888', textAlign: 'center' }}>
            去中心化交易所 - BSC Testnet
          </p>

          {/* 连接状态显示 */}
          {isConnected && address && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #333',
              textAlign: 'center'
            }}>
              <p style={{ color: '#4ade80', fontSize: '14px', margin: 0 }}>
                ✅ 已连接钱包
              </p>
              <p style={{
                color: '#888',
                fontSize: '12px',
                fontFamily: 'monospace',
                marginTop: '8px'
              }}>
                {address}
              </p>
            </div>
          )}
        </header>

        {/* 合约地址卡片 */}
        <div style={{
          display: 'grid',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* 核心 AMM 层 */}
          <section style={{
            backgroundColor: '#1a1a1a',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #333'
          }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '24px',
              color: '#667eea'
            }}>
              核心 AMM 层
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <ContractRow
                label="Token (SOLID)"
                address={contracts.token}
                explorerUrl={explorerUrl}
              />
              <ContractRow
                label="Factory"
                address={contracts.factory}
                explorerUrl={explorerUrl}
              />
              <ContractRow
                label="Router"
                address={contracts.router}
                explorerUrl={explorerUrl}
              />
              <ContractRow
                label="WETH"
                address={contracts.weth}
                explorerUrl={explorerUrl}
              />
            </div>
          </section>

          {/* ve(3,3) 治理层 */}
          <section style={{
            backgroundColor: '#1a1a1a',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #333'
          }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '24px',
              color: '#764ba2'
            }}>
              ve(3,3) 治理层
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <ContractRow
                label="VotingEscrow"
                address={contracts.votingEscrow}
                explorerUrl={explorerUrl}
              />
              <ContractRow
                label="Voter"
                address={contracts.voter}
                explorerUrl={explorerUrl}
              />
              <ContractRow
                label="Minter"
                address={contracts.minter}
                explorerUrl={explorerUrl}
              />
            </div>
          </section>
        </div>

        {/* 状态信息 */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #333',
          textAlign: 'center'
        }}>
          <p style={{ color: '#888', fontSize: '14px' }}>
            ✅ 合约已成功部署到 BSC Testnet
          </p>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
            {isConnected
              ? '🟢 Web3 已连接 - 准备与合约交互'
              : '🔵 请连接钱包开始使用'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

// 合约地址行组件
function ContractRow({
  label,
  address,
  explorerUrl
}: {
  label: string
  address: string
  explorerUrl: string
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: '#0a0a0a',
      borderRadius: '8px',
      border: '1px solid #222'
    }}>
      <span style={{
        fontWeight: '600',
        color: '#aaa',
        minWidth: '140px'
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ccc',
        flex: 1,
        marginLeft: '16px',
        marginRight: '16px'
      }}>
        {address}
      </span>
      <a
        href={`${explorerUrl}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 16px',
          backgroundColor: '#667eea',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
      >
        查看
      </a>
    </div>
  )
}

export default App
