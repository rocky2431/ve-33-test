# BSC Testnet 部署指南（P0修复版本）

## 📋 部署前检查清单

### ✅ 环境准备

- [ ] Node.js >= 16 已安装
- [ ] npm 依赖已安装 (`npm install`)
- [ ] 合约编译成功 (`npm run compile`)
- [ ] 所有测试通过 (`npm run test`) - **114/114 测试 ✅**

### ✅ BSC Testnet 配置

#### 1. 获取测试网BNB

访问 BSC Testnet水龙头获取测试币：
- https://testnet.bnbchain.org/faucet-smart
- 每次可获取 0.5 tBNB
- 建议准备至少 0.3 tBNB 用于部署

#### 2. 配置环境变量

创建 `.env` 文件（如果不存在）：

```bash
# BSC Testnet RPC URL
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# 部署账户私钥 (不要上传到git!)
PRIVATE_KEY=your_private_key_here

# BSCScan API Key (用于合约验证)
BSCSCAN_API_KEY=your_bscscan_api_key
```

**获取 BSCScan API Key:**
1. 访问 https://testnet.bscscan.com/
2. 注册账号并登录
3. 进入 API-KEYs 页面创建新key

#### 3. 验证账户余额

```bash
# 检查账户余额
npx hardhat console --network bscTestnet

# 在console中执行
const [deployer] = await ethers.getSigners();
console.log("账户:", deployer.address);
console.log("余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
```

预期输出应 >= 0.3 BNB

### ✅ 合约准备

#### 1. P0修复验证

确认以下修复已应用：

| 修复项 | 文件 | 状态 |
|--------|------|------|
| Flash Loan防护 | Voter.sol | ✅ 最小持有期1天 |
| Minter分配机制 | Minter.sol:170 | ✅ transfer替代approve |
| 最小流动性锁定 | Pair.sol:143 | ✅ mint到死亡地址 |
| Decimal缩放修复 | Pair.sol:261-267 | ✅ 使用10**decimals() |
| skim/sync函数 | Pair.sol:320-348 | ✅ 完整实现 |
| Gauge精度 | Gauge.sol | ✅ 1e18精度 |
| Bribe粉尘防护 | Bribe.sol | ✅ 最小存款阈值 |

#### 2. 编译验证

```bash
npm run compile
```

预期输出：
```
Compiled 9 Solidity files successfully (evm target: paris).
```

#### 3. 测试验证

```bash
npm run test
```

预期结果：**114 passing** (100%)

---

## 🚀 部署流程

### 第一步：执行部署脚本

```bash
npm run deploy:bsc
```

### 第二步：记录合约地址

部署脚本会自动保存合约地址到 `deployments/full-deployment-<timestamp>.json`

**预期部署顺序：**

1. **核心AMM层** (~5分钟)
   - Token (SOLID治理代币)
   - Factory (交易对工厂)
   - WETH (包装ETH)
   - Router (路由合约)

2. **治理系统层** (~3分钟)
   - VotingEscrow (ve-NFT投票托管)
   - Voter (投票管理)
   - Minter (代币铸造)

3. **初始化配置** (~2分钟)
   - VotingEscrow.setVoter()
   - Voter.setMinter()
   - Minter.setVoter()
   - Token.setMinter()

**总预计时间**: ~10分钟

### 第三步：合约验证

```bash
# 验证所有合约（依次执行）
npx hardhat verify --network bscTestnet <Token地址> "Solidly Token" "SOLID"
npx hardhat verify --network bscTestnet <Factory地址>
npx hardhat verify --network bscTestnet <WETH地址> "Wrapped ETH" "WETH"
npx hardhat verify --network bscTestnet <Router地址> <Factory地址> <WETH地址>
npx hardhat verify --network bscTestnet <VotingEscrow地址> <Token地址>
npx hardhat verify --network bscTestnet <Voter地址> <VotingEscrow地址> <Factory地址> <Token地址>
npx hardhat verify --network bscTestnet <Minter地址> <Token地址> <VotingEscrow地址>
```

### 第四步：功能测试

#### 1. 创建测试交易对

```typescript
// 使用 hardhat console
const factory = await ethers.getContractAt("Factory", "<Factory地址>");
const token = await ethers.getContractAt("Token", "<Token地址>");
const weth = await ethers.getContractAt("Token", "<WETH地址>");

// 创建 SOLID/WETH 交易对
await factory.createPair(token.address, weth.address, false);
const pairAddress = await factory.getPair(token.address, weth.address, false);
console.log("交易对地址:", pairAddress);
```

#### 2. 创建Gauge

```typescript
const voter = await ethers.getContractAt("Voter", "<Voter地址>");
await voter.createGauge(pairAddress);
const gaugeAddress = await voter.gauges(pairAddress);
console.log("Gauge地址:", gaugeAddress);
```

#### 3. 测试锁仓功能

```typescript
const votingEscrow = await ethers.getContractAt("VotingEscrow", "<VotingEscrow地址>");

// 批准代币
await token.approve(votingEscrow.address, ethers.parseEther("1000"));

// 创建锁仓 (1年)
const lockDuration = 365 * 86400;
await votingEscrow.create_lock(ethers.parseEther("1000"), lockDuration);

// 检查NFT
const tokenId = 1;
const balance = await votingEscrow.balanceOfNFT(tokenId);
console.log("投票权重:", ethers.formatEther(balance));
```

#### 4. 启动Minter

```typescript
const minter = await ethers.getContractAt("Minter", "<Minter地址>");

// 开始代币增发
await minter.start();

// 检查状态
const activePeriod = await minter.active_period();
console.log("当前周期:", new Date(Number(activePeriod) * 1000));
```

---

## 📊 部署后验证

### ✅ 合约配置检查

```typescript
// 检查所有关联是否正确设置
const votingEscrow = await ethers.getContractAt("VotingEscrow", "<VotingEscrow地址>");
const voter = await ethers.getContractAt("Voter", "<Voter地址>");
const minter = await ethers.getContractAt("Minter", "<Minter地址>");
const token = await ethers.getContractAt("Token", "<Token地址>");

console.log("VotingEscrow.voter:", await votingEscrow.voter());  // 应等于Voter地址
console.log("Voter.minter:", await voter.minter());              // 应等于Minter地址
console.log("Minter.voter:", await minter.voter());              // 应等于Voter地址
console.log("Token.minter:", await token.minter());              // 应等于Minter地址
```

### ✅ P0修复验证

#### Flash Loan防护测试
```typescript
// 创建ve-NFT
await token.approve(votingEscrow.address, ethers.parseEther("100"));
await votingEscrow.create_lock(ethers.parseEther("100"), 365 * 86400);

// 立即投票应该失败（最小持有期未满）
try {
  await voter.vote(1, [pairAddress], [100]);
  console.log("❌ Flash Loan防护失败 - 应该revert");
} catch (e) {
  console.log("✅ Flash Loan防护正常 - 阻止了同日投票");
}
```

#### Minter分配测试
```typescript
// 触发周期更新
await ethers.provider.send("evm_increaseTime", [7 * 86400]); // 7天
await minter.update_period();

// 检查Voter是否收到代币
const voterBalance = await token.balanceOf(voter.address);
console.log("Voter代币余额:", ethers.formatEther(voterBalance));
// 应该 > 0，说明transfer成功
```

### ✅ 区块链浏览器检查

访问 https://testnet.bscscan.com/ 验证：

- [ ] 所有合约都已验证（绿色✓标记）
- [ ] 合约代码可读
- [ ] 交易历史正常
- [ ] 事件日志可见

---

## 🔧 故障排查

### 问题1: 部署失败 - Gas不足

**现象**: `insufficient funds for gas * price + value`

**解决方案**:
1. 检查账户余额: 应该 >= 0.3 BNB
2. 从水龙头获取更多tBNB
3. 降低gas price（如果网络不拥堵）

### 问题2: 合约验证失败

**现象**: `Fail - Unable to verify`

**解决方案**:
1. 确认使用了正确的构造函数参数
2. 确认编译器版本 (0.8.20)
3. 确认优化设置 (runs: 200, viaIR: true)
4. 重试验证命令

### 问题3: Minter.start()失败

**现象**: `Minter: not started yet`

**解决方案**:
1. 检查当前时间是否在epoch边界
2. 等待下一个周四UTC 00:00
3. 或手动调用 `update_period()`

### 问题4: 投票失败

**现象**: `Voter: minimum holding period not met`

**解决方案**:
1. 检查ve-NFT创建时间
2. 等待至少1天（86400秒）
3. 使用 `evm_increaseTime` 在测试网加速

---

## 📝 部署记录模板

```markdown
## BSC Testnet 部署记录 (P0修复版本)

**部署日期**: YYYY-MM-DD
**部署账户**: 0x...
**网络**: BSC Testnet (ChainID: 97)
**Gas Used**: ~X.XXX BNB

### 合约地址

**核心AMM层:**
- Token: 0x...
- Factory: 0x...
- Router: 0x...
- WETH: 0x...

**治理系统层:**
- VotingEscrow: 0x...
- Voter: 0x...
- Minter: 0x...

### 测试交易对

- SOLID/WETH Pair: 0x...
- SOLID/WETH Gauge: 0x...

### 验证状态

- [x] 所有合约已在BSCScan验证
- [x] Flash Loan防护测试通过
- [x] Minter分配测试通过
- [x] 基本功能测试通过

### 区块链浏览器链接

- Token: https://testnet.bscscan.com/address/0x...
- Factory: https://testnet.bscscan.com/address/0x...
- ...
```

---

## 🎯 下一步计划

部署完成后的后续工作：

1. **前端集成**
   - 更新前端配置文件中的合约地址
   - 测试所有前端功能
   - 部署前端到测试环境

2. **社区测试**
   - 邀请测试用户
   - 收集反馈
   - 修复发现的问题

3. **安全审计**
   - 寻找专业审计公司
   - 准备审计文档
   - 修复审计发现的问题

4. **主网部署准备**
   - 完善文档
   - 准备主网参数
   - 制定上线计划

---

**⚠️ 重要提醒**

- 这是测试网部署，所有代币都没有实际价值
- 部署前务必完成所有检查清单项目
- 保存好部署后的所有合约地址
- 定期备份部署记录和配置文件
