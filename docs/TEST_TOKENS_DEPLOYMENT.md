# 📚 测试代币部署指南

## 概述

本指南说明如何部署4个测试代币（STE, STF, STCX, SBF）并创建流动性池。

---

## 📋 代币规格

| 代币 | 全称 | 符号 | 总供应量 | 流动性分配 | 测试地址分配 |
|------|------|------|----------|-----------|-------------|
| STE | Star Energy | STE | 100亿 | 10% | 90% |
| STF | Star Finance | STF | 100亿 | 10% | 90% |
| STCX | Star Chain X | STCX | 100亿 | 10% | 90% |
| SBF | Star Base Finance | SBF | 100亿 | 10% | 90% |

**总供应**: `10,000,000,000 tokens` (100亿)
**精度**: 18 decimals
**类型**: 固定供应量 ERC20 (无增发)

---

## 🏗️ 部署步骤

### 1️⃣ 编译合约

```bash
npm run compile
```

确保 `SimpleToken.sol` 合约成功编译。

### 2️⃣ 部署测试代币

```bash
npx hardhat run scripts/deploy-test-tokens.ts --network bscTestnet
```

**执行流程**:
1. 部署 4 个 SimpleToken 合约
2. 每个代币铸造 100亿 供应量给部署者
3. 如果指定了测试地址(非部署者),转账90%到测试地址
4. 保留10%用于流动性池
5. 生成 `deployed-test-tokens.json` 部署信息文件

**输出示例**:
```json
{
  "network": "bscTestnet",
  "deployer": "0x...",
  "testAddress": "0x...",
  "totalSupply": "10000000000000000000000000000",
  "liquidityAmount": "1000000000000000000000000000",
  "tokens": [
    {
      "name": "Star Energy",
      "symbol": "STE",
      "address": "0x..."
    },
    ...
  ]
}
```

### 3️⃣ 添加流动性并创建池子

```bash
npx hardhat run scripts/add-test-liquidity.ts --network bscTestnet
```

**执行流程**:
1. 读取已部署的代币地址
2. 为每两个代币创建交易对:
   - ✅ 稳定币池 (stable = true)
   - ✅ 波动性池 (stable = false)
3. 为每个池子添加 5亿 代币流动性
4. 生成 `deployed-pools.json` 池子信息文件

**创建的交易对** (共12个池子):

| 交易对 | 稳定池 | 波动池 |
|--------|--------|--------|
| STE/STF | ✅ | ✅ |
| STE/STCX | ✅ | ✅ |
| STE/SBF | ✅ | ✅ |
| STF/STCX | ✅ | ✅ |
| STF/SBF | ✅ | ✅ |
| STCX/SBF | ✅ | ✅ |

**每个池子的流动性**:
- Token A: 500,000,000 (5亿)
- Token B: 500,000,000 (5亿)

### 4️⃣ 为池子创建 Gauge (可选)

```bash
npx hardhat run scripts/create-gauges-for-pools.ts --network bscTestnet
```

为每个池子创建对应的 Gauge，使其可以:
- 接收 SRT 排放
- 接收用户投票
- 分配流动性挖矿奖励

---

## 📊 稳定池 vs 波动池

### 🟢 稳定币池 (Stable Pool)

**公式**: `x³y + y³x = k` (StableSwap 曲线)

**特点**:
- ✅ 极低滑点 (在 1:1 附近)
- ✅ 资本效率高
- ✅ 适合价格稳定的代币对

**适用场景**:
```
✅ USDT/USDC  - 稳定币对
✅ DAI/USDT   - 稳定币对
✅ WBTC/renBTC - 锚定资产
```

**代码**:
```solidity
// 创建稳定池
router.addLiquidity(
  tokenA,
  tokenB,
  true,  // ✅ stable = true
  ...
)
```

### 🔵 波动性池 (Volatile Pool)

**公式**: `x × y = k` (恒定乘积)

**特点**:
- ✅ 支持大幅价格波动
- ✅ 价格发现功能
- ✅ 适合价格独立的代币对

**适用场景**:
```
✅ SRT/WSRT   - 治理代币/包装代币
✅ STE/STF    - 不同项目代币
✅ ETH/USDT   - 主流币/稳定币
```

**代码**:
```solidity
// 创建波动池
router.addLiquidity(
  tokenA,
  tokenB,
  false,  // ✅ stable = false
  ...
)
```

**详细对比**: 请查看 [POOL_TYPES.md](./POOL_TYPES.md)

---

## 🎯 前端集成

### 1. 更新代币配置

编辑 `frontend/src/constants/tokens.ts`:

```typescript
export const TOKENS: Record<string, Token> = {
  // 原有代币
  SRT: { address: '0x...', symbol: 'SRT', decimals: 18 },
  WSRT: { address: '0x...', symbol: 'WSRT', decimals: 18 },

  // 新增测试代币
  STE: { address: '0x...', symbol: 'STE', decimals: 18, name: 'Star Energy' },
  STF: { address: '0x...', symbol: 'STF', decimals: 18, name: 'Star Finance' },
  STCX: { address: '0x...', symbol: 'STCX', decimals: 18, name: 'Star Chain X' },
  SBF: { address: '0x...', symbol: 'SBF', decimals: 18, name: 'Star Base Finance' },
}
```

### 2. 查看 Farms 页面

前端已集成 Farms 页面，访问路径:
```
http://localhost:3000/#/farms
```

**功能**:
- 📊 显示所有流动性池
- 🔍 搜索和过滤池子 (全部/稳定/波动)
- 📈 显示 TVL、投票权重、APR
- 🎁 显示贿赂奖励状态
- 🔗 快速跳转到添加流动性和投票

---

## 💡 使用建议

### 测试流程

1. **部署代币**:
   ```bash
   npm run deploy:test-tokens
   ```

2. **添加流动性**:
   ```bash
   npm run deploy:add-liquidity
   ```

3. **创建 Gauge** (可选):
   ```bash
   npm run create-gauges
   ```

4. **前端测试**:
   - 在 Swap 页面测试代币兑换
   - 在 Liquidity 页面添加/移除流动性
   - 在 Farms 页面查看所有池子
   - 在 Vote 页面为池子投票

### 修改配置

**修改测试地址**:
编辑 `scripts/deploy-test-tokens.ts`:
```typescript
const TEST_ADDRESS = '0xYourTestAddress' // 修改为你的测试地址
```

**修改流动性金额**:
编辑 `scripts/add-test-liquidity.ts`:
```typescript
const LIQUIDITY_PER_POOL = ethers.parseEther('500000000') // 修改每池金额
```

---

## 📁 生成的文件

### `deployed-test-tokens.json`
```json
{
  "network": "bscTestnet",
  "deployer": "0x...",
  "tokens": [
    { "symbol": "STE", "address": "0x..." },
    { "symbol": "STF", "address": "0x..." },
    { "symbol": "STCX", "address": "0x..." },
    { "symbol": "SBF", "address": "0x..." }
  ]
}
```

### `deployed-pools.json`
```json
{
  "network": "bscTestnet",
  "pools": [
    {
      "tokenA": "STE",
      "tokenB": "STF",
      "type": "stable",
      "address": "0x...",
      "liquidity": "500000000"
    },
    ...
  ]
}
```

---

## ⚠️ 注意事项

1. **私钥安全**:
   - 确保 `.env` 文件不被提交到 Git
   - 使用测试网专用私钥
   - 不要在主网使用相同私钥

2. **Gas费用**:
   - 部署 4 个代币 + 12 个池子需要较多 Gas
   - 确保部署地址有足够的 BNB 测试币
   - 可以从 [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart) 获取

3. **合约验证**:
   - 部署后在 BSCScan Testnet 验证合约
   - 方便用户查看合约源码

4. **代币分配**:
   - 90% 发送到测试地址供测试使用
   - 10% 用于流动性池
   - 根据需要调整分配比例

---

## 🔧 故障排除

### 问题1: 部署失败 "insufficient funds"
**解决**: 确保部署地址有足够的 BNB 测试币

### 问题2: 添加流动性失败 "insufficient balance"
**解决**: 确保部署者地址有足够的代币余额 (每个池子需要5亿代币)

### 问题3: 池子创建失败 "pair already exists"
**解决**: 该池子已存在，跳过或修改池子参数

### 问题4: 前端不显示新代币
**解决**:
1. 确保更新了 `tokens.ts` 配置
2. 清除浏览器缓存
3. 重启前端开发服务器

---

## 📚 相关文档

- [POOL_TYPES.md](./POOL_TYPES.md) - 池子类型详解
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 主合约部署指南
- [DEVELOPMENT.md](../DEVELOPMENT.md) - 开发文档

---

## ✅ 检查清单

部署前:
- [ ] 编译合约成功
- [ ] 配置了正确的网络
- [ ] 部署地址有足够 BNB
- [ ] 已阅读池子类型说明

部署后:
- [ ] 代币部署成功
- [ ] 流动性池创建成功
- [ ] 生成了部署信息文件
- [ ] 更新了前端配置
- [ ] 在 Farms 页面验证显示

---

## 🎉 完成

恭喜！你已成功部署测试代币和流动性池。

现在可以:
- ✅ 在 Swap 页面测试代币交换
- ✅ 在 Liquidity 页面管理流动性
- ✅ 在 Farms 页面查看所有池子
- ✅ 在 Vote 页面为池子投票
- ✅ 测试完整的 ve(3,3) DEX 功能
