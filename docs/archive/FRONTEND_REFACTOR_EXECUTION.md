# 前端改造执行计划

**技术选型：** Chakra UI + 完整功能集
**实施方式：** 并行开发（UI + 功能）
**预计时间：** 12-16天
**日期：** 2025-10-17

---

## ⚠️ 重要声明：价格数据策略

### 📌 阶段1：UI展示开发（Day 1-6）
- ✅ **允许使用模拟价格数据**用于UI布局和展示效果
- ✅ 目的：快速验证UI设计和用户体验
- ✅ 范围：仅限于视觉展示，不影响真实功能

### 📌 阶段2：功能集成（Day 7起）
- 🚫 **严禁使用任何模拟数据**
- ✅ **必须100%使用真实价格接口**
  - Chainlink Price Feeds（主要）
  - DEX TWAP Oracle（备用）
  - 混合方案（推荐）
- ✅ 所有价格相关功能必须连接真实合约
- ✅ 完整的错误处理和数据验证

### 🎯 关键原则
**模拟数据仅用于UI原型展示，功能实现必须100%真实！**

---

## 📦 技术栈确认

### 核心依赖

```bash
# UI框架
npm install @chakra-ui/react @chakra-ui/icons @emotion/react @emotion/styled framer-motion

# 状态管理
npm install zustand

# 数据缓存
npm install @tanstack/react-query

# 表单管理
npm install react-hook-form

# 通知系统
npm install sonner  # Chakra UI配套

# 图表库
npm install recharts  # React图表库，轻量且强大
npm install lightweight-charts  # TradingView图表（可选）

# 国际化
npm install i18next react-i18next

# 工具库
npm install dayjs
npm install copy-to-clipboard
npm install numeral  # 数字格式化
```

### 价格预言机方案

```typescript
// 选项1：Chainlink Price Feeds（推荐）
// 选项2：DEX TWAP（时间加权平均价格）
// 选项3：混合方案（优先Chainlink，回退到TWAP）
```

---

## 🏗️ 项目结构重构

```
frontend/src/
├── components/
│   ├── common/          # 通用组件
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Table/
│   │   └── ...
│   ├── layout/          # 布局组件
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Footer/
│   ├── charts/          # 图表组件（新增）
│   │   ├── TVLChart/
│   │   ├── VolumeChart/
│   │   └── APRChart/
│   ├── Swap/
│   ├── Liquidity/
│   ├── Vote/
│   ├── Rewards/
│   └── History/         # 历史记录（新增）
├── hooks/
│   ├── useSwap.ts
│   ├── useVote.ts
│   ├── useRewards.ts
│   ├── usePrice.ts      # 价格查询（新增）
│   ├── useChart.ts      # 图表数据（新增）
│   └── useHistory.ts    # 历史记录（新增）
├── stores/              # Zustand stores（新增）
│   ├── appStore.ts
│   ├── walletStore.ts
│   └── transactionStore.ts
├── i18n/                # 国际化（新增）
│   ├── locales/
│   │   ├── en.json
│   │   └── zh.json
│   └── config.ts
├── theme/               # Chakra UI主题（新增）
│   ├── colors.ts
│   ├── components.ts
│   └── index.ts
├── utils/
│   ├── format.ts
│   ├── errorHandler.ts
│   └── priceOracle.ts   # 价格预言机（新增）
└── types/
    ├── common.ts
    └── chart.ts         # 图表类型（新增）
```

---

## 📅 详细执行时间表

### 第1-2天：基础设施搭建

**任务列表：**

1. **创建新分支并安装依赖**
   ```bash
   git checkout -b feature/frontend-refactor
   npm install @chakra-ui/react @chakra-ui/icons @emotion/react @emotion/styled framer-motion
   npm install zustand @tanstack/react-query react-hook-form sonner
   npm install recharts i18next react-i18next dayjs numeral copy-to-clipboard
   ```

2. **配置Chakra UI主题**
   - 创建主题配置文件
   - 设置颜色系统（支持暗色主题）
   - 配置组件默认样式
   - 设置响应式断点

3. **配置国际化**
   - 设置i18next
   - 创建语言文件（中文、英文）
   - 实现语言切换功能

4. **配置状态管理**
   - 创建Zustand stores
   - 配置React Query
   - 设置持久化存储

5. **配置通知系统**
   - 集成Sonner
   - 创建通知工具函数

**验收标准：**
- ✅ 所有依赖安装成功
- ✅ Chakra UI主题可用
- ✅ 暗色主题切换正常
- ✅ 语言切换正常
- ✅ 状态管理可用

---

### 第3-4天：UI组件迁移

**任务列表：**

1. **迁移通用组件到Chakra UI**
   - Button → Chakra Button
   - Card → Chakra Card
   - Input → Chakra Input
   - Table → Chakra Table
   - Modal → Chakra Modal
   - Badge → Chakra Badge
   - Spinner → Chakra Spinner

2. **创建自定义组件**
   - TokenInput（基于Chakra）
   - TokenSelector（下拉选择）
   - WalletButton（增强版）
   - NetworkSelector（网络切换）
   - ThemeToggle（主题切换）
   - LanguageSelector（语言切换）

3. **布局组件**
   - Header（导航栏）
   - Sidebar（侧边栏，可选）
   - Footer（页脚）
   - PageContainer（页面容器）

4. **添加动画效果**
   - 页面切换动画
   - 卡片悬停效果
   - 列表项动画
   - 加载动画

**验收标准：**
- ✅ 所有页面使用Chakra组件
- ✅ 组件样式统一美观
- ✅ 动画流畅自然
- ✅ 响应式适配完善

---

### 第5-6天：图表和数据可视化

**任务列表：**

1. **创建图表组件**
   ```typescript
   // TVLChart - 总锁仓价值图表
   // VolumeChart - 交易量图表
   // APRChart - APR趋势图表
   // PriceChart - 价格走势图表
   ```

2. **实现数据查询**
   ```typescript
   // useChartData hook
   // 查询历史TVL数据
   // 查询历史交易量数据
   // 查询历史APR数据
   // 查询价格历史数据
   ```

3. **集成Recharts**
   - 线图（价格走势）
   - 柱状图（交易量）
   - 面积图（TVL）
   - 复合图表（多指标）

4. **添加交互功能**
   - 时间范围选择（24h, 7d, 30d, 1y）
   - 数据点悬停显示
   - 缩放和平移
   - 导出图表（可选）

**验收标准：**
- ✅ 所有图表正常显示
- ✅ 数据准确
- ✅ 交互流畅
- ✅ 响应式适配

---

### 第7-8天：价格预言机集成

> **⚠️ 关键要求：从此阶段开始，严禁使用任何模拟价格数据！**
>
> - 🚫 不允许硬编码价格
> - 🚫 不允许使用假数据
> - 🚫 不允许随机生成价格
> - ✅ 必须连接真实的Chainlink Price Feeds
> - ✅ 必须连接真实的DEX TWAP Oracle
> - ✅ 必须有完整的错误处理和回退机制

**任务列表：**

1. **实现价格查询服务（100%真实数据）**
   ```typescript
   // src/services/priceOracle.ts

   // 方案1：Chainlink Price Feeds（真实合约）
   interface PriceFeed {
     getLatestPrice(token: Address): Promise<bigint>
     getPriceAt(token: Address, timestamp: number): Promise<bigint>
   }

   // 方案2：DEX TWAP（真实合约）
   interface TWAPOracle {
     getTWAP(pair: Address, window: number): Promise<bigint>
   }

   // 混合方案（推荐）
   class PriceOracle {
     async getPrice(token: Address): Promise<bigint> {
       try {
         // 优先使用Chainlink真实合约
         return await this.chainlink.getLatestPrice(token)
       } catch {
         // 回退到TWAP真实合约
         return await this.twap.getTWAP(token)
       }
     }
   }
   ```

2. **创建价格查询Hooks**
   ```typescript
   // useTokenPrice - 单个代币价格
   // useMultipleTokenPrices - 批量查询价格
   // usePriceHistory - 价格历史数据
   ```

3. **更新所有组件显示USD价值**
   - Swap组件（显示交易金额的USD价值）
   - Liquidity组件（显示流动性价值）
   - Vote组件（显示投票池TVL）
   - Rewards组件（显示奖励USD价值）

4. **价格缓存和更新**
   - 使用React Query缓存价格
   - 定时自动更新（每30秒）
   - 实时价格WebSocket（可选）

**验收标准：**
- ✅ 价格查询准确
- ✅ 所有金额显示USD价值
- ✅ 价格更新及时
- ✅ 错误处理完善

---

### 第9-10天：交易历史记录

**任务列表：**

1. **创建历史记录组件**
   ```typescript
   // components/History/
   // - TransactionHistory.tsx  # 交易历史
   // - SwapHistory.tsx         # Swap历史
   // - LiquidityHistory.tsx    # 流动性操作历史
   // - VoteHistory.tsx         # 投票历史
   // - RewardHistory.tsx       # 奖励领取历史
   ```

2. **实现事件日志查询**
   ```typescript
   // 使用viem查询合约事件
   import { createPublicClient } from 'viem'

   async function getSwapHistory(address: Address) {
     const logs = await publicClient.getLogs({
       address: pairAddress,
       event: parseAbiItem('event Swap(...)'),
       fromBlock: 'earliest',
       toBlock: 'latest',
       args: {
         sender: address,
       },
     })
     return parseLogs(logs)
   }
   ```

3. **创建历史记录Hooks**
   ```typescript
   // useSwapHistory
   // useLiquidityHistory
   // useVoteHistory
   // useRewardHistory
   // useTransactionHistory (汇总所有历史)
   ```

4. **实现分页和筛选**
   - 分页加载（每页10-20条）
   - 按类型筛选
   - 按时间范围筛选
   - 按状态筛选（成功/失败）
   - 搜索功能（交易哈希）

5. **添加历史详情**
   - 交易详情弹窗
   - 在区块浏览器查看
   - 交易状态追踪

**验收标准：**
- ✅ 历史记录查询正常
- ✅ 分页和筛选功能完善
- ✅ 数据准确完整
- ✅ 性能优秀

---

### 第11-12天：功能完善和优化

**任务列表：**

1. **完善Swap功能**
   - 滑点设置（0.1%, 0.5%, 1%, 自定义）
   - 价格影响警告
   - 最小接收金额显示
   - 交易路径显示（如果有路由）
   - 交易确认弹窗
   - 交易追踪（pending → success → confirmed）

2. **完善Liquidity功能**
   - 添加流动性
     - 自动计算token比例
     - LP token数量预估
     - 价格范围显示
     - 交易确认
   - 移除流动性
     - LP token输入
     - 接收token数量预估
     - 交易确认
   - 池详情页
     - TVL、Volume、APR
     - 价格走势图
     - 流动性分布

3. **完善Vote功能**
   - ve-NFT选择（如果用户有多个）
   - 投票冷却期检查和倒计时
   - 投票权重验证（总和=100%）
   - 投票影响预估
   - 历史投票记录

4. **完善Rewards功能**
   - 单个奖励领取
   - 批量奖励领取
   - 奖励详情（来源、金额、USD价值）
   - 领取历史
   - 自动复投功能（可选）

5. **错误处理优化**
   - 统一的错误解析
   - 友好的错误提示
   - 错误恢复建议
   - 错误上报（可选）

**验收标准：**
- ✅ 所有功能流程完整
- ✅ 错误处理完善
- ✅ 用户体验良好
- ✅ 边界情况处理

---

### 第13-14天：性能优化和测试

**任务列表：**

1. **性能优化**
   - 代码分割（React.lazy）
   - 图片优化（WebP格式）
   - 组件懒加载
   - 虚拟滚动（长列表）
   - 查询优化（减少重复查询）
   - 缓存策略优化

2. **移动端适配**
   - 响应式布局调整
   - 触摸手势支持
   - 移动端专用组件
   - 性能优化（减少动画）

3. **功能测试**
   - Swap完整流程测试
   - Liquidity完整流程测试
   - Vote完整流程测试
   - Rewards完整流程测试
   - 边界情况测试
   - 错误处理测试

4. **兼容性测试**
   - Chrome测试
   - Firefox测试
   - Safari测试
   - 移动端浏览器测试
   - MetaMask测试
   - WalletConnect测试

5. **用户体验优化**
   - 加载速度优化
   - 交互反馈优化
   - 文案优化
   - 引导提示（首次使用）

**验收标准：**
- ✅ 首屏加载 < 3秒
- ✅ 页面切换 < 500ms
- ✅ 所有功能测试通过
- ✅ 移动端体验良好
- ✅ 无明显bug

---

### 第15-16天：文档和部署（可选）

**任务列表：**

1. **更新文档**
   - README更新
   - 组件文档
   - API文档
   - 部署指南

2. **性能测试和优化**
   - Lighthouse测试
   - Bundle大小分析
   - 性能瓶颈分析
   - 最后优化

3. **部署准备**
   - 环境变量配置
   - 构建优化
   - CDN配置
   - 缓存策略

---

## 🎯 关键技术实现

### 1. Chakra UI主题配置

```typescript
// src/theme/index.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

const colors = {
  brand: {
    50: '#e6f2ff',
    100: '#baddff',
    500: '#2e7fd7',
    600: '#1e6bc4',
    900: '#0d3a6e',
  },
}

const components = {
  Button: {
    defaultProps: {
      colorScheme: 'brand',
    },
    variants: {
      solid: {
        borderRadius: 'lg',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        boxShadow: 'md',
      },
    },
  },
}

export const theme = extendTheme({
  config,
  colors,
  components,
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
})
```

### 2. 国际化配置

```typescript
// src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: 'zh', // 默认中文
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

```json
// src/i18n/locales/zh.json
{
  "swap": {
    "title": "交换",
    "from": "从",
    "to": "到",
    "slippage": "滑点容忍度",
    "priceImpact": "价格影响",
    "minimumReceived": "最小接收",
    "submit": "交换"
  },
  "liquidity": {
    "title": "流动性",
    "add": "添加流动性",
    "remove": "移除流动性"
  }
}
```

### 3. Zustand Store示例

```typescript
// src/stores/appStore.ts
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // 设置
  slippageTolerance: number
  deadline: number
  expertMode: boolean

  // 主题
  colorMode: 'light' | 'dark'

  // 语言
  language: 'zh' | 'en'

  // Actions
  setSlippageTolerance: (value: number) => void
  setDeadline: (value: number) => void
  setExpertMode: (value: boolean) => void
  setColorMode: (mode: 'light' | 'dark') => void
  setLanguage: (lang: 'zh' | 'en') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      slippageTolerance: 0.5,
      deadline: 20,
      expertMode: false,
      colorMode: 'light',
      language: 'zh',

      setSlippageTolerance: (value) => set({ slippageTolerance: value }),
      setDeadline: (value) => set({ deadline: value }),
      setExpertMode: (value) => set({ expertMode: value }),
      setColorMode: (mode) => set({ colorMode: mode }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'app-storage',
    }
  )
)
```

### 4. 图表组件示例

```typescript
// src/components/charts/TVLChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useChartData } from '@/hooks/useChart'

export function TVLChart({ poolAddress }: { poolAddress: Address }) {
  const { data, isLoading } = useChartData(poolAddress, 'tvl', '7d')

  if (isLoading) return <Spinner />

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="tvl"
          stroke="#2e7fd7"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### 5. 价格Oracle示例

```typescript
// src/utils/priceOracle.ts
import { Address } from 'viem'

class PriceOracle {
  private cache = new Map<Address, { price: bigint; timestamp: number }>()
  private readonly CACHE_TTL = 30000 // 30秒

  async getPrice(token: Address): Promise<bigint> {
    // 检查缓存
    const cached = this.cache.get(token)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price
    }

    // 查询价格
    try {
      // 尝试Chainlink
      const price = await this.fetchChainlinkPrice(token)
      this.cache.set(token, { price, timestamp: Date.now() })
      return price
    } catch {
      // 回退到TWAP
      const price = await this.fetchTWAPPrice(token)
      this.cache.set(token, { price, timestamp: Date.now() })
      return price
    }
  }

  private async fetchChainlinkPrice(token: Address): Promise<bigint> {
    // 实现Chainlink价格查询
  }

  private async fetchTWAPPrice(token: Address): Promise<bigint> {
    // 实现TWAP价格查询
  }
}

export const priceOracle = new PriceOracle()
```

---

## ⚠️ 注意事项

### 1. 并行开发协调
- 定期代码同步（每天至少一次）
- 使用feature分支避免冲突
- 关键组件优先开发

### 2. 性能考虑
- Chakra UI虽然强大，但要注意bundle大小
- 按需导入组件
- 使用代码分割
- 图表数据做好缓存

### 3. 兼容性
- 测试主流钱包（MetaMask、WalletConnect）
- 测试主流浏览器
- 移动端重点测试

### 4. 价格数据（⚠️ 最高优先级）

**阶段1（Day 1-6）：UI开发**
- ✅ 可以使用模拟价格数据用于UI布局
- ✅ 仅用于视觉效果展示
- ✅ 必须在代码中明确标记为"MOCK DATA FOR UI ONLY"

**阶段2（Day 7起）：功能集成**
- 🚫 **严禁使用任何模拟数据**
- ✅ **必须100%连接真实价格接口**
- ✅ 必须准备好真实的Chainlink Price Feed地址
- ✅ 必须准备好真实的TWAP配置
- ✅ 必须有完整的错误处理和回退方案
- ✅ 价格更新频率要合理（建议30秒）
- ✅ 必须验证价格数据的准确性

**验证清单：**
- [ ] 所有价格查询都连接到真实合约
- [ ] 没有硬编码的价格值
- [ ] 没有随机生成的价格
- [ ] 错误处理完善
- [ ] 价格数据通过测试验证

---

## 📊 进度追踪

创建一个进度表格，每天更新：

| 日期 | 阶段 | 任务 | 状态 | 备注 |
|------|------|------|------|------|
| Day 1 | 基础设施 | 依赖安装 | ⏳ |  |
| Day 1 | 基础设施 | Chakra配置 | ⏳ |  |
| Day 2 | 基础设施 | 国际化配置 | ⏳ |  |
| Day 2 | 基础设施 | 状态管理 | ⏳ |  |
| ... | ... | ... | ... | ... |

---

**准备好开始了吗？** 🚀

我建议立即开始：
1. 创建新分支
2. 安装所有依赖
3. 配置Chakra UI
4. 配置国际化

告诉我，我们现在就开始吗？
