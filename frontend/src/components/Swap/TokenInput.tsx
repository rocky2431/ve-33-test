import { useState } from 'react'
import type { Token } from '../../types'
import { formatTokenAmount } from '../../utils/format'
import { TOKEN_LIST } from '../../constants/tokens'

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
  token: Token | undefined
  onSelectToken: (token: Token) => void
  balance?: bigint
  label?: string
  readOnly?: boolean
}

export function TokenInput({
  value,
  onChange,
  token,
  onSelectToken,
  balance,
  label = '输入',
  readOnly = false,
}: TokenInputProps) {
  const [showTokenList, setShowTokenList] = useState(false)

  const handleMaxClick = () => {
    if (balance && token) {
      const formatted = formatTokenAmount(balance, token.decimals, 18)
      onChange(formatted)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #222',
      }}
    >
      {/* 标签和余额 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#888',
        }}
      >
        <span>{label}</span>
        {balance !== undefined && token ? (
          <span>
            余额: {formatTokenAmount(balance, token.decimals)} {token.symbol}
          </span>
        ) : null}
      </div>

      {/* 输入框和 Token 选择器 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* 数量输入 */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value
            // 只允许数字和小数点
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              onChange(val)
            }
          }}
          placeholder="0.0"
          readOnly={readOnly}
          style={{
            flex: 1,
            fontSize: '24px',
            fontWeight: '600',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
          }}
        />

        {/* MAX 按钮 */}
        {balance !== undefined && balance > 0n && !readOnly && (
          <button
            onClick={handleMaxClick}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            MAX
          </button>
        )}

        {/* Token 选择按钮 */}
        <button
          onClick={() => setShowTokenList(!showTokenList)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            color: '#fff',
          }}
        >
          {token ? (
            <>
              <span>{token.symbol}</span>
              <span style={{ fontSize: '12px' }}>▼</span>
            </>
          ) : (
            <>
              <span>选择代币</span>
              <span style={{ fontSize: '12px' }}>▼</span>
            </>
          )}
        </button>
      </div>

      {/* Token 列表弹窗 */}
      {showTokenList && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
        >
          {TOKEN_LIST.map((t) => (
            <div
              key={t.address}
              onClick={() => {
                onSelectToken(t)
                setShowTokenList(false)
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0a0a0a'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>
                  {t.symbol}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>{t.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
