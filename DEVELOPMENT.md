# 🛠️ ve(3,3) DEX 开发指南

完整的开发、测试和贡献指南，涵盖智能合约和前端开发。

---

## 📊 项目进度

### ✅ 已完成 (90%)

#### 智能合约层 (100%)
- ✅ **核心 AMM 合约** (Token, Pair, Factory, Router)
- ✅ **ve(3,3) 治理合约** (VotingEscrow, Voter, Minter, Gauge, Bribe)
- ✅ **接口和工具库** (IPair, IFactory, Math)
- ✅ **部署脚本和配置**
- ✅ **BSC Testnet 部署**

#### 前端应用 (90%)
- ✅ **基础架构** (React 18.3.1 + TypeScript 5.9.3 + Vite 7.1.7)
- ✅ **Web3 集成** (wagmi 2.18.1 + viem 2.38.2 + Web3Modal 5.1.11)
- ✅ **设计系统** (主题配置、颜色系统、间距系统、响应式断点)
- ✅ **通用 UI 组件** (8个: Button, Card, Input, Modal, Tabs, Table, Badge, Loading, Toast)
- ✅ **布局组件** (Header, MobileNav, MainLayout + useResponsive Hook)
- ✅ **Dashboard 仪表盘** (资产统计、快速操作、机制说明)
- ✅ **Swap 交易模块** (完整的授权+交换流程、实时价格查询、滑点设置)
- ✅ **流动性管理模块** (添加/移除流动性、LP Token 管理、持仓列表)
- ✅ **ve-NFT 锁仓模块** (创建锁仓、投票权重计算、NFT 列表管理)
- ✅ **自定义 Hooks** (13+个: useLiquidity, useVeNFT, useVote, useRewards等)
- ✅ **工具函数** (格式化、计算投票权重、锁仓时间等)
- ✅ **合约 ABI** (9个治理合约ABI已提取)
- ✅ **响应式设计** (桌面端和移动端完美适配)

### 🔧 待完成 (10%)

- [ ] **Vote 投票模块** (当前为占位符)
- [ ] **Rewards 奖励模块** (当前为占位符)
- [ ] 完整的单元测试覆盖
- [ ] 集成测试
- [ ] 安全审计

---

## 🏗️ 项目架构

### 智能合约层次

```
Core Layer (核心层)
├── Token.sol          - 治理代币 (ERC20 + Minter 控制)
├── Pair.sol           - AMM 交易对 (双曲线 AMM)
├── Factory.sol        - 交易对工厂 (无许可创建)
└── Router.sol         - 路由合约 (安全交互接口)

Governance Layer (治理层)
├── VotingEscrow.sol   - ve-NFT 投票托管 (470+ 行)
├── Voter.sol          - 投票管理 (300+ 行)
├── Minter.sol         - 代币铸造 (100+ 行)
├── Gauge.sol          - 流动性激励 (250+ 行)
└── Bribe.sol          - 投票贿赂 (280+ 行)

Support Layer (支持层)
├── interfaces/        - 合约接口定义
└── libraries/         - 工具库 (Math)
```

### 前端架构 (~4750行代码)

```
frontend/src/
├── components/            # React 组件 (20+个)
│   ├── common/           # 通用 UI 组件 (8个)
│   │   ├── Button.tsx    # 按钮组件（3种大小、3种样式）
│   │   ├── Card.tsx      # 卡片容器
│   │   ├── Input.tsx     # 输入框（支持左右元素）
│   │   ├── Modal.tsx     # 弹窗组件
│   │   ├── Tabs.tsx      # 选项卡组件
│   │   ├── Table.tsx     # 表格组件
│   │   ├── Badge.tsx     # 标签组件
│   │   ├── Loading.tsx   # 加载动画
│   │   └── Toast.tsx     # 消息提示系统 + useToast Hook
│   │
│   ├── Layout/           # 布局组件 (3个)
│   │   ├── MainLayout.tsx    # 主布局容器
│   │   ├── Header.tsx        # 顶部导航栏（桌面端）
│   │   └── MobileNav.tsx     # 底部导航栏（移动端）
│   │
│   ├── Dashboard/        # 仪表盘模块 (1个)
│   │   └── Dashboard.tsx     # 主仪表盘（资产统计、快速操作）
│   │
│   ├── Swap/             # Swap 模块 (2个)
│   │   ├── TokenInput.tsx    # Token 输入组件
│   │   └── SwapCard.tsx      # Swap 主界面
│   │
│   ├── Liquidity/        # 流动性模块 (4个)
│   │   ├── AddLiquidity.tsx      # 添加流动性
│   │   ├── RemoveLiquidity.tsx   # 移除流动性
│   │   ├── MyLiquidity.tsx       # 我的流动性
│   │   └── index.tsx             # 模块入口
│   │
│   └── Lock/             # 锁仓模块 (2个)
│       ├── CreateLock.tsx    # 创建 ve-NFT 锁仓
│       ├── MyVeNFTs.tsx      # 我的 ve-NFT 列表
│       └── index.tsx         # 模块入口
│
├── hooks/                # 自定义 Hooks (13+个)
│   ├── useTokenBalance.ts    # Token 余额查询
│   ├── useTokenApprove.ts    # Token 授权操作
│   ├── useSwap.ts            # Swap 操作和价格查询
│   ├── useLiquidity.ts       # 流动性操作（添加/移除）
│   ├── usePoolInfo.ts        # 池信息查询
│   ├── usePairAddress.ts     # 流动性池地址查询
│   ├── useVeNFT.ts           # ve-NFT 操作（创建/增加/延长/提取/合并/分割）
│   ├── useUserVeNFTs.ts      # 用户 ve-NFT 列表查询
│   ├── useVeNFTDetail.ts     # ve-NFT 详情查询
│   ├── useIsVoted.ts         # 投票状态检查
│   ├── useVote.ts            # 投票操作
│   ├── useRewards.ts         # 奖励领取（Gauge/Bribe/批量）
│   └── useResponsive.ts      # 响应式设备检测
│
├── abis/                 # 合约 ABI (9个)
│   ├── Router.json       # Router 合约 ABI
│   ├── Pair.json         # Pair 合约 ABI
│   ├── Token.json        # ERC20 合约 ABI
│   ├── Factory.json      # Factory 合约 ABI
│   ├── VotingEscrow.json # VotingEscrow 合约 ABI (1092行)
│   ├── Voter.json        # Voter 合约 ABI (590行)
│   ├── Minter.json       # Minter 合约 ABI (244行)
│   ├── Gauge.json        # Gauge 合约 ABI (551行)
│   └── Bribe.json        # Bribe 合约 ABI (538行)
│
├── types/                # TypeScript 类型
│   └── index.ts          # 类型定义（Token, VeNFT等）
│
├── utils/                # 工具函数 (2个)
│   ├── format.ts         # 格式化工具（parseTokenAmount, formatTokenAmount等）
│   └── calculations.ts   # 计算工具（投票权重、锁仓时间、流动性等）
│
├── constants/            # 常量配置 (2个)
│   ├── theme.ts          # 主题配置（颜色、间距、圆角、断点）
│   └── tokens.ts         # Token 列表配置
│
├── config/               # 配置文件 (1个)
│   └── web3.ts           # Web3 配置（网络、合约地址）
│
├── NewApp.tsx           # 主应用（集成所有模块）
├── App.tsx              # 原 Swap 应用（保留）
└── main.tsx             # 入口文件（使用 NewApp）
```

---

## 🔧 开发环境设置

### 1. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd ve33-dex

# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 2. 环境变量配置

**后端 `.env`:**
```env
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
PRIVATE_KEY=your_private_key
BSCSCAN_API_KEY=your_api_key
```

**前端 `frontend/.env`:**
```env
VITE_CHAIN_ID=97
VITE_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_CONTRACT_TOKEN=0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231
VITE_CONTRACT_ROUTER=0xaf796B4Df784cc7B40F1e999B668779143B63f52
# ... 其他合约地址
```

---

## 💻 智能合约开发

### 开发命令

```bash
# 编译合约
npm run compile

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 启动本地节点
npm run node

# 部署到本地网络
npm run deploy:local

# 部署到 BSC Testnet
npm run deploy:bsc
```

### AMM 实现原理

#### 1. 波动性资产曲线 (xy≥k)

标准的恒定乘积做市商模型，适用于价格波动较大的代币对。

**公式**: `x * y = k`

**特点**:
- 价格随供需关系自动调整
- 适合 ETH/ERC20 等波动性代币
- 深度流动性

**代码实现** (Pair.sol:250):
```solidity
function _k(uint x, uint y) internal view returns (uint) {
    if (stable) {
        uint _x = x * 1e18 / decimals0;
        uint _y = y * 1e18 / decimals1;
        uint _a = (_x * _y) / 1e18;
        uint _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
        return _a * _b / 1e18;
    } else {
        return x * y;
    }
}
```

#### 2. 稳定币曲线 (x³y+y³x≥k)

优化的稳定币交换曲线，在锚定价格附近提供更低的滑点。

**公式**: `x³y + y³x ≥ k`

**特点**:
- 在 1:1 价格附近提供更好的流动性
- 适合 USDC/USDT 等稳定币对
- 低滑点交易

#### 3. 手续费机制

- **交易手续费**: 0.3%
- **费用分配**: 归投票给该池的 ve-NFT 持有者
- **费用累计**: 在交易时累计，可随时领取

---

## 🎨 前端开发

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.9.3 | 类型安全 |
| Vite | 7.1.7 | 构建工具 |
| wagmi | 2.18.1 | Web3 React Hooks |
| viem | 2.38.2 | 以太坊交互库 |
| Web3Modal | 5.1.11 | 钱包连接 |
| @tanstack/react-query | 5.90.3 | 状态管理 |

### 启动开发服务器

```bash
cd frontend
npm run dev
```

访问: http://localhost:3001/

### 核心 Hook 使用

#### 1. 余额查询 (useTokenBalance)

```typescript
import { useBalance } from 'wagmi'

const { data: balance } = useBalance({
  address: userAddress,
  token: tokenAddress,
  watch: true, // 实时更新
})
```

#### 2. Token 授权 (useTokenApprove)

```typescript
import { useWriteContract } from 'wagmi'

const { writeContract } = useWriteContract()

// 授权 Token
await writeContract({
  address: tokenAddress,
  abi: TokenABI,
  functionName: 'approve',
  args: [spender, amount],
})
```

#### 3. Swap 操作 (useSwap)

```typescript
// 查询价格
const { data: amountOut } = useReadContract({
  address: routerAddress,
  abi: RouterABI,
  functionName: 'getAmountsOut',
  args: [amountIn, routes],
})

// 执行交换
await writeContract({
  address: routerAddress,
  abi: RouterABI,
  functionName: 'swapExactTokensForTokens',
  args: [amountIn, amountOutMin, routes, to, deadline],
})
```

### Swap 功能实现

#### 交易流程

```
用户输入金额
    ↓
实时查询输出金额 (getAmountsOut)
    ↓
检查授权额度 (allowance)
    ↓
[如需要] 授权 Token (approve)
    ↓
等待授权确认
    ↓
执行交换 (swapExactTokensForTokens)
    ↓
等待交易确认
    ↓
刷新余额 + 显示成功提示
```

#### 智能按钮状态

```typescript
const getButtonState = () => {
  if (!isConnected) return { text: '连接钱包', disabled: true }
  if (!tokenIn || !tokenOut) return { text: '选择代币', disabled: true }
  if (!amountIn) return { text: '输入金额', disabled: true }
  if (balanceIn < amountInBigInt) return { text: '余额不足', disabled: true }
  if (needsApproval) return { text: `授权 ${tokenIn.symbol}`, disabled: false }
  return { text: '交换', disabled: false }
}
```

### 构建生产版本

```bash
cd frontend
npm run build
npm run preview
```

---

## 🧪 测试指南

### 测试准备

#### 1. 配置 MetaMask

**添加 BSC Testnet:**
```
网络名称: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: tBNB
Block Explorer: https://testnet.bscscan.com/
```

#### 2. 获取测试代币

**tBNB:**
- 访问: https://testnet.bnbchain.org/faucet-smart
- 领取约 0.5 tBNB

**SOLID Token:**
- 使用部署者账户转账
- 或通过 Router 交换获得

### 测试清单

#### 界面测试
- [ ] 页面加载正常
- [ ] 钱包连接按钮显示
- [ ] 导航切换功能正常
- [ ] 响应式布局正确

#### 钱包连接测试
- [ ] Web3Modal 正常弹出
- [ ] MetaMask 连接成功
- [ ] 地址显示正确
- [ ] 网络切换提示正常

#### Dashboard 测试
- [ ] 资产统计卡片显示正确
- [ ] SOLID 余额显示
- [ ] WBNB 余额显示
- [ ] ve-NFT 数量显示
- [ ] 快速操作按钮可点击
- [ ] 导航到各个模块正常

#### Swap 功能测试
- [ ] Token 选择器正常工作
- [ ] 余额显示正确
- [ ] 输入验证正确
- [ ] MAX 按钮功能正常
- [ ] 价格实时查询
- [ ] 授权流程完整
- [ ] 交换执行成功
- [ ] 余额更新正确
- [ ] 成功提示显示

#### 流动性管理测试
- [ ] 添加流动性 Token 输入正常
- [ ] 池类型选择（波动性/稳定币）
- [ ] 比例自动计算
- [ ] 双Token授权流程
- [ ] 添加流动性成功
- [ ] 移除流动性比例选择
- [ ] 自定义数量输入
- [ ] 预计获得Token显示
- [ ] LP Token授权
- [ ] 移除流动性成功
- [ ] 我的流动性列表显示
- [ ] 流动性统计卡片正确

#### ve-NFT 锁仓测试
- [ ] 锁仓数量输入正常
- [ ] 锁仓时长选择（预设+滑块）
- [ ] 投票权重实时计算
- [ ] 解锁时间显示正确
- [ ] SOLID授权流程
- [ ] 创建ve-NFT成功
- [ ] ve-NFT列表显示
- [ ] NFT详情显示（数量、权重、剩余时间）
- [ ] 到期状态标识
- [ ] 操作按钮可用

#### 边界情况测试
- [ ] 余额不足提示
- [ ] 输入格式验证
- [ ] 用户拒绝交易处理
- [ ] 网络切换处理
- [ ] 错误提示清晰

### 详细测试步骤

#### Test 1: Swap 完整流程

1. **连接钱包**
   - 点击 "Connect Wallet"
   - 选择 MetaMask
   - 确认连接

2. **选择 Token**
   - 卖出: SOLID
   - 买入: WBNB

3. **输入金额**
   - 输入 `1` SOLID
   - 查看预估输出

4. **授权 Token**（首次）
   - 点击 "授权 SOLID"
   - 在 MetaMask 确认
   - 等待确认

5. **执行交换**
   - 点击 "交换"
   - 在 MetaMask 确认
   - 等待交易确认

6. **验证结果**
   - SOLID 余额减少
   - WBNB 余额增加
   - 成功提示显示

#### Test 2: 错误处理

**余额不足:**
- 输入超过余额的金额
- 确认按钮显示 "余额不足" 且禁用

**用户拒绝:**
- 点击授权或交换
- 在 MetaMask 点击 "拒绝"
- 确认按钮恢复正常

**网络切换:**
- 在 MetaMask 切换到其他网络
- 确认前端检测到并提示

---

## 🔐 ve(3,3) 机制详解

### 1. 投票托管 (Vote Escrow)

用户锁定治理代币获得 ve-NFT:
- **锁定时间**: 1 周 - 4 年
- **投票权重**: 锁定时间越长，权重越大
- **NFT 形式**: 可转移、交易、合并、分割

### 2. 投票系统

ve-NFT 持有者每周投票:
- **投票目标**: 流动性池
- **权重分配**: 决定激励分配比例
- **奖励获得**:
  - 投票池的交易手续费
  - 项目方的贿赂奖励

### 3. 反稀释机制

类似 OlympusDAO 的 (3,3) 博弈:
- **锁仓者**: 获得 0-100% 的代币增发补偿
- **未锁仓者**: 承受稀释
- **激励**: 鼓励长期锁仓

### 4. 贿赂系统

项目方可以"贿赂"投票者:
- **目的**: 吸引投票，获得激励
- **方式**: 向 Bribe 合约存入代币
- **分配**: 按投票权重分配给投票者

---

## 🛡️ 安全考虑

### 已实施的安全措施

1. ✅ **重入保护**: 使用 ReentrancyGuard
2. ✅ **安全转账**: 使用 SafeERC20
3. ✅ **权限控制**: Ownable 和自定义权限
4. ✅ **输入验证**: 严格的参数检查
5. ✅ **时间锁**: 截止时间机制防止前置交易
6. ✅ **滑点保护**: 最小输出金额检查

### 待完善的安全措施

1. ⏳ **完整测试**: 100% 测试覆盖率
2. ⏳ **形式化验证**: 关键逻辑的数学证明
3. ⏳ **专业审计**: 第三方安全审计
4. ⏳ **Bug 赏金**: 漏洞赏金计划
5. ⏳ **时间锁合约**: 关键操作的时间延迟

---

## 🎓 开发原则

本项目严格遵循软件工程最佳实践:

### SOLID 原则

- **S (单一职责)**: 每个合约和组件只负责一件事
- **O (开闭原则)**: 易于扩展，无需修改现有代码
- **L (里氏替换)**: 子类型可替换父类型
- **I (接口隔离)**: 专一的接口定义
- **D (依赖倒置)**: 依赖抽象而非具体实现

### 其他原则

- **KISS**: 保持简单，使用成熟的架构
- **DRY**: 复用代码和组件，避免重复
- **YAGNI**: 先实现核心功能，避免过度设计

---

## 🤝 贡献指南

### Git 工作流程

```bash
# 1. Fork 项目并克隆
git clone <your-fork-url>
cd ve33-dex

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 进行开发...

# 4. 提交更改
git add .
git commit -m "feat: add new feature"

# 5. 推送到你的 fork
git push origin feature/your-feature-name

# 6. 创建 Pull Request
```

### 提交信息规范

使用 Conventional Commits 格式:

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响功能）
- `refactor:` - 代码重构
- `test:` - 添加测试
- `chore:` - 构建过程或辅助工具变动

**示例:**
```bash
git commit -m "feat: 添加流动性管理功能"
git commit -m "fix: 修复价格计算精度问题"
git commit -m "docs: 更新开发文档"
```

---

## 📚 参考资料

- [Solidly 源码](https://github.com/velodrome-finance/solidly)
- [ve(3,3) 白皮书](https://andrecronje.medium.com/ve-3-3-44466eaa088b)
- [Curve Finance 文档](https://curve.readthedocs.io/)
- [Uniswap V2 文档](https://docs.uniswap.org/contracts/v2/overview)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts/)
- [wagmi 文档](https://wagmi.sh/)
- [viem 文档](https://viem.sh/)

---

## 📞 获取帮助

**遇到问题？**

1. 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解部署细节
2. 查看 [README.md](README.md) 了解项目概述
3. 检查浏览器控制台错误
4. 在 BscScan 上查看交易详情
5. 提交 Issue 到 GitHub

---

<div align="center">

**🛠️ 祝开发顺利！🛠️**

Made with ❤️ by ve(3,3) DEX Team

</div>
