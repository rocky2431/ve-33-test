# ve(3,3) DEX - 去中心化交易所

基于 Solidly 的 ve(3,3) 机制实现的完整 DEX 交易所项目。

## 项目概述

这是一个完整的去中心化交易所(DEX)实现,采用 ve(3,3) 治理机制,结合了 Curve 的 ve tokenomics 和 Olympus DAO 的 (3,3) 博弈论设计。

### 核心特性

- ✅ **双曲线 AMM**: 支持波动性资产 (xy≥k) 和稳定币 (x³y+y³x≥k) 两种交易曲线
- ✅ **ve(3,3) 治理**: NFT 形式的投票托管系统
- 🔧 **流动性激励**: Gauge 和 Bribe 激励机制
- 🔧 **手续费分配**: 手续费归投票者所有
- 📊 **完整前端**: React + TypeScript 的现代化用户界面

## 项目结构

```
ve33-dex/
├── contracts/              # 智能合约
│   ├── core/              # 核心合约
│   │   ├── Token.sol     # 治理代币
│   │   ├── Pair.sol      # AMM 交易对
│   │   ├── Factory.sol   # 交易对工厂
│   │   └── Router.sol    # 路由合约
│   ├── governance/        # 治理合约
│   │   ├── VotingEscrow.sol  # ve-NFT 投票托管
│   │   ├── Voter.sol         # 投票管理
│   │   ├── Gauge.sol         # 流动性激励
│   │   ├── Bribe.sol         # 投票贿赂
│   │   └── Minter.sol        # 代币铸造
│   ├── interfaces/        # 合约接口
│   └── libraries/         # 工具库
├── frontend/              # 前端应用
│   └── src/
│       ├── components/    # React 组件
│       ├── pages/         # 页面
│       ├── hooks/         # 自定义 Hooks
│       └── utils/         # 工具函数
├── scripts/               # 部署脚本
├── test/                  # 测试文件
└── docs/                  # 文档

```

## 已完成功能

### ✅ 智能合约层

1. **核心 AMM 合约**
   - [Token.sol](contracts/core/Token.sol) - 治理代币,支持铸造权限控制
   - [Pair.sol](contracts/core/Pair.sol) - 交易对合约,实现双曲线 AMM
     - 波动性资产: `xy >= k`
     - 稳定币资产: `x³y + y³x >= k`
     - 0.3% 交易手续费
     - 手续费累计和领取机制
   - [Factory.sol](contracts/core/Factory.sol) - 无需许可创建交易对
   - [Router.sol](contracts/core/Router.sol) - 安全的用户交互接口
     - 添加/移除流动性
     - 代币交换
     - 多跳路由

2. **治理系统合约** (全部完成!)
   - [VotingEscrow.sol](contracts/governance/VotingEscrow.sol) - ve-NFT 投票托管系统 (470+ 行)
     - 锁仓获得 NFT 投票权
     - 支持合并和分割 NFT
     - 投票权重随时间衰减
   - [Voter.sol](contracts/governance/Voter.sol) - 投票管理中心 (300+ 行)
     - 创建和管理 Gauge
     - 处理投票逻辑
     - 分发激励
   - [Gauge.sol](contracts/governance/Gauge.sol) - 流动性激励分发 (250+ 行)
     - LP 质押和奖励
     - 多种奖励代币支持
   - [Bribe.sol](contracts/governance/Bribe.sol) - 投票贿赂系统 (280+ 行)
     - 项目方贿赂机制
     - 检查点记录
   - [Minter.sol](contracts/governance/Minter.sol) - 代币铸造分发 (100+ 行)
     - 每周自动增发
     - 衰减机制 (每周 -1%)

3. **接口和工具**
   - IPair, IFactory, IRouter, IVotingEscrow, IERC20
   - Math.sol - 数学运算库 (sqrt, cbrt, min, max)

4. **前端应用** (基础完成)
   - 完整的页面结构
   - 精美的 UI 设计
   - 响应式布局

### 🔧 待完成

- 完整的智能合约测试用例
- Web3 前端集成
- 测试网部署和验证

## 技术栈

### 智能合约
- **Solidity** ^0.8.20
- **Hardhat** - 开发框架
- **OpenZeppelin** - 安全的合约库
- **TypeScript** - 类型安全的脚本

### 前端 (计划)
- **React 18** + **TypeScript**
- **Vite** - 快速构建工具
- **ethers.js** / **wagmi** - Web3 集成
- **TailwindCSS** + **shadcn/ui** - UI 框架

## 🚀 快速开始

### 方式一: 5分钟快速部署 (推荐)

查看 **[快速启动指南](QUICK_START.md)** 快速部署到 BSC Testnet!

### 方式二: 完整部署流程

#### 1. 检查项目状态

```bash
npm run check
```

这会检查:

- ✅ 环境变量配置
- ✅ 网络连接和账户余额
- ✅ 合约编译状态
- ✅ 部署记录
- ✅ 前端配置

#### 2. 安装依赖

```bash
npm install
```

#### 3. 编译合约

```bash
npm run compile
```

#### 4. 部署到 BSC Testnet

```bash
npm run deploy:bsc
```

查看 **[部署检查清单](DEPLOYMENT_CHECKLIST.md)** 了解详细步骤。

#### 5. 启动前端

```bash
npm run frontend:dev
```

### 本地开发

```bash
# 启动本地节点
npm run node

# 部署合约到本地网络
npm run deploy:local
```

### 运行测试

```bash
npm run test
```

## 合约架构

### ve(3,3) 工作机制

1. **锁仓获得投票权**
   - 用户锁定治理代币获得 ve-NFT
   - 锁定时间越长,投票权重越大
   - NFT 形式,可转移和交易

2. **投票决定激励分配**
   - ve-NFT 持有者投票决定每周激励分配
   - 投票给不同的流动性池
   - 获得该池的手续费和贿赂奖励

3. **反稀释机制**
   - 锁仓者获得 0-100% 的代币增发补偿
   - 防止代币贬值(类似 OlympusDAO 的 (3,3))

4. **手续费和贿赂**
   - 交易手续费归投票给该池的 ve 持有者
   - 项目方可以"贿赂"投票者以吸引流动性

## 开发原则

本项目严格遵循软件工程最佳实践:

- **KISS (Keep It Simple)**: 使用成熟的 Solidly 架构,避免过度设计
- **DRY (Don't Repeat Yourself)**: 复用 OpenZeppelin 和已验证的代码
- **SOLID**: 模块化设计,清晰的职责划分
- **YAGNI (You Aren't Gonna Need It)**: 先实现核心功能,避免过早优化

## 安全考虑

- ✅ 使用 OpenZeppelin 经过审计的合约库
- ✅ ReentrancyGuard 防止重入攻击
- ✅ SafeERC20 安全的代币转账
- 🔧 即将进行全面的单元测试
- 🔧 计划进行专业安全审计

## 路线图

- [x] 项目初始化和配置
- [x] 核心 AMM 合约实现
- [x] 治理系统合约实现 (VotingEscrow, Voter, Gauge, Bribe, Minter)
- [x] 前端基础界面开发
- [ ] 完整的测试覆盖
- [ ] Web3 前端集成
- [ ] 测试网部署
- [ ] 安全审计
- [ ] 主网部署

## 参考资料

- [Solidly 源码](https://github.com/velodrome-finance/solidly)
- [ve(3,3) 白皮书](https://andrecronje.medium.com/ve-3-3-44466eaa088b)
- [Curve ve Tokenomics](https://curve.fi/vecrv)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!

---

**⚠️ 警告**: 本项目仍在开发中,请勿在生产环境使用。智能合约未经审计,可能存在安全风险。
