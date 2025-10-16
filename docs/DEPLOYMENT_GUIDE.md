# 🚀 BSC Testnet 部署指南

本指南将帮助您将 ve(3,3) DEX 部署到 BSC Testnet 并完成前端集成。

---

## 📋 准备工作

### 1. 获取 BSC Testnet BNB

访问 BSC Testnet Faucet 获取测试 BNB:
- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- 每次可领取 0.5 BNB
- 需要至少 0.2 BNB 用于部署

### 2. 获取 BscScan API Key

1. 访问 [BscScan](https://bscscan.com/myapikey)
2. 注册并创建 API Key
3. 用于验证合约

### 3. 获取 WalletConnect Project ID

1. 访问 [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. 注册并创建项目
3. 复制 Project ID

---

## ⚙️ 配置环境变量

### 1. 配置后端环境变量

在项目根目录创建 `.env` 文件:

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env`:

```env
# BSC Testnet RPC
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# 你的钱包私钥 (不要分享给任何人!)
PRIVATE_KEY=your_private_key_here

# BscScan API Key
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Gas Reporter (可选)
REPORT_GAS=false
```

**⚠️ 重要**:
- 确保 `.env` 在 `.gitignore` 中
- 永远不要提交包含私钥的文件

### 2. 配置前端环境变量

在 `frontend/` 目录创建 `.env`:

```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env`:

```env
# Chain Configuration
VITE_CHAIN_ID=97
VITE_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# 合约地址 (部署后填入)
VITE_CONTRACT_TOKEN=
VITE_CONTRACT_FACTORY=
VITE_CONTRACT_ROUTER=
VITE_CONTRACT_VENFT=
VITE_CONTRACT_VOTER=
VITE_CONTRACT_MINTER=
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

## 🔨 编译合约

```bash
npm run compile
```

确保所有合约编译成功,没有错误。

---

## 🚀 部署到 BSC Testnet

### 1. 部署合约

```bash
npm run deploy:bsc
```

部署过程约需 3-5 分钟。输出示例:

```
🚀 开始部署完整的 ve(3,3) DEX 系统...

📝 部署账户: 0x1234...5678
💰 账户余额: 0.5 BNB

====================================================================
📦 第一阶段: 部署核心 AMM 合约
====================================================================

1️⃣  部署治理代币...
   ✅ Token: 0xABCD...EF01

2️⃣  部署 Factory...
   ✅ Factory: 0x1234...5678

3️⃣  部署 WETH...
   ✅ WETH: 0x5678...9ABC

4️⃣  部署 Router...
   ✅ Router: 0x9ABC...DEF0

====================================================================
📦 第二阶段: 部署 ve(3,3) 治理系统
====================================================================

5️⃣  部署 VotingEscrow (ve-NFT)...
   ✅ VotingEscrow: 0xDEF0...1234

6️⃣  部署 Voter...
   ✅ Voter: 0x2345...6789

7️⃣  部署 Minter...
   ✅ Minter: 0x6789...ABCD

====================================================================
⚙️  第三阶段: 初始化系统配置
====================================================================

🔗 设置合约关联...
   - VotingEscrow.setVoter()
   - Voter.setMinter()
   - Minter.setVoter()
   - Token.setMinter()
   ✅ 系统配置完成

====================================================================
🎉 部署成功!
====================================================================

📋 核心 AMM 层:
   Token     : 0xABCD...EF01
   Factory   : 0x1234...5678
   Router    : 0x9ABC...DEF0
   WETH      : 0x5678...9ABC

📋 治理系统层:
   VotingEscrow: 0xDEF0...1234
   Voter       : 0x2345...6789
   Minter      : 0x6789...ABCD

✅ 部署信息已保存: deployments/full-deployment-1234567890.json
```

### 2. 保存合约地址

部署脚本会自动保存合约地址到 `deployments/` 目录。

复制合约地址到前端环境变量:

```bash
# 编辑 frontend/.env
VITE_CONTRACT_TOKEN=0xABCD...EF01
VITE_CONTRACT_FACTORY=0x1234...5678
VITE_CONTRACT_ROUTER=0x9ABC...DEF0
VITE_CONTRACT_VENFT=0xDEF0...1234
VITE_CONTRACT_VOTER=0x2345...6789
VITE_CONTRACT_MINTER=0x6789...ABCD
```

---

## ✅ 验证合约

在 BscScan 上验证合约代码:

### 自动验证 (推荐)

```bash
# 验证 Token
npx hardhat verify --network bscTestnet <TOKEN_ADDRESS> "Solidly Token" "SOLID"

# 验证 Factory
npx hardhat verify --network bscTestnet <FACTORY_ADDRESS>

# 验证 Router
npx hardhat verify --network bscTestnet <ROUTER_ADDRESS> <FACTORY_ADDRESS> <WETH_ADDRESS>

# 验证 VotingEscrow
npx hardhat verify --network bscTestnet <VENFT_ADDRESS> <TOKEN_ADDRESS>

# 验证 Voter
npx hardhat verify --network bscTestnet <VOTER_ADDRESS> <VENFT_ADDRESS> <FACTORY_ADDRESS> <TOKEN_ADDRESS>

# 验证 Minter
npx hardhat verify --network bscTestnet <MINTER_ADDRESS> <TOKEN_ADDRESS> <VENFT_ADDRESS>
```

### 手动验证

1. 访问 [BSC Testnet Explorer](https://testnet.bscscan.com/)
2. 搜索合约地址
3. 点击 "Contract" → "Verify and Publish"
4. 选择编译器版本: `v0.8.20+commit.a1b79de6`
5. 选择优化: `Yes` (runs: 200)
6. 粘贴合约代码
7. 提交验证

---

## 🌐 启动前端

### 1. 开发模式

```bash
npm run frontend:dev
```

访问 http://localhost:3000

### 2. 生产构建

```bash
npm run frontend:build
```

构建文件在 `frontend/dist/` 目录。

---

## 🧪 测试功能

### 1. 连接钱包

1. 打开前端应用
2. 点击 "Connect Wallet"
3. 选择 MetaMask
4. 切换到 BSC Testnet (Chain ID: 97)
5. 确认连接

### 2. 测试交易功能

#### a. 创建测试代币对

使用 Hardhat console 或 Remix IDE:

```javascript
// 连接到已部署的 Factory
const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

// 创建 TOKEN/WBNB 交易对
await factory.createPair(TOKEN_ADDRESS, WBNB_ADDRESS, false);

// 获取交易对地址
const pairAddress = await factory.getPair(TOKEN_ADDRESS, WBNB_ADDRESS, false);
console.log("Pair created:", pairAddress);
```

#### b. 添加流动性

1. 在前端访问 "流动性" 页面
2. 选择代币对
3. 输入数量
4. 确认交易

#### c. 测试交换

1. 访问 "交易" 页面
2. 选择交换代币
3. 输入数量
4. 确认交换

### 3. 测试治理功能

#### a. 创建锁仓

1. 访问 "投票" 页面
2. 输入锁定数量
3. 选择锁定时间 (1周-4年)
4. 确认创建

#### b. 投票

1. 选择你的 ve-NFT
2. 选择要投票的池子
3. 分配权重
4. 确认投票

#### c. 领取奖励

1. 访问 "奖励" 页面
2. 查看可领取奖励
3. 点击 "领取"

---

## 📊 监控和维护

### 1. 查看合约状态

在 BscScan 上:
- 查看交易历史
- 监控合约余额
- 检查事件日志

### 2. 常见问题

#### Gas 费用过高

```bash
# 调整 hardhat.config.ts 中的 gasPrice
gasPrice: 5000000000, // 5 gwei
```

#### 交易失败

- 检查账户 BNB 余额
- 确认合约地址正确
- 检查 gas limit 设置

#### 前端连接失败

- 确认环境变量正确
- 检查 RPC URL 是否可用
- 刷新浏览器缓存

---

## 🔍 验证清单

部署完成后,确保以下功能正常:

- [ ] 所有合约成功部署
- [ ] 合约在 BscScan 上验证
- [ ] 前端可以连接钱包
- [ ] 可以查询合约状态
- [ ] 可以创建交易对
- [ ] 可以添加流动性
- [ ] 可以进行交换
- [ ] 可以创建锁仓
- [ ] 可以投票
- [ ] 可以领取奖励

---

## 📚 相关链接

- **BSC Testnet Explorer**: https://testnet.bscscan.com/
- **BSC Testnet Faucet**: https://testnet.binance.org/faucet-smart
- **BSC Testnet RPC**: https://data-seed-prebsc-1-s1.binance.org:8545
- **Chain ID**: 97
- **Gas Token**: BNB

---

## 🆘 故障排除

### 问题 1: 部署失败

```
Error: insufficient funds for gas * price + value
```

**解决方案**: 从 faucet 获取更多 BNB

### 问题 2: 合约验证失败

```
Error: Failed to verify contract
```

**解决方案**:
- 检查编译器版本
- 确认优化设置
- 使用 `--via-ir` 标志

### 问题 3: 前端无法连接

```
Error: Chain not configured
```

**解决方案**:
- 在 `wagmi.ts` 中添加 bscTestnet
- 确认 chainId 正确

---

## ✅ 成功部署!

恭喜!你已经成功将 ve(3,3) DEX 部署到 BSC Testnet!

**下一步**:
1. 测试所有功能
2. 收集用户反馈
3. 进行安全审计
4. 准备主网部署

---

## 📞 需要帮助?

- 查看 [DEVELOPMENT.md](DEVELOPMENT.md) 了解更多技术细节
- 查看 [README.md](../README.md) 了解项目概述
- 提交 Issue 到 GitHub

---

<div align="center">

**🎉 祝你部署顺利! 🎉**

Made with ❤️ by ve(3,3) DEX Team

</div>
