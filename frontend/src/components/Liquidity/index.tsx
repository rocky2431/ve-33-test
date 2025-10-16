import { Tabs, type Tab } from '../common'
import { AddLiquidity } from './AddLiquidity'
import { RemoveLiquidity } from './RemoveLiquidity'
import { MyLiquidity } from './MyLiquidity'

export function LiquidityPage() {
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Tabs tabs={tabs} defaultActiveKey="add" />
    </div>
  )
}

export { AddLiquidity, RemoveLiquidity, MyLiquidity }
