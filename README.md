# ve(3,3) DEX - 去中心化交易所

基于 Solidly 的 ve(3,3) 机制实现的完整 DEX 项目，结合了 Curve 的 ve tokenomics 和 Olympus DAO 的 (3,3) 博弈论设计。

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/solidity-0.8.20-green.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue.svg)](https://www.typescriptlang.org/)

[快速开始](#-快速开始) • [功能特性](#-核心特性) • [部署指南](DEPLOYMENT.md) • [开发文档](DEVELOPMENT.md)

</div>

---

## 📖 项目概述

这是一个完整的去中心化交易所(DEX)实现，采用创新的 ve(3,3) 治理机制：

- **ve (Vote Escrow)**: 来自 Curve，通过锁仓获得投票权
- **(3,3) 博弈**: 来自 Olympus DAO，激励长期持有
- **双曲线 AMM**: 支持波动性资产和稳定币两种交易曲线

---

## ✨ 核心特性

### 🔄 交易功能
- ✅ **双曲线 AMM**: 波动性资产 (xy≥k) 和稳定币 (x³y+y³x≥k) 两种曲线
- ✅ **Token 交换**: 完整的 Swap 功能，支持实时价格查询
- ✅ **流动性管理**: 添加/移除流动性，获得 LP Token
- ✅ **多跳路由**: 智能路由寻找最优交易路径
- ✅ **滑点保护**: 可配置的滑点容忍度

### 🗳️ 治理机制
- ✅ **ve-NFT 系统**: 锁仓获得 NFT 形式的投票权
- ✅ **投票决策**: 决定每周激励分配给哪些流动性池
- ✅ **手续费分红**: 投票者获得对应池的交易手续费
- ✅ **贿赂系统**: 项目方可贿赂投票者以吸引流动性
- ✅ **反稀释机制**: 锁仓者获得代币增发补偿

### 🎨 前端界面 (完成度: 90%)
- ✅ **Web3 集成**: Web3Modal + wagmi v2 钱包连接
- ✅ **Dashboard**: 资产概览、快速操作入口
- ✅ **Swap 交易**: 实时价格查询、滑点保护、完整授权流程
- ✅ **流动性管理**: 添加/移除流动性、LP Token 管理、池信息查询
- ✅ **ve-NFT 锁仓**: 创建锁仓、投票权重预览、NFT 列表管理
- ✅ **响应式设计**: 支持桌面和移动端，自适应布局
- ✅ **现代化 UI**: 深色主题，紫色渐变，流畅动画
- ✅ **20+ 组件**: 8个通用UI组件 + 12个业务组件
- ✅ **13+ Hooks**: 完整的Web3交互Hook封装
- ⏳ **Vote 模块**: 投票界面(占位符，待实现)
- ⏳ **Rewards 模块**: 奖励领取界面(占位符，待实现)

---

## 🚀 快速开始

### 方式一：使用已部署的合约 (推荐)

我们已经在 BSC Testnet 部署了完整的合约！

**1. 启动前端应用**

```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev
```

访问: http://localhost:3001/

**2. 连接钱包**

- 安装 MetaMask
- 添加 BSC Testnet 网络
- 从[水龙头](https://testnet.bnbchain.org/faucet-smart)获取测试 BNB
- 开始交易！

**📚 详细步骤**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)

---

### 方式二：从头部署

**1. 安装依赖**

```bash
npm install
cd frontend && npm install && cd ..
```

**2. 配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env
cp frontend/.env.example frontend/.env

# 编辑 .env 文件，填入你的配置
```

**3. 编译合约**

```bash
npm run compile
```

**4. 部署到 BSC Testnet**

```bash
npm run deploy:bsc
```

**5. 启动前端**

```bash
npm run frontend:dev
```

**📚 详细教程**: 查看 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📦 已部署的合约

### BSC Testnet

| 合约 | 地址 | 说明 |
|------|------|------|
| SOLID Token | `0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231` | 治理代币 |
| Factory | `0x739d450F9780e7f6c33263a51Bd53B83F18CfD53` | 交易对工厂 |
| Router | `0xaf796B4Df784cc7B40F1e999B668779143B63f52` | 路由合约 |
| WBNB | `0xF8ef391F45ce84b25Dc0194bDD97daD5E04cd3bC` | 包装 BNB |
| VotingEscrow | `0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6` | ve-NFT 投票托管 |
| Voter | `0x28EE028C9D26c59f2C7E9CBE16B89366933d0792` | 投票管理 |
| Minter | `0x41E31C21151F7e8E509754a197463a8E234E136E` | 代币铸造 |

**网络信息:**
- Chain ID: 97
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
- 浏览器: https://testnet.bscscan.com/

---

## 🏗️ 项目结构

```
ve33-dex/
├── contracts/              # 智能合约
│   ├── core/              # 核心 AMM 层
│   │   ├── Token.sol      # 治理代币
│   │   ├── Pair.sol       # AMM 交易对
│   │   ├── Factory.sol    # 交易对工厂
│   │   └── Router.sol     # 路由合约
│   ├── governance/        # 治理层
│   │   ├── VotingEscrow.sol  # ve-NFT 投票托管
│   │   ├── Voter.sol         # 投票管理
│   │   ├── Minter.sol        # 代币铸造
│   │   ├── Gauge.sol         # 流动性激励
│   │   └── Bribe.sol         # 投票贿赂
│   ├── interfaces/        # 合约接口
│   └── libraries/         # 工具库
│
├── frontend/              # 前端应用 (~4750行代码)
│   └── src/
│       ├── components/    # React 组件 (20+组件)
│       │   ├── common/    # 通用UI组件 (Button, Card, Input, Modal, etc.)
│       │   ├── Layout/    # 布局组件 (Header, MobileNav)
│       │   ├── Dashboard/ # 仪表盘
│       │   ├── Swap/      # Swap交易
│       │   ├── Liquidity/ # 流动性管理
│       │   └── Lock/      # ve-NFT锁仓
│       ├── hooks/         # 自定义 Hooks (13+个)
│       ├── abis/          # 合约 ABI (9个)
│       ├── types/         # TypeScript 类型
│       ├── utils/         # 工具函数 (format, calculations)
│       ├── constants/     # 常量配置 (theme, tokens)
│       └── config/        # 配置文件 (web3)
│
├── scripts/               # 部署脚本
├── test/                  # 测试文件
├── DEPLOYMENT.md          # 📘 部署指南
├── DEVELOPMENT.md         # 📙 开发文档
└── README.md             # 📗 项目概述
```

---

## 🛠️ 技术栈

### 智能合约
- **Solidity** ^0.8.20 - 智能合约语言
- **Hardhat** - 开发框架
- **OpenZeppelin** - 安全的合约库
- **TypeScript** - 类型安全的脚本

### 前端应用
- **React 18.3.1** - UI 框架
- **TypeScript 5.9.3** - 类型安全
- **Vite 7.1.7** - 快速构建工具
- **wagmi 2.18.1** - Web3 React Hooks
- **viem 2.38.2** - 以太坊交互库
- **Web3Modal 5.1.11** - 钱包连接
- **@tanstack/react-query 5.90.3** - 状态管理
- **无外部UI库** - 完全自定义组件系统

---

## 📊 ve(3,3) 工作机制

### 1️⃣ 锁仓获得投票权

用户锁定 SOLID 代币，获得 ve-NFT：
- 锁定时间: 1 周 - 4 年
- 锁定越久，投票权重越大
- NFT 形式，可转移和交易

### 2️⃣ 投票决定激励分配

ve-NFT 持有者每周投票：
- 投票给不同的流动性池
- 决定每周激励的分配比例
- 获得投票池的手续费收益

### 3️⃣ 反稀释机制

锁仓者获得增发补偿：
- 锁仓者：获得 0-100% 的代币增发
- 未锁仓者：承受稀释
- 类似 OlympusDAO 的 (3,3) 博弈

### 4️⃣ 贿赂和手续费

投票者的收益来源：
- **交易手续费**: 投票池的 0.3% 手续费
- **贿赂奖励**: 项目方存入的贿赂代币
- **激励排放**: 每周的代币增发

---

## 📚 文档导航

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 完整的部署教程
  - 环境准备与配置
  - 部署步骤详解
  - 已部署合约地址
  - 故障排除指南

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - 开发与测试文档
  - 项目架构详解
  - 智能合约开发
  - 前端开发指南
  - 测试流程与清单

---

## 🎯 开发原则

本项目严格遵循软件工程最佳实践：

- **KISS** (Keep It Simple): 使用成熟的 Solidly 架构
- **DRY** (Don't Repeat Yourself): 复用 OpenZeppelin 和已验证的代码
- **SOLID**: 模块化设计，清晰的职责划分
- **YAGNI** (You Aren't Gonna Need It): 先实现核心功能

---

## 🔒 安全性

### 已实施
- ✅ 使用 OpenZeppelin 经过审计的合约库
- ✅ ReentrancyGuard 防止重入攻击
- ✅ SafeERC20 安全的代币转账
- ✅ 滑点保护和截止时间检查

### 计划中
- ⏳ 100% 单元测试覆盖
- ⏳ 专业安全审计
- ⏳ Bug 赏金计划

**⚠️ 警告**: 本项目仍在开发中，合约未经完整审计，请勿在生产环境使用真实资金。

---

## 🗺️ 路线图

- [x] 项目初始化和配置
- [x] 核心 AMM 合约实现
- [x] ve(3,3) 治理合约实现
- [x] BSC Testnet 部署
- [x] 前端基础架构 (设计系统、组件库、布局)
- [x] Dashboard 仪表盘
- [x] Swap 交易功能
- [x] 流动性管理界面 (添加/移除/查看)
- [x] ve-NFT 锁仓界面 (创建/管理)
- [ ] Vote 投票界面
- [ ] Rewards 奖励界面
- [ ] 完整的测试覆盖
- [ ] 安全审计
- [ ] 主网部署

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

```bash
# 1. Fork 项目
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'feat: add amazing feature'

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

**详细指南**: 查看 [DEVELOPMENT.md](DEVELOPMENT.md)

---

## 📖 参考资料

- [Solidly 源码](https://github.com/velodrome-finance/solidly)
- [ve(3,3) 白皮书](https://andrecronje.medium.com/ve-3-3-44466eaa088b)
- [Curve ve Tokenomics](https://curve.fi/vecrv)
- [Uniswap V2 文档](https://docs.uniswap.org/contracts/v2/overview)

---

## 📄 许可证

[MIT License](LICENSE)

---

## 📞 联系方式

- GitHub Issues: [提交问题](https://github.com/your-repo/issues)
- 文档: [DEPLOYMENT.md](DEPLOYMENT.md) | [DEVELOPMENT.md](DEVELOPMENT.md)

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给个 Star！🌟**

Made with ❤️ by ve(3,3) DEX Team

</div>
