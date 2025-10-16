import { Tabs, type Tab } from '../common'
import { ClaimRewards } from './ClaimRewards'
import { RewardsHistory } from './RewardsHistory'

export function Rewards() {
  const tabs: Tab[] = [
    { key: 'claim', label: '领取奖励', content: <ClaimRewards /> },
    { key: 'history', label: '历史记录', content: <RewardsHistory /> },
  ]

  return (
    <div>
      <Tabs tabs={tabs} defaultActiveKey="claim" />
    </div>
  )
}
