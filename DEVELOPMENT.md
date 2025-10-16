# 🛠️ ve(3,3) DEX 开发指南

完整的开发、测试和贡献指南，涵盖智能合约和前端开发。

---

## 📊 项目进度

### ✅ 已完成

#### 智能合约层
- ✅ **核心 AMM 合约** (Token, Pair, Factory, Router)
- ✅ **ve(3,3) 治理合约** (VotingEscrow, Voter, Minter)
- ✅ **接口和工具库** (IPair, IFactory, Math)
- ✅ **部署脚本和配置**
- ✅ **BSC Testnet 部署**

#### 前端应用
- ✅ **React + TypeScript + Vite 架构**
- ✅ **Web3Modal + wagmi 集成**
- ✅ **Swap 交易功能**（完整实现）
- ✅ **Token 授权流程**
- ✅ **实时价格查询**
- ✅ **余额显示和更新**
- ✅ **响应式 UI 设计**

### 🔧 待完成

- [ ] 流动性管理功能（添加/移除流动性）
- [ ] ve(3,3) 治理界面（锁仓、投票、奖励）
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

### 前端架构

```
frontend/src/
├── components/            # React 组件
│   ├── common/           # 通用组件
│   │   ├── Button.tsx    # 按钮组件（3 种样式）
│   │   └── Card.tsx      # 卡片容器
│   └── Swap/             # Swap 功能组件
│       ├── TokenInput.tsx    # Token 输入组件 (140 行)
│       └── SwapCard.tsx      # Swap 主界面 (220 行)
│
├── hooks/                # 自定义 Hooks
│   ├── useTokenBalance.ts    # Token 余额查询
│   ├── useTokenApprove.ts    # Token 授权操作
│   └── useSwap.ts            # Swap 操作和价格查询
│
├── abis/                 # 合约 ABI
│   ├── Router.json       # Router 合约 ABI
│   ├── Pair.json         # Pair 合约 ABI
│   ├── Token.json        # ERC20 合约 ABI
│   └── Factory.json      # Factory 合约 ABI
│
├── types/                # TypeScript 类型
│   └── index.ts          # 类型定义
│
├── utils/                # 工具函数
│   └── format.ts         # 格式化工具
│
├── constants/            # 常量配置
│   └── tokens.ts         # Token 列表配置
│
├── config/               # 配置文件
│   └── web3.ts           # Web3 配置
│
├── App.tsx              # 主应用 (255 行)
└── main.tsx             # 入口文件
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
| wagmi | 2.15.4 | Web3 React Hooks |
| viem | 2.22.7 | 以太坊交互库 |
| Web3Modal | 5.3.7 | 钱包连接 |
| @tanstack/react-query | 5.64.2 | 状态管理 |
| Vite | 7.1.10 | 构建工具 |

### 启动开发服务器

```bash
cd frontend
npm run dev
```

访问: http://localhost:3000/

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
