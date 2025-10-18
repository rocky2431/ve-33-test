import { createContext, useContext, useState } from 'react'
import { Tabs, type Tab } from '../common'
import { AddLiquidity } from './AddLiquidity'
import { RemoveLiquidity } from './RemoveLiquidity'
import { MyLiquidity } from './MyLiquidity'

// 创建 Context 用于 tab 切换
interface LiquidityTabContext {
  switchToTab: (tabKey: string) => void
}

const LiquidityTabContext = createContext<LiquidityTabContext | null>(null)

export function useLiquidityTab() {
  const context = useContext(LiquidityTabContext)
  if (!context) {
    throw new Error('useLiquidityTab must be used within LiquidityPage')
  }
  return context
}

export function LiquidityPage() {
  const [activeKey, setActiveKey] = useState('add')

  const switchToTab = (tabKey: string) => {
    setActiveKey(tabKey)
  }

  const tabs: Tab[] = [
    {
      key: 'add',
      label: '添加流动性',
      content: <AddLiquidity />,
    },
    {
      key: 'remove',
      label: '移除流动性',
      content: <RemoveLiquidity />,
    },
    {
      key: 'my',
      label: '我的流动性',
      content: <MyLiquidity />,
    },
  ]

  return (
    <LiquidityTabContext.Provider value={{ switchToTab }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Tabs
          key={activeKey}
          tabs={tabs}
          defaultActiveKey={activeKey}
          onChange={(key) => setActiveKey(key)}
        />
      </div>
    </LiquidityTabContext.Provider>
  )
}

export { AddLiquidity, RemoveLiquidity, MyLiquidity }
