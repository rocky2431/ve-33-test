# ve(3,3) DEX 开发文档

## 项目进度

### ✅ 已完成

#### 1. 项目初始化
- [x] 项目目录结构
- [x] Hardhat 配置
- [x] TypeScript 配置
- [x] 环境变量配置
- [x] Git 忽略配置

#### 2. 智能合约核心层
- [x] **Token.sol** - 治理代币合约
  - ERC20 标准实现
  - 铸造权限控制
  - 所有权管理

- [x] **Pair.sol** - AMM 交易对合约
  - 双曲线 AMM 实现 (xy≥k 和 x³y+y³x≥k)
  - 流动性管理 (mint/burn)
  - 代币交换 (swap)
  - 手续费累计机制
  - 价格计算函数

- [x] **Factory.sol** - 交易对工厂合约
  - 无需许可创建交易对
  - 交易对注册和查询
  - 管理功能 (暂停/恢复)

- [x] **Router.sol** - 路由合约
  - 安全的流动性操作
  - 多跳交换路由
  - 滑点保护
  - 截止时间检查

#### 3. 接口和库
- [x] IPair, IFactory, IRouter 接口
- [x] IVotingEscrow 接口定义
- [x] Math 数学工具库

#### 4. 部署和测试
- [x] 部署脚本 (deploy.ts)
- [x] Factory 单元测试

#### 5. 前端基础架构
- [x] React + TypeScript + Vite 配置
- [x] TailwindCSS 样式系统
- [x] 路由配置
- [x] 基础 Layout 组件
- [x] 首页 (Home)
- [x] 交易页面 (Swap)
- [x] 其他页面占位符

### 🔧 进行中

- [ ] 治理系统合约
  - [ ] VotingEscrow.sol (ve-NFT)
  - [ ] Voter.sol
  - [ ] Gauge.sol
  - [ ] Bribe.sol
  - [ ] Minter.sol

### 📋 待完成

#### 智能合约
- [ ] 完整的单元测试覆盖
- [ ] 集成测试
- [ ] Gas 优化
- [ ] 安全审计

#### 前端
- [ ] Web3 连接 (wagmi/RainbowKit)
- [ ] 合约交互逻辑
- [ ] 代币选择器
- [ ] 交易确认流程
- [ ] 流动性管理界面
- [ ] 投票界面
- [ ] 奖励领取界面
- [ ] 数据统计和图表

## 技术架构

### 智能合约层次

```
Core Layer (核心层)
├── Token.sol          - 治理代币
├── Pair.sol           - AMM 交易对
├── Factory.sol        - 交易对工厂
└── Router.sol         - 路由合约

Governance Layer (治理层)
├── VotingEscrow.sol   - ve-NFT 投票托管
├── Voter.sol          - 投票管理
├── Gauge.sol          - 流动性激励
├── Bribe.sol          - 投票贿赂
└── Minter.sol         - 代币铸造

Support Layer (支持层)
├── interfaces/        - 合约接口
└── libraries/         - 工具库
```

### 前端架构

```
Frontend
├── components/        - React 组件
│   └── Layout.tsx    - 页面布局
├── pages/            - 页面组件
│   ├── Home.tsx      - 首页
│   ├── Swap.tsx      - 交易
│   ├── Liquidity.tsx - 流动性
│   ├── Vote.tsx      - 投票
│   └── Rewards.tsx   - 奖励
├── hooks/            - 自定义 Hooks
├── utils/            - 工具函数
└── types/            - TypeScript 类型
```

## AMM 实现细节

### 波动性资产曲线 (xy≥k)

标准的恒定乘积做市商模型,适用于价格波动较大的代币对。

**公式**: `x * y = k`

**特点**:
- 价格随供需关系自动调整
- 适合 ETH/ERC20 等波动性代币
- 深度流动性

### 稳定币曲线 (x³y+y³x≥k)

优化的稳定币交换曲线,在锚定价格附近提供更低的滑点。

**公式**: `x³y + y³x ≥ k`

**特点**:
- 在 1:1 价格附近提供更好的流动性
- 适合 USDC/USDT 等稳定币对
- 低滑点交易

### 手续费机制

- **交易手续费**: 0.3%
- **费用分配**: 归投票给该池的 ve-NFT 持有者
- **费用累计**: 在交易时累计,可随时领取

## ve(3,3) 机制详解

### 1. 投票托管 (Vote Escrow)

用户锁定治理代币获得 ve-NFT:
- **锁定时间**: 1 周 - 4 年
- **投票权重**: 锁定时间越长,权重越大
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
- **目的**: 吸引投票,获得激励
- **方式**: 向 Bribe 合约存入代币
- **分配**: 按投票权重分配给投票者

## 开发命令

### 智能合约

```bash
# 安装依赖
npm install

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

# 部署到测试网
npm run deploy:testnet
```

### 前端

```bash
# 进入前端目录并安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 安全考虑

### 已实施的安全措施

1. **重入保护**: 所有状态变更函数使用 ReentrancyGuard
2. **安全转账**: 使用 SafeERC20 进行代币操作
3. **权限控制**: Ownable 和自定义权限管理
4. **输入验证**: 严格的参数检查
5. **时间锁**: 截止时间机制防止前置交易

### 待完善的安全措施

1. **完整测试**: 需要 100% 测试覆盖率
2. **形式化验证**: 关键逻辑的数学证明
3. **专业审计**: 第三方安全审计
4. **Bug 赏金**: 建立漏洞赏金计划
5. **时间锁合约**: 关键操作的时间延迟

## 部署清单

### 准备工作

- [ ] 完成所有合约开发
- [ ] 100% 测试覆盖率
- [ ] Gas 优化完成
- [ ] 安全审计通过
- [ ] 文档完善

### 测试网部署

- [ ] 部署所有合约
- [ ] 验证合约代码
- [ ] 初始化参数设置
- [ ] 创建测试交易对
- [ ] 前端集成测试
- [ ] 社区测试

### 主网部署

- [ ] 最终审计
- [ ] 部署脚本测试
- [ ] 多签钱包设置
- [ ] 时间锁配置
- [ ] 合约部署
- [ ] 前端上线
- [ ] 监控系统
- [ ] 应急响应计划

## 参考资料

- [Solidly 源码](https://github.com/velodrome-finance/solidly)
- [ve(3,3) 原文](https://andrecronje.medium.com/ve-3-3-44466eaa088b)
- [Curve Finance 文档](https://curve.readthedocs.io/)
- [Uniswap V2 文档](https://docs.uniswap.org/contracts/v2/overview)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts/)

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
