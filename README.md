# ve(3,3) DEX - 去中心化交易所

基于 Solidly 的 ve(3,3) 机制实现的完整 DEX 交易所项目。

## 项目概述

完整的去中心化交易所(DEX)实现，采用 ve(3,3) 治理机制，结合了 Curve 的 ve tokenomics 和 Olympus DAO 的 (3,3) 博弈论设计。

### 核心特性

- ✅ **双曲线 AMM**: 支持波动性资产 (xy≥k) 和稳定币 (x³y+y³x≥k)
- ✅ **ve(3,3) 治理**: NFT 形式的投票托管系统
- ✅ **流动性激励**: Gauge 和 Bribe 激励机制
- ✅ **手续费分配**: 手续费归投票者所有
- ✅ **P0 安全修复**: 10项关键安全修复，100%测试覆盖
- 🔧 **前端界面**: React + TypeScript 现代化界面（开发中）

## 项目结构

```
ve33-dex/
├── contracts/           # 智能合约
│   ├── core/           # 核心AMM合约 (Token, Pair, Factory, Router)
│   ├── governance/     # 治理合约 (VotingEscrow, Voter, Gauge, Bribe, Minter)
│   ├── interfaces/     # 合约接口
│   └── libraries/      # 工具库
├── frontend/           # 前端应用 (React + TypeScript)
├── scripts/            # 部署脚本
├── test/               # 测试文件 (114个测试用例, 100%通过)
└── docs/               # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn
- BSC Testnet BNB (用于部署)

### 安装和编译

```bash
# 安装依赖
npm install

# 编译合约
npm run compile
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npx hardhat test test/P0-VoterFlashLoan.test.ts
```

### 部署到BSC Testnet

```bash
# 配置环境变量 (.env)
PRIVATE_KEY=your_private_key
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545

# 部署合约
npm run deploy:bsc
```

### 启动前端（开发中）

```bash
cd frontend
npm install
npm run dev
```

## 技术架构

### ve(3,3) 工作机制

```
1. 锁仓 → ve-NFT
   用户锁定代币获得NFT投票权（锁定时间越长，权重越大）

2. 投票 → 激励分配
   ve-NFT持有者投票决定每周激励分配到哪些流动性池

3. 收益 → 手续费 + 贿赂
   获得投票池的交易手续费和项目方贿赂奖励

4. 反稀释 → rebase
   锁仓者获得代币增发补偿，防止稀释（(3,3) 机制）
```

### 核心合约

| 合约 | 功能 | 状态 |
|------|------|------|
| **Token.sol** | 治理代币，支持铸造权限控制 | ✅ 已完成 |
| **Pair.sol** | 双曲线AMM交易对 | ✅ 已完成 + P0修复 |
| **Factory.sol** | 交易对工厂 | ✅ 已完成 |
| **Router.sol** | 用户交互路由 | ✅ 已完成 |
| **VotingEscrow.sol** | ve-NFT投票托管 | ✅ 已完成 |
| **Voter.sol** | 投票管理 | ✅ 已完成 + P0修复 |
| **Gauge.sol** | 流动性激励 | ✅ 已完成 + P0修复 |
| **Bribe.sol** | 投票贿赂 | ✅ 已完成 + P0修复 |
| **Minter.sol** | 代币铸造分发 | ✅ 已完成 + P0修复 |

### P0 安全修复（已完成）

| 修复项 | 问题 | 解决方案 | 测试 |
|--------|------|----------|------|
| **Flash Loan防护** | 同区块创建+投票攻击 | 最小持有期（1天） | ✅ P0-024 |
| **Minter分配** | approve vs transfer | 改用transfer直接分配 | ✅ P0-016/017 |
| **Pair最小流动性** | OpenZeppelin兼容性 | mint到死亡地址 | ✅ P0-004 |
| **decimal缩放** | 稳定池溢出 | 使用10**decimals() | ✅ P0-004 |
| **skim/sync** | 缺失Uniswap V2函数 | 完整实现 | ✅ P0-004 |
| **Gauge精度** | 小额LP损失 | 1e18精度 | ✅ P0-032 |
| **Bribe粉尘防护** | 粉尘攻击 | 最小存款阈值 | ✅ P0-033 |

**测试覆盖率**: 114/114 测试通过 (100%)

## 技术栈

### 智能合约
- Solidity ^0.8.20
- Hardhat - 开发框架
- OpenZeppelin 5.x - 安全合约库
- ethers.js v6 - Web3交互

### 前端
- React 18 + TypeScript
- Vite - 构建工具
- TailwindCSS - UI框架

## 开发原则

- **KISS**: 简洁优先，避免过度设计
- **DRY**: 复用OpenZeppelin和成熟代码
- **SOLID**: 模块化设计，清晰职责
- **YAGNI**: 先实现核心，避免过早优化

## 安全措施

- ✅ OpenZeppelin经过审计的合约库
- ✅ ReentrancyGuard防重入攻击
- ✅ SafeERC20安全代币转账
- ✅ 100%测试覆盖率（114个测试用例）
- ✅ 10项P0关键安全修复
- 🔧 专业安全审计（计划中）

## 路线图

- [x] 项目初始化和配置
- [x] 核心AMM合约实现
- [x] 治理系统合约实现
- [x] P0安全修复（10项）
- [x] 完整测试覆盖（100%）
- [ ] BSC Testnet部署（准备中）
- [ ] Web3前端集成
- [ ] 主网部署前审计

## 参考资料

- [Solidly 源码](https://github.com/velodrome-finance/solidly)
- [ve(3,3) 白皮书](https://andrecronje.medium.com/ve-3-3-44466eaa088b)
- [Curve ve Tokenomics](https://curve.fi/vecrv)

## 许可证

MIT License

---

**⚠️ 免责声明**: 本项目仍在开发中，智能合约未经第三方审计，请勿在生产环境使用。
