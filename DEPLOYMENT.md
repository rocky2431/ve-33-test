# 🚀 ve(3,3) DEX 部署指南

完整的 BSC Testnet 部署教程，包含已部署的合约地址和配置信息。

---

## 📋 部署信息

### 网络信息
- **网络**: BSC Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **浏览器**: https://testnet.bscscan.com/
- **部署者**: `0x90465a524Fd4c54470f77a11DeDF7503c951E62F`
- **部署时间**: 2025-01-16

---

## 📦 已部署的合约地址

### 核心 AMM 层

| 合约 | 地址 | 区块链浏览器 |
|------|------|------------|
| **SOLID Token** | `0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231` | [查看](https://testnet.bscscan.com/address/0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231) |
| **Factory** | `0x739d450F9780e7f6c33263a51Bd53B83F18CfD53` | [查看](https://testnet.bscscan.com/address/0x739d450F9780e7f6c33263a51Bd53B83F18CfD53) |
| **Router** | `0xaf796B4Df784cc7B40F1e999B668779143B63f52` | [查看](https://testnet.bscscan.com/address/0xaf796B4Df784cc7B40F1e999B668779143B63f52) |
| **WETH (WBNB)** | `0xF8ef391F45ce84b25Dc0194bDD97daD5E04cd3bC` | [查看](https://testnet.bscscan.com/address/0xF8ef391F45ce84b25Dc0194bDD97daD5E04cd3bC) |

### ve(3,3) 治理层

| 合约 | 地址 | 区块链浏览器 |
|------|------|------------|
| **VotingEscrow** | `0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6` | [查看](https://testnet.bscscan.com/address/0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6) |
| **Voter** | `0x28EE028C9D26c59f2C7E9CBE16B89366933d0792` | [查看](https://testnet.bscscan.com/address/0x28EE028C9D26c59f2C7E9CBE16B89366933d0792) |
| **Minter** | `0x41E31C21151F7e8E509754a197463a8E234E136E` | [查看](https://testnet.bscscan.com/address/0x41E31C21151F7e8E509754a197463a8E234E136E) |

---

## 🛠️ 环境准备

### 1. 获取测试币

**BSC Testnet BNB:**
- 访问: https://testnet.bnbchain.org/faucet-smart
- 输入钱包地址
- 每次领取约 0.5 tBNB
- 部署需要至少 0.2 BNB

### 2. 配置 API Key

**BscScan API Key:**
1. 访问 https://bscscan.com/apis
2. 注册并创建 API Key
3. 用于合约验证

**WalletConnect Project ID:**
1. 访问 https://cloud.walletconnect.com/
2. 注册并创建项目
3. 复制 Project ID

---

## ⚙️ 环境变量配置

### 后端配置 (根目录 .env)

```env
# BSC Testnet RPC
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# 钱包私钥 (⚠️ 请勿分享!)
PRIVATE_KEY=your_private_key_here

# BscScan API Key
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Gas Reporter
REPORT_GAS=false
```

### 前端配置 (frontend/.env)

```env
# 网络配置
VITE_CHAIN_ID=97
VITE_CHAIN_NAME=BSC Testnet
VITE_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_BLOCK_EXPLORER=https://testnet.bscscan.com

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# 核心 AMM 层合约
VITE_CONTRACT_TOKEN=0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231
VITE_CONTRACT_FACTORY=0x739d450F9780e7f6c33263a51Bd53B83F18CfD53
VITE_CONTRACT_ROUTER=0xaf796B4Df784cc7B40F1e999B668779143B63f52
VITE_CONTRACT_WETH=0xF8ef391F45ce84b25Dc0194bDD97daD5E04cd3bC

# ve(3,3) 治理层合约
VITE_CONTRACT_VOTING_ESCROW=0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6
VITE_CONTRACT_VOTER=0x28EE028C9D26c59f2C7E9CBE16B89366933d0792
VITE_CONTRACT_MINTER=0x41E31C21151F7e8E509754a197463a8E234E136E
```

---

## 📦 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

---

## 🔨 部署流程

### 1. 编译合约

```bash
npm run compile
```

确保所有合约编译成功，无错误。

### 2. 部署到 BSC Testnet

```bash
npm run deploy:bsc
```

**部署过程约需 3-5 分钟，输出示例：**

```
🚀 开始部署完整的 ve(3,3) DEX 系统...

📝 部署账户: 0x9046...E62F
💰 账户余额: 0.5 BNB

====================================================================
📦 第一阶段: 部署核心 AMM 合约
====================================================================

1️⃣  部署治理代币...
   ✅ Token: 0x2CfA...E231

2️⃣  部署 Factory...
   ✅ Factory: 0x739d...CfD53

3️⃣  部署 WETH...
   ✅ WETH: 0xF8ef...fD3bC

4️⃣  部署 Router...
   ✅ Router: 0xaf79...3f52

====================================================================
📦 第二阶段: 部署 ve(3,3) 治理系统
====================================================================

5️⃣  部署 VotingEscrow (ve-NFT)...
   ✅ VotingEscrow: 0x5c34...d6A6

6️⃣  部署 Voter...
   ✅ Voter: 0x28EE...0792

7️⃣  部署 Minter...
   ✅ Minter: 0x41E3...136E

====================================================================
⚙️  第三阶段: 初始化系统配置
====================================================================

🔗 设置合约关联...
   ✅ 系统配置完成

====================================================================
🎉 部署成功!
====================================================================
```

### 3. 验证合约

```bash
# Token
npx hardhat verify --network bscTestnet 0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231 "Solidly Token" "SOLID"

# Factory
npx hardhat verify --network bscTestnet 0x739d450F9780e7f6c33263a51Bd53B83F18CfD53

# Router
npx hardhat verify --network bscTestnet 0xaf796B4Df784cc7B40F1e999B668779143B63f52 0x739d450F9780e7f6c33263a51Bd53B83F18CfD53 0xF8ef391F45ce84b25Dc0194bDD97daD5E04cd3bC

# VotingEscrow
npx hardhat verify --network bscTestnet 0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6 0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231

# Voter
npx hardhat verify --network bscTestnet 0x28EE028C9D26c59f2C7E9CBE16B89366933d0792 0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6 0x739d450F9780e7f6c33263a51Bd53B83F18CfD53 0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231

# Minter
npx hardhat verify --network bscTestnet 0x41E31C21151F7e8E509754a197463a8E234E136E 0x28EE028C9D26c59f2C7E9CBE16B89366933d0792 0x5c34D24c0c1457F2d744505259F9aba5CFAed6A6 0x2CfAd237410F5bdC9eEA98C79e8391e1AffEE231
```

---

## 🌐 启动前端

### 开发模式

```bash
cd frontend
npm run dev
```

访问: http://localhost:3001/

### 生产构建

```bash
cd frontend
npm run build
npm run preview
```

---

## 🧪 功能测试

### 1. 连接钱包

1. 打开前端应用
2. 点击 "Connect Wallet"
3. 选择 MetaMask
4. 确认连接到 BSC Testnet
5. 授权连接

### 2. 配置 MetaMask

**添加 BSC Testnet 网络：**

```
网络名称: BSC Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
Chain ID: 97
Currency Symbol: tBNB
Block Explorer: https://testnet.bscscan.com/
```

### 3. 前端功能介绍

**已完成的功能模块 (90%):**

1. **Dashboard 仪表盘**
   - 资产概览（SOLID余额、WBNB余额、ve-NFT数量）
   - 快速操作入口（跳转到各功能模块）
   - ve(3,3)机制说明

2. **Swap 交易**
   - Token选择和输入
   - 实时价格查询
   - 滑点设置
   - 授权+交换完整流程

3. **流动性管理**
   - 添加流动性（波动性池/稳定币池）
   - 移除流动性（比例或自定义数量）
   - 我的流动性列表

4. **ve-NFT 锁仓**
   - 创建锁仓（1周-4年，实时投票权重预览）
   - ve-NFT列表管理

5. **Vote 投票** (占位符)
6. **Rewards 奖励** (占位符)

### 4. 测试 Swap 功能

1. 点击顶部导航 "Swap"
2. 选择 SOLID → WBNB
3. 输入交换金额
4. 点击 "授权 SOLID"（首次）
5. 确认授权交易
6. 点击 "交换"
7. 确认交换交易
8. 等待交易确认
9. 查看余额更新

### 5. 测试流动性管理

1. 点击顶部导航 "流动性"
2. 选择 "添加流动性" 标签
3. 输入 SOLID 和 WBNB 数量
4. 选择池类型（波动性/稳定币）
5. 授权两个 Token
6. 点击 "添加流动性"
7. 确认交易

### 6. 测试 ve-NFT 锁仓

1. 点击顶部导航 "锁仓"
2. 选择 "创建锁仓" 标签
3. 输入锁仓数量
4. 选择锁仓时长（预设或滑块）
5. 查看预览的投票权重
6. 授权 SOLID
7. 点击 "创建锁仓"
8. 确认交易

### 7. 启动 Minter

启动代币增发机制：

```bash
npx hardhat console --network bscTestnet

# 在 console 中执行:
const minter = await ethers.getContractAt("Minter", "0x41E31C21151F7e8E509754a197463a8E234E136E")
await minter.start()
```

---

## 📊 系统架构

```
ve(3,3) DEX 架构
┌─────────────────────────────────────────────────────┐
│                   用户界面层                         │
│  React + TypeScript + wagmi + Web3Modal            │
│  http://localhost:3000                             │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                  智能合约层                          │
├─────────────────────────────────────────────────────┤
│  核心 AMM 层                                        │
│  ├── Token     (0x2CfA...E231)                     │
│  ├── Factory   (0x739d...CfD53)                    │
│  ├── Router    (0xaf79...3f52)                     │
│  └── WETH      (0xF8ef...fD3bC)                    │
├─────────────────────────────────────────────────────┤
│  ve(3,3) 治理层                                     │
│  ├── VotingEscrow (0x5c34...d6A6)                  │
│  ├── Voter        (0x28EE...0792)                  │
│  └── Minter       (0x41E3...136E)                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              BSC Testnet (Chain ID: 97)            │
│  https://testnet.bscscan.com                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 故障排除

### 部署失败

**问题**: `insufficient funds for gas`

**解决方案**:
- 从水龙头获取更多 tBNB
- 检查账户余额是否充足

---

**问题**: 合约验证失败

**解决方案**:
- 确认编译器版本: `v0.8.20`
- 确认优化设置: `runs: 200`
- 检查构造函数参数顺序

---

### 前端连接失败

**问题**: 钱包无法连接

**解决方案**:
1. 确认 MetaMask 已安装
2. 检查网络设置为 BSC Testnet
3. 刷新页面重试
4. 清除浏览器缓存

---

**问题**: 交易一直 pending

**解决方案**:
1. 在 BscScan 查看交易状态
2. 确认 Gas 设置合理
3. 等待区块确认（约 3-5 秒）
4. 如果长时间未确认，尝试加速或取消

---

### 合约交互失败

**问题**: `call revert exception`

**解决方案**:
- 检查合约地址配置
- 确认网络为 BSC Testnet
- 验证账户有足够余额
- 检查是否需要先授权

---

**问题**: 价格查询失败

**解决方案**:
- 确认流动性池已创建
- 检查 Token 地址正确
- 验证 Router 合约地址

---

## ✅ 部署验证清单

完成部署后，确认以下项目：

### 合约部署
- [ ] 所有合约成功部署
- [ ] 合约地址已保存
- [ ] 合约在 BscScan 上可见
- [ ] 合约代码已验证

### 前端配置
- [ ] 环境变量配置正确
- [ ] 前端可以启动
- [ ] 钱包可以连接
- [ ] 合约地址正确显示

### 功能测试
- [ ] Dashboard 页面加载正常
- [ ] 资产统计显示正确
- [ ] Token 余额查询正常
- [ ] Swap 价格查询功能正常
- [ ] Token 授权功能正常
- [ ] Swap 交易可以成功执行
- [ ] 交易后余额正确更新
- [ ] 流动性添加/移除功能正常
- [ ] ve-NFT 创建功能正常
- [ ] ve-NFT 列表显示正确
- [ ] 响应式布局正常（桌面端和移动端）

---

## 📚 相关链接

- **BSC Testnet Explorer**: https://testnet.bscscan.com/
- **BSC Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **Hardhat 文档**: https://hardhat.org/docs
- **BSC 文档**: https://docs.bnbchain.org

---

## 📞 需要帮助？

- 查看 [DEVELOPMENT.md](DEVELOPMENT.md) 了解开发细节
- 查看 [README.md](README.md) 了解项目概述
- 在 BscScan 上检查交易详情
- 查看浏览器控制台错误信息

---

<div align="center">

**🎉 部署完成！享受你的 ve(3,3) DEX！🎉**

Made with ❤️ by ve(3,3) DEX Team

</div>
