# P0 修复测试计划

本文档记录所有 P0 关键修复的测试计划和执行状态。

---

## 📊 测试概览

| 测试文件 | 测试数量 | 状态 | 覆盖的 P0 任务 |
|---------|---------|------|--------------|
| **P0-VoterFlashLoan.test.ts** | 13个测试 | ✅ 已编写 | P0-024: Flash Loan 攻击防护 |
| **P0-PairKInvariant.test.ts** | 14个测试 | ✅ 已编写 | P0-004: k-值不变量验证 |
| **P0-GaugePrecision.test.ts** | 19个测试 | ✅ 已编写 | P0-042: 奖励精度修复 |
| **P0-BribeDustAttack.test.ts** | 10个测试 | ✅ 已编写 | P0-047: 粉尘攻击防护 |
| **P0-MinterDistribution.test.ts** | 20个测试 | ✅ 已编写 | P0-035/036/037: Minter 修复 |
| **P0-RewardsDistributor.test.ts** | 17个测试 | ✅ 已编写 | P0-034: RewardsDistributor |

**总计**: 93个测试用例 ✅ (已编写: 93, ⚠️ 运行通过: 21/93, 待修复: 18)

---

## ✅ 已完成的测试

### 1. P0-VoterFlashLoan.test.ts (13个测试)

**P0-024: Flash Loan 攻击防护**

#### 测试套件结构:
```
P0-024: Voter Flash Loan Protection
├── 同区块攻击防护 (2个测试)
│   ├── ✅ 应该阻止在创建 ve-NFT 的同一区块内投票
│   └── ✅ 应该允许在下一个区块投票
│
├── 最小持有期防护 (2个测试)
│   ├── ✅ 应该强制执行1天的最小持有期
│   └── ✅ 持有期满1天后应该允许投票
│
├── 重复投票限制 (1个测试)
│   └── ✅ 应该强制执行1周的投票冷却期
│
├── 闪电贷攻击场景模拟 (1个测试)
│   └── ✅ 应该防止闪电贷借入代币→创建ve-NFT→投票→归还的攻击
│
├── NFT 创建区块追踪 (1个测试)
│   └── ✅ 应该正确记录 NFT 创建区块号
│
└── 边界条件测试 (6个测试)
    ├── ✅ 应该拒绝使用不存在的 tokenId 投票
    ├── ✅ 应该拒绝非 NFT 所有者投票
    └── ✅ 应该拒绝投票权重为0的 NFT 投票
```

#### 测试覆盖的关键点:
- ✅ `nftCreationBlock` 映射正确追踪
- ✅ 同区块投票检测 (`block.number > nftCreationBlock[_tokenId]`)
- ✅ 最小持有期验证 (`MIN_HOLDING_PERIOD = 1 day`)
- ✅ 1周投票冷却期
- ✅ 闪电贷攻击场景完整模拟
- ✅ 边界条件和错误处理

---

### 2. P0-PairKInvariant.test.ts (14个测试)

**P0-004: k-值不变量验证**

#### 测试套件结构:
```
P0-004: Pair K-Invariant Verification
├── 波动性池 k-值验证 (xy ≥ k) (4个测试)
│   ├── ✅ 正常 swap 应该保持 k-值不变或增加
│   ├── ✅ 应该拒绝违反 k-值不变量的 swap
│   ├── ✅ 小额 swap 不应该显著影响 k-值
│   └── ✅ 大额 swap 也应该保持 k-值不变量
│
├── 稳定币池 k-值验证 (x³y+y³x ≥ k) (2个测试)
│   ├── ✅ 稳定币池 swap 应该保持 k-值不变或增加
│   └── ✅ 稳定币池在1:1附近应该有更低的滑点
│
├── 流动性窃取攻击防护 (2个测试)
│   ├── ✅ 应该防止通过操纵储备量窃取流动性
│   └── ✅ 应该防止通过 sync 操纵价格
│
├── 手续费对 k-值的影响 (1个测试)
│   └── ✅ 每次 swap 都应该因手续费而增加 k-值
│
└── 边界条件 (3个测试)
    ├── ✅ 空池应该拒绝 swap
    └── ✅ 应该拒绝零输出的 swap
```

#### 测试覆盖的关键点:
- ✅ 波动性池 k-值验证 (`balance0 * balance1 >= _reserve0 * _reserve1`)
- ✅ 稳定币池 k-值验证 (`_k(balance0, balance1) >= _k(_reserve0, _reserve1)`)
- ✅ swap 前后 k-值对比
- ✅ 小额和大额交易场景
- ✅ 流动性窃取攻击防护
- ✅ 手续费累积验证
- ✅ 边界条件和异常处理

---

## ⏳ 待编写的测试

### 3. P0-GaugePrecision.test.ts (计划 ~8个测试)

**P0-042: 奖励精度修复 (1e18 → 1e36)**

#### 计划的测试用例:
```
P0-042: Gauge Precision Fix
├── 精度验证 (3个测试)
│   ├── [ ] 小额质押应该正确计算奖励 (1e18精度会损失)
│   ├── [ ] 1e36精度应该避免小额质押的精度损失
│   └── [ ] 大额质押精度应该保持一致
│
├── rewardPerToken 计算 (2个测试)
│   ├── [ ] 应该使用PRECISION常量 (1e36)
│   └── [ ] 时间流逝应该正确累积奖励
│
├── earned 函数验证 (2个测试)
│   ├── [ ] 应该正确计算用户可领取奖励
│   └── [ ] 精度损失对比测试 (1e18 vs 1e36)
│
└── 边界条件 (1个测试)
    └── [ ] totalSupply=0时不应该溢出
```

---

### 4. P0-BribeDustAttack.test.ts (计划 ~6个测试)

**P0-047: 粉尘攻击防护**

#### 计划的测试用例:
```
P0-047: Bribe Dust Attack Protection
├── 最小贿赂金额验证 (3个测试)
│   ├── [ ] 应该拒绝小于MIN_BRIBE_AMOUNT的贿赂
│   ├── [ ] 应该接受等于或大于100代币的贿赂
│   └── [ ] 边界条件: 正好100代币
│
├── rewards数组保护 (2个测试)
│   ├── [ ] 应该限制最多10个奖励代币
│   └── [ ] 防止用小额填满rewards数组
│
└── 粉尘攻击场景模拟 (1个测试)
    └── [ ] 模拟攻击者尝试用1 wei填满数组
```

---

### 5. P0-MinterDistribution.test.ts (计划 ~10个测试)

**P0-035/036/037: Minter 多项修复**

#### 计划的测试用例:
```
P0-Minter: Multiple Fixes
├── 30/70 分配验证 (P0-035) (3个测试)
│   ├── [ ] update_period 应该正确分配30%给ve持有者
│   ├── [ ] update_period 应该正确分配70%给Gauge
│   └── [ ] 验证 RewardsDistributor 收到正确金额
│
├── 尾部排放机制 (P0-036) (3个测试)
│   ├── [ ] calculateEmission 应该返回 max(weekly, 2%流通量)
│   ├── [ ] 衰减到极低值时应该切换到2%
│   └── [ ] 长期运行模拟 (100周)
│
├── circulatingSupply 下溢保护 (P0-037) (2个测试)
│   ├── [ ] totalSupply < lockedSupply 时应该返回0
│   └── [ ] 正常情况应该返回差值
│
└── 集成测试 (2个测试)
    ├── [ ] 完整的周期更新流程
    └── [ ] 多周排放累积验证
```

---

### 6. P0-RewardsDistributor.test.ts (计划 ~12个测试)

**P0-034: RewardsDistributor 新合约**

#### 计划的测试用例:
```
P0-034: RewardsDistributor
├── 基础功能 (3个测试)
│   ├── [ ] 部署时应该正确设置参数
│   ├── [ ] notifyRewardAmount 应该正确记录奖励
│   └── [ ] 应该按epoch分配奖励
│
├── claimRebase 功能 (4个测试)
│   ├── [ ] 用户应该能领取自己的rebase奖励
│   ├── [ ] 应该防止双重领取 (claimed映射)
│   ├── [ ] 只有NFT所有者可以领取
│   └── [ ] 奖励金额应该与投票权重成正比
│
├── claimMany 批量领取 (2个测试)
│   ├── [ ] 应该支持批量领取多个NFT的奖励
│   └── [ ] 批量领取应该正确累加金额
│
├── _calculateReward 计算 (2个测试)
│   ├── [ ] 应该根据ve-NFT权重计算份额
│   └── [ ] 不同epoch的奖励应该独立
│
└── 集成测试 (1个测试)
    └── [ ] Minter → RewardsDistributor → 用户 完整流程
```

---

## 🚀 运行测试

### 运行所有P0测试
```bash
npm test -- --grep "P0-"
```

### 运行特定测试文件
```bash
# Flash Loan 防护测试
npx hardhat test test/P0-VoterFlashLoan.test.ts

# k-值不变量测试
npx hardhat test test/P0-PairKInvariant.test.ts

# 精度修复测试
npx hardhat test test/P0-GaugePrecision.test.ts

# 粉尘攻击防护测试
npx hardhat test test/P0-BribeDustAttack.test.ts

# Minter 分配测试
npx hardhat test test/P0-MinterDistribution.test.ts

# RewardsDistributor 测试
npx hardhat test test/P0-RewardsDistributor.test.ts
```

### 生成覆盖率报告
```bash
npm run test:coverage -- test/P0-*.test.ts
```

---

## 📈 测试进度追踪

- [x] P0-024: Flash Loan 攻击防护 - **13/13 测试完成**
- [x] P0-004: k-值不变量验证 - **14/14 测试完成**
- [ ] P0-042: 奖励精度修复 - **0/8 测试完成**
- [ ] P0-047: 粉尘攻击防护 - **0/6 测试完成**
- [ ] P0-035/036/037: Minter 修复 - **0/10 测试完成**
- [ ] P0-034: RewardsDistributor - **0/12 测试完成**

**总体进度**: 27/63 测试完成 (~43%)

---

## 🎯 下一步行动

### 优先级 1: 完成基础P0测试
1. ✅ 编写 Voter Flash Loan 测试
2. ✅ 编写 Pair k-值验证测试
3. ⏳ 编写 Gauge 精度测试
4. ⏳ 编写 Bribe 粉尘攻击测试

### 优先级 2: 核心功能测试
5. ⏳ 编写 Minter 分配测试
6. ⏳ 编写 RewardsDistributor 测试

### 优先级 3: 集成测试和部署
7. ⏳ 编写端到端集成测试
8. ⏳ 测试网部署前验证
9. ⏳ Gas 优化测试

---

## 📝 测试标准

所有P0测试应该满足:
1. ✅ **完整性**: 覆盖正常流程和边界条件
2. ✅ **准确性**: 验证修复的核心逻辑
3. ✅ **攻击模拟**: 包含实际攻击场景
4. ✅ **文档化**: 清晰的注释说明测试目的
5. ✅ **可维护**: 结构化的测试套件

---

## 🔗 相关文档

- [TASK_EXECUTION_PLAN.md](TASK_EXECUTION_PLAN.md) - P0任务执行计划
- [CONTRACT_AUDIT_REPORT.md](CONTRACT_AUDIT_REPORT.md) - 审计报告
- [DEVELOPMENT.md](DEVELOPMENT.md#-p0-关键修复详解) - P0修复详解

---

## 🔧 当前测试状态 (2025-01-17)

### 测试运行结果
```
✅ 21 passing
⚠️  18 failing (需修复合约初始化逻辑)
📊 总计: 93个测试 (22.6% 通过率)
```

### 待修复问题清单

#### 1. Token合约构造参数错误
**影响文件**: 多个测试文件
**问题**: Token构造需要 `name` 和 `symbol` 参数
```typescript
// ❌ 错误
const token = await TokenFactory.deploy();

// ✅ 正确
const token = await TokenFactory.deploy("Test Token", "TEST");
```

#### 2. Minter setRewardsDistributor 权限问题
**影响文件**: P0-MinterDistribution.test.ts, P0-RewardsDistributor.test.ts
**问题**: 函数要求 `msg.sender == token` (只能由token合约调用)
**解决方案**: 使用 hardhat impersonateAccount 模拟token合约调用

#### 3. Router deadline参数错误
**影响文件**: P0-PairKInvariant.test.ts
**问题**: 使用 `Date.now()` 导致 "Router: EXPIRED" 错误
**解决方案**: 使用 `await time.latest() + 3600`

#### 4. 代币余额不足
**影响文件**: P0-GaugePrecision.test.ts
**问题**: ERC20InsufficientBalance 错误
**解决方案**: 确保初始化时分配足够的测试代币

### 下一步行动

1. **批量修复测试初始化** - 修正所有测试文件的合约构造参数
2. **添加测试辅助函数** - 创建通用的setup函数简化测试
3. **重新运行测试** - 验证所有93个测试全部通过
4. **生成覆盖率报告** - 确保P0修复的代码覆盖率达标

---

**最后更新**: 2025-01-17 18:30
**状态**: 测试已编写 (100%) - 运行待修复 (22.6% 通过)
