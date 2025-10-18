/**
 * Tabs 组件 - 基于 Chakra UI
 * 现代化的标签页组件，支持禁用状态和全宽布局
 */

import {
  Tabs as ChakraTabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { useState } from 'react'
import type { ReactNode } from 'react'

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
  const defaultIndex = tabs.findIndex((tab) => tab.key === defaultActiveKey)
  const [activeIndex, setActiveIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0)

  const handleChange = (index: number) => {
    setActiveIndex(index)
    onChange?.(tabs[index].key)
  }

  return (
    <ChakraTabs
      index={activeIndex}
      onChange={handleChange}
      variant="soft-rounded"
      colorScheme="brand"
      isFitted={fullWidth}
    >
      <TabList
        gap={2}
        borderBottom="1px solid"
        borderColor="gray.700"
        pb={4}
        mb={6}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            isDisabled={tab.disabled}
            color="gray.400"
            fontWeight="medium"
            _selected={{
              color: 'white',
              bg: 'brand.500',
            }}
            _hover={{
              color: tab.disabled ? 'gray.400' : 'gray.200',
            }}
            _disabled={{
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.key} p={0}>
            {tab.content}
          </TabPanel>
        ))}
      </TabPanels>
    </ChakraTabs>
  )
}
