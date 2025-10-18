# 📊 流动性池类型详解

## 概述

ve(3,3) DEX 支持两种类型的流动性池：
- **波动性池 (Volatile Pool)**：适用于价格波动较大的代币对
- **稳定币池 (Stable Pool)**：适用于价格相对稳定的代币对（如稳定币、锚定资产）

---

## 🔵 波动性池 (Volatile Pool)

### 数学模型
使用 **恒定乘积做市商 (Constant Product Market Maker, x*y=k)**

```solidity
// Pair.sol
function _k(uint x, uint y) internal view returns (uint) {
    if (stable) {
        // 稳定币池公式
        ...
    } else {
        // 波动性池公式
        return x * y;  // ✅ 恒定乘积
    }
}
```

### 定价公式
```
x × y = k (常数)

价格 = y / x

交易后: x' × y' = k
```

### 特点

**优势：**
- ✅ 适合价格波动大的代币对（如 ETH/USDT, BTC/USDT）
- ✅ 支持大幅价格变动
- ✅ 流动性分布在整个价格曲线上
- ✅ 对价格发现友好

**劣势：**
- ❌ 稳定币对交易滑点较大
- ❌ 无常损失较高（价格偏离时）
- ❌ 资本效率相对较低（对于稳定资产）

### 适用场景
```
✅ SRT/WSRT   - 治理代币/包装代币
✅ STE/STF    - 两个不同项目代币
✅ ETH/USDT   - 主流币/稳定币
✅ Token/BNB  - 项目代币/主链币
```

### 滑点示例
```
池子储备: 1,000 ETH / 2,000,000 USDT
当前价格: 1 ETH = 2,000 USDT

交易 10 ETH → USDT:
输出: ~19,802 USDT
滑点: ~0.99% (相对价格 1,980.2 USDT)
```

---

## 🟢 稳定币池 (Stable Pool)

### 数学模型
使用 **StableSwap 曲线**（改进自 Curve Finance）

```solidity
// Pair.sol (contracts/core/Pair.sol:149-157)
function _k(uint x, uint y) internal view returns (uint) {
    if (stable) {
        uint _x = x * 1e18 / decimals0;
        uint _y = y * 1e18 / decimals1;
        uint _a = (_x * _y) / 1e18;
        uint _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
        return _a * _b / 1e18;  // ✅ x³y + y³x
    } else {
        return x * y;
    }
}
```

### 定价公式
```
x³y + y³x = k (改进的恒定和曲线)

该公式在 x ≈ y 时接近线性，远离时接近 x*y=k
```

### 特点

**优势：**
- ✅ 适合价格稳定的代币对（如 USDT/USDC, USDT/DAI）
- ✅ 极低滑点（在 1:1 附近）
- ✅ 资本效率高（流动性集中在目标价格）
- ✅ 无常损失极低（价格稳定）

**劣势：**
- ❌ 不适合价格波动大的代币对
- ❌ 价格严重偏离1:1时效率降低
- ❌ 不支持价格发现（假设价格应该稳定）

### 适用场景
```
✅ USDT/USDC  - 稳定币对
✅ USDT/DAI   - 稳定币对
✅ WBTC/renBTC - 锚定资产
✅ stETH/ETH  - 质押资产/原生资产
```

### 滑点示例
```
池子储备: 1,000,000 USDT / 1,000,000 USDC
当前价格: 1 USDT = 1 USDC

交易 10,000 USDT → USDC:
输出: ~9,998 USDC
滑点: ~0.02% (极低！)
```

---

## ⚖️ 对比总结

| 特性 | 波动性池 | 稳定币池 |
|------|----------|----------|
| **数学模型** | x × y = k | x³y + y³x = k |
| **适用资产** | 价格波动资产 | 价格稳定资产 |
| **滑点** | 较高 | 极低（1:1附近） |
| **资本效率** | 中等 | 高（稳定价格时） |
| **无常损失** | 较高 | 极低 |
| **价格发现** | 支持 | 不支持 |
| **手续费** | 0.3% | 0.3% |
| **代码标识** | `stable = false` | `stable = true` |

---

## 🧮 技术实现

### 创建池子时的差异

```javascript
// 创建波动性池
await router.addLiquidity(
  tokenA,
  tokenB,
  false,  // ✅ stable = false
  amountA,
  amountB,
  ...
)

// 创建稳定币池
await router.addLiquidity(
  tokenA,
  tokenB,
  true,   // ✅ stable = true
  amountA,
  amountB,
  ...
)
```

### 合约层面的判断

```solidity
// Factory.sol: getPair() 根据 stable 参数返回不同的池子
function getPair(
    address tokenA,
    address tokenB,
    bool stable
) external view returns (address pair)

// Pair.sol: _k() 函数根据 stable 使用不同公式
function _k(uint x, uint y) internal view returns (uint) {
    if (stable) {
        // StableSwap 曲线
        return x³y + y³x;
    } else {
        // 恒定乘积
        return x * y;
    }
}
```

---

## 📈 选择建议

### 使用波动性池的场景
```
✅ 代币价格会大幅波动
✅ 两个代币不是锚定关系
✅ 需要价格发现功能
✅ 项目代币与主流币配对

示例:
- SRT/BNB
- STE/STF
- STCX/SBF
- ETH/USDT (注意: 这里 ETH 价格波动)
```

### 使用稳定币池的场景
```
✅ 两个代币应该维持 1:1 或固定比率
✅ 稳定币之间的兑换
✅ 锚定资产（如 WBTC/renBTC）
✅ 质押资产与原生资产

示例:
- USDT/USDC
- USDT/DAI
- BUSD/USDT
- stETH/ETH
```

---

## 🔬 实际案例

### 案例1: STE/STF 配对

**场景**: 两个项目代币，价格独立波动

**选择**:
- **波动性池** ✅ 正确选择
  - 支持价格发现
  - 两个代币价格独立
  - 允许市场决定兑换比率

- **稳定币池** ❌ 错误选择
  - 假设价格应该 1:1（不符合实际）
  - 价格偏离时效率低
  - 不支持价格发现

### 案例2: 假设的 USDT/USDC 配对

**场景**: 两个稳定币，目标价格 1:1

**选择**:
- **波动性池** ❌ 不推荐
  - 滑点过高
  - 资本效率低
  - 交易成本高

- **稳定币池** ✅ 推荐
  - 滑点极低（~0.02%）
  - 资本效率高
  - 适合大额交易

---

## 💡 开发者提示

### 前端展示差异
```typescript
// 在 UI 中标识池子类型
interface PoolInfo {
  address: Address
  token0: string
  token1: string
  stable: boolean  // ✅ 关键字段
  reserve0: bigint
  reserve1: bigint
}

// 显示标签
<Badge variant={pool.stable ? 'info' : 'default'}>
  {pool.stable ? '稳定币池' : '波动性池'}
</Badge>
```

### 价格计算差异
```typescript
// 波动性池: 简单比率
const priceVolatile = reserve1 / reserve0

// 稳定币池: 考虑曲线
// 需要使用合约的 getAmountOut 函数获取准确价格
const priceStable = await pair.getAmountOut(amountIn, tokenIn)
```

---

## 📚 参考资料

- **Uniswap V2** (恒定乘积): https://uniswap.org/whitepaper.pdf
- **Curve Finance** (StableSwap): https://curve.fi/files/stableswap-paper.pdf
- **Solidly** (ve(3,3)模型): https://andrecronje.medium.com/

---

## 🎯 总结

选择正确的池子类型对于：
1. **用户体验**: 低滑点，快速交易
2. **资本效率**: 流动性提供者获得更好收益
3. **系统稳定性**: 价格稳定，减少套利机会

**记住黄金法则**:
- 价格应该稳定 → 稳定币池 🟢
- 价格会大幅波动 → 波动性池 🔵
