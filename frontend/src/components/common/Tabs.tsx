import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { colors, spacing, fontSize, transition } from '../../constants/theme'

export interface Tab {
  key: string
  label: string
  content: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultActiveKey?: string
  onChange?: (key: string) => void
  fullWidth?: boolean
}

export function Tabs({ tabs, defaultActiveKey, onChange, fullWidth = false }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || tabs[0]?.key)

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return
    setActiveKey(key)
    onChange?.(key)
  }

  const activeTab = tabs.find((tab) => tab.key === activeKey)

  const tabsContainerStyle: CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: spacing.lg,
  }

  const tabButtonStyle = (isActive: boolean, disabled?: boolean): CSSProperties => ({
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: fontSize.md,
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: isActive ? colors.primary : colors.textSecondary,
    border: 'none',
    borderBottom: `2px solid ${isActive ? colors.primary : 'transparent'}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: transition.normal,
    flex: fullWidth ? 1 : 'none',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      {/* Tabs Header */}
      <div style={tabsContainerStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={tabButtonStyle(tab.key === activeKey, tab.disabled)}
            onClick={() => handleTabClick(tab.key, tab.disabled)}
            onMouseEnter={(e) => {
              if (!tab.disabled && tab.key !== activeKey) {
                e.currentTarget.style.color = colors.textPrimary
              }
            }}
            onMouseLeave={(e) => {
              if (tab.key !== activeKey) {
                e.currentTarget.style.color = colors.textSecondary
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{activeTab?.content}</div>
    </div>
  )
}
