import { Tabs, type Tab } from '../common'
import { VoteList } from './VoteList'
import { MyVotes } from './MyVotes'

export function Vote() {
  const tabs: Tab[] = [
    { key: 'vote', label: '投票', content: <VoteList /> },
    { key: 'my-votes', label: '我的投票', content: <MyVotes /> },
  ]

  return (
    <div>
      <Tabs tabs={tabs} defaultActiveKey="vote" />
    </div>
  )
}
