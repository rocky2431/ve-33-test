# 📋 ve(3,3) DEX 原子级改进任务清单

**版本:** v1.0
**创建日期:** 2025-01-16
**总任务数:** 247个
**预估总工时:** 40-50工作日

---

## 📊 任务分类统计

| 优先级 | 任务数 | 工时 | 说明 |
|--------|--------|------|------|
| **P0 - 立即修复** | 45 | 8-10天 | 关键安全问题和代币经济学 |
| **P1 - 高优先级** | 68 | 12-15天 | 重要功能和架构优化 |
| **P2 - 中优先级** | 82 | 15-18天 | 功能完善和优化 |
| **P3 - 低优先级** | 52 | 5-7天 | 文档和nice-to-have功能 |

| 类别 | 任务数 | 占比 |
|------|--------|------|
| 智能合约修复 | 128 | 52% |
| 前端开发 | 56 | 23% |
| 测试编写 | 38 | 15% |
| 文档更新 | 25 | 10% |

---

## 🔴 P0 - 立即修复 (8-10天)

### Token.sol (3个任务)

#### [P0-001] 添加初始供应铸造
- **工时:** 0.5小时
- **文件:** `contracts/core/Token.sol:24-28`
- **修改:**
  ```solidity
  constructor(string memory _name, string memory _symbol)
      ERC20(_name, _symbol) Ownable(msg.sender) {
      _mint(msg.sender, 20_000_000 * 1e18); // ✅ 添加此行
  }
  ```
- **测试:** 验证totalSupply() == 20M
- **依赖:** 无
- **验收标准:** 部署后totalSupply()返回20_000_000 * 1e18

#### [P0-002] 实现burn函数
- **工时:** 0.5小时
- **修改:**
  ```solidity
  function burn(uint256 amount) external {
      _burn(msg.sender, amount);
  }
  ```
- **测试:** 销毁代币后余额减少
- **依赖:** P0-001

#### [P0-003] 添加Mint事件
- **工时:** 0.5小时
- **修改:** 在mint函数中emit Mint事件
- **测试:** 监听事件触发

---

### Pair.sol (12个任务)

#### [P0-004] 添加swap后k值验证 ⭐⭐⭐⭐⭐
- **工时:** 2小时
- **文件:** `contracts/core/Pair.sol:189-219`
- **严重性:** CRITICAL
- **修改:**
  ```solidity
  function swap(...) external nonReentrant {
      // ... 现有逻辑 ...

      // ✅ 添加k值验证
      uint256 kLast = _k(_reserve0, _reserve1);
      uint256 kNew = _k(balance0, balance1);
      require(kNew >= kLast, "Pair: K_INVARIANT_VIOLATED");

      _update(balance0, balance1);
      emit Swap(...);
  }
  ```
- **测试:**
  - 正常swap应通过
  - 恶意swap应revert
  - 模糊测试1000+次
- **依赖:** 无
- **验收标准:** 所有swap保持k值不变性

#### [P0-005] 优化手续费计算精度
- **工时:** 1.5小时
- **文件:** `contracts/core/Pair.sol:229`
- **修改:**
  ```solidity
  // 当前: amountIn = amountIn - ((amountIn * 30) / 10000);
  // 修改为:
  uint256 amountInWithFee = amountIn * 997; // 0.997 = 1 - 0.003
  uint256 numerator = amountInWithFee * reserveOut;
  uint256 denominator = reserveIn * 1000 + amountInWithFee;
  amountOut = numerator / denominator;
  ```
- **测试:** 对比小额和大额交易的手续费
- **依赖:** 无

#### [P0-006] 添加手续费累积逻辑
- **工时:** 1.5小时
- **修改:** 在swap中正确累积手续费到claimable0/claimable1
- **测试:** 验证手续费正确累积
- **依赖:** P0-005

#### [P0-007] 修复_k函数精度
- **工时:** 1小时
- **文件:** `contracts/core/Pair.sol:262-268`
- **修改:** 使用更高精度计算
- **测试:** 对比Velodrome的_k计算结果
- **依赖:** 无

#### [P0-008] 优化_get_y迭代次数
- **工时:** 2小时
- **文件:** `contracts/core/Pair.sol:273-295`
- **修改:**
  - 最大迭代从255降至25
  - 优化初始猜测值
  - 添加提前退出条件
- **测试:** gas使用量对比
- **依赖:** 无

#### [P0-009] 添加skim函数
- **工时:** 1小时
- **修改:**
  ```solidity
  function skim(address to) external nonReentrant {
      uint256 balance0 = IERC20(token0).balanceOf(address(this));
      uint256 balance1 = IERC20(token1).balanceOf(address(this));
      IERC20(token0).safeTransfer(to, balance0 - reserve0 - claimable0);
      IERC20(token1).safeTransfer(to, balance1 - reserve1 - claimable1);
  }
  ```
- **测试:** 意外转入代币后可以skim
- **依赖:** 无

#### [P0-010] 添加sync函数
- **工时:** 0.5小时
- **修改:**
  ```solidity
  function sync() external nonReentrant {
      _update(
          IERC20(token0).balanceOf(address(this)) - claimable0,
          IERC20(token1).balanceOf(address(this)) - claimable1
      );
  }
  ```
- **测试:** 同步后reserve正确
- **依赖:** 无

#### [P0-011-015] 其他Pair.sol修复
- 添加min操作保护 (1h)
- 修复metadata返回值 (0.5h)
- 优化storage布局 (1h)
- 添加紧急暂停 (1.5h)
- 完善事件 (1h)

---

### VotingEscrow.sol (8个任务)

#### [P0-016] 实现permanent lock支持 ⭐⭐⭐⭐
- **工时:** 3小时
- **文件:** `contracts/governance/VotingEscrow.sol:104-122`
- **严重性:** HIGH
- **修改:**
  ```solidity
  bool public immutable supportPermanentLock = false; // 初始禁用

  function create_lock(uint256 _value, uint256 _lockDuration, bool _permanent)
      external nonReentrant returns (uint256) {

      uint256 unlockTime;
      if (_permanent) {
          require(supportPermanentLock, "VotingEscrow: permanent lock disabled");
          unlockTime = type(uint256).max;
      } else {
          require(_lockDuration >= MIN_LOCK_DURATION, "...");
          require(_lockDuration <= MAX_LOCK_DURATION, "...");
          unlockTime = _floorToWeek(block.timestamp + _lockDuration);
      }

      // ... 继续现有逻辑 ...
  }
  ```
- **测试:**
  - permanent lock创建成功
  - 不能提取permanent lock
  - 只有授权地址可创建permanent lock
- **依赖:** 无
- **验收标准:** permanent lock NFT可创建但无法提取

#### [P0-017] 修复slope计算溢出
- **工时:** 2小时
- **文件:** `contracts/governance/VotingEscrow.sol:234-242`
- **修改:** 使用SafeCast保护
- **测试:** 极端值不会溢出
- **依赖:** 无

#### [P0-018] 优化merge权重计算
- **工时:** 2.5小时
- **文件:** `contracts/governance/VotingEscrow.sol:413-435`
- **修改:** 按投票权重合并而非简单相加
- **测试:** merge后投票权正确
- **依赖:** 无

#### [P0-019] 修复split投票权损失
- **工时:** 2小时
- **文件:** `contracts/governance/VotingEscrow.sol:442-461`
- **修改:** 确保检查点时间一致
- **测试:** split前后总投票权不变
- **依赖:** 无

#### [P0-020-023] 其他VotingEscrow修复
- 添加creationBlock记录 (1h)
- 优化userPointHistory存储 (2h)
- 添加批量查询函数 (1.5h)
- 完善事件 (1h)

---

### Voter.sol (10个任务)

#### [P0-024] 添加Flash Loan攻击防护 ⭐⭐⭐⭐⭐
- **工时:** 3小时
- **文件:** `contracts/governance/Voter.sol:128-179`
- **严重性:** CRITICAL
- **修改:**
  ```solidity
  mapping(uint256 => uint256) public veNFTCreationBlock;

  function vote(uint256 _tokenId, ...) external nonReentrant {
      require(IERC721(ve).ownerOf(_tokenId) == msg.sender, "Voter: not owner");

      // ✅ 防止同区块创建+投票
      uint256 creationBlock = IVotingEscrow(ve).user PointHistory(_tokenId)[0].blk;
      require(block.number > creationBlock, "Voter: cannot vote in creation block");

      // ✅ 最小持有期(1天)
      require(
          block.timestamp >= lastVoted[_tokenId] + 1 days || lastVoted[_tokenId] == 0,
          "Voter: minimum holding period"
      );

      // ... 继续现有逻辑 ...
  }
  ```
- **测试:**
  - 同区块创建和投票应失败
  - flash loan攻击应失败
  - 正常投票应成功
- **依赖:** P0-020 (VotingEscrow记录creationBlock)
- **验收标准:** 无法通过flash loan操纵投票

#### [P0-025] 优化distribute精度
- **工时:** 2.5小时
- **文件:** `contracts/governance/Voter.sol:236-252`
- **修改:** 添加claimable累积机制
- **测试:** 小额分配不丢失
- **依赖:** 无

#### [P0-026] 添加reset批量处理
- **工时:** 2小时
- **文件:** `contracts/governance/Voter.sol:104-120`
- **修改:** 实现resetBatch避免gas耗尽
- **测试:** 投票10个池后可以reset
- **依赖:** 无

#### [P0-027-033] 其他Voter修复
- 添加最小TVL检查 (1h)
- 实现Gauge白名单 (1.5h)
- 添加投票历史记录 (2h)
- 优化distributeAll gas (2h)
- 添加紧急暂停 (1.5h)
- 完善事件 (1h)
- 添加access control (2h)

---

### Minter.sol (8个任务)

#### [P0-034] 创建RewardsDistributor合约 ⭐⭐⭐⭐⭐
- **工时:** 6小时
- **新文件:** `contracts/governance/RewardsDistributor.sol`
- **严重性:** CRITICAL
- **代码:**
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.20;

  contract RewardsDistributor is ReentrancyGuard {
      address public immutable votingEscrow;
      address public immutable token;
      address public minter;

      uint256 public constant WEEK = 7 days;

      // epoch => token数量
      mapping(uint256 => uint256) public tokensPerEpoch;

      // tokenId => epoch => 是否已领取
      mapping(uint256 => mapping(uint256 => bool)) public claimed;

      event RewardAdded(uint256 indexed epoch, uint256 amount);
      event RebaseClaimed(uint256 indexed tokenId, uint256 indexed epoch, uint256 reward);

      constructor(address _ve, address _token) {
          votingEscrow = _ve;
          token = _token;
      }

      function setMinter(address _minter) external {
          require(minter == address(0), "already set");
          minter = _minter;
      }

      function notifyRewardAmount(uint256 amount) external {
          require(msg.sender == minter, "not minter");

          uint256 epoch = block.timestamp / WEEK;
          tokensPerEpoch[epoch] = amount;

          IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

          emit RewardAdded(epoch, amount);
      }

      function claimRebase(uint256 tokenId) external nonReentrant {
          require(IERC721(votingEscrow).ownerOf(tokenId) == msg.sender, "not owner");

          uint256 epoch = block.timestamp / WEEK;
          require(!claimed[tokenId][epoch], "already claimed");

          uint256 userPower = IVotingEscrow(votingEscrow).balanceOfNFT(tokenId);
          uint256 totalPower = IVotingEscrow(votingEscrow).totalSupply();

          uint256 reward = (tokensPerEpoch[epoch] * userPower) / totalPower;

          claimed[tokenId][epoch] = true;

          IERC20(token).safeTransfer(msg.sender, reward);

          emit RebaseClaimed(tokenId, epoch, reward);
      }

      function claimMany(uint256[] calldata tokenIds) external {
          for (uint256 i = 0; i < tokenIds.length; i++) {
              this.claimRebase(tokenIds[i]);
          }
      }
  }
  ```
- **测试:**
  - rebase正确分配
  - 不能重复领取
  - 权重计算正确
- **依赖:** 无
- **验收标准:** ve持有者可领取30%排放

#### [P0-035] 修复Minter分配逻辑 ⭐⭐⭐⭐⭐
- **工时:** 2小时
- **文件:** `contracts/governance/Minter.sol:120-142`
- **严重性:** CRITICAL
- **修改:**
  ```solidity
  address public rewardsDistributor;

  function setRewardsDistributor(address _rd) external {
      require(msg.sender == token, "not token");
      require(rewardsDistributor == address(0), "already set");
      rewardsDistributor = _rd;
  }

  function update_period() external returns (uint256) {
      uint256 _emission = _updatePeriod();

      if (_emission > 0) {
          // 30% 给 ve 持有者
          uint256 _forVe = (_emission * VE_DISTRIBUTION) / 100;

          // 70% 给流动性提供者
          uint256 _forGauges = _emission - _forVe;

          // 铸造代币
          IToken(token).mint(address(this), _emission);

          // ✅ 分配给ve持有者
          if (rewardsDistributor != address(0)) {
              IERC20(token).transfer(rewardsDistributor, _forVe);
              IRewardsDistributor(rewardsDistributor).notifyRewardAmount(_forVe);
          }

          // ✅ 分配给LP提供者
          if (voter != address(0)) {
              IERC20(token).transfer(voter, _forGauges);
              IVoter(voter).notifyRewardAmount(_forGauges);
          }

          emit Mint(msg.sender, _emission, _forVe, _forGauges);
      }

      return _emission;
  }
  ```
- **测试:**
  - 30/70分配正确
  - rebase可领取
  - Gauge获得70%
- **依赖:** P0-034
- **验收标准:** 排放按30/70正确分配

#### [P0-036] 添加尾部排放
- **工时:** 1.5小时
- **文件:** `contracts/governance/Minter.sol:78-80`
- **修改:**
  ```solidity
  uint256 public constant TAIL_EMISSION_RATE = 200; // 2%
  uint256 public constant TAIL_EMISSION_BASE = 10000;

  function calculateEmission() public view returns (uint256) {
      uint256 _circulating = circulatingSupply();
      uint256 _baseEmission = weekly;

      // 尾部排放 = 流通供应 × 2%
      uint256 _tailEmission = (_circulating * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;

      // 返回较大值
      return _baseEmission > _tailEmission ? _baseEmission : _tailEmission;
  }
  ```
- **测试:** 长期模拟不会归0
- **依赖:** 无
- **验收标准:** 排放永远 >= 流通供应的2%

#### [P0-037] 修复circulatingSupply下溢
- **工时:** 0.5小时
- **文件:** `contracts/governance/Minter.sol:71-73`
- **修改:**
  ```solidity
  function circulatingSupply() public view returns (uint256) {
      uint256 _total = IERC20(token).totalSupply();
      uint256 _locked = IVotingEscrow(ve).supply();
      return _total > _locked ? _total - _locked : 0;
  }
  ```
- **测试:** supply > totalSupply时不会revert
- **依赖:** 无

#### [P0-038-041] 其他Minter修复
- 添加start事件 (0.5h)
- 优化weekly更新逻辑 (1h)
- 添加紧急铸造函数 (1.5h)
- 完善事件 (1h)

---

### Gauge.sol (5个任务)

#### [P0-042] 修复奖励计算精度 ⭐⭐⭐⭐
- **工时:** 2小时
- **文件:** `contracts/governance/Gauge.sol:96-103`
- **严重性:** HIGH
- **修改:**
  ```solidity
  uint256 public constant PRECISION = 1e36; // 更高精度

  function rewardPerToken(address token) public view returns (uint256) {
      if (totalSupply == 0) {
          return rewardData[token].rewardPerTokenStored;
      }

      uint256 timeElapsed = lastTimeRewardApplicable(token) - rewardData[token].lastUpdateTime;
      uint256 reward = (timeElapsed * rewardData[token].rewardRate * PRECISION) / totalSupply;

      return rewardData[token].rewardPerTokenStored + reward;
  }
  ```
- **测试:** 小额质押时奖励准确
- **依赖:** 无
- **验收标准:** 精度损失 < 0.01%

#### [P0-043] 添加最小奖励验证
- **工时:** 1小时
- **文件:** `contracts/governance/Gauge.sol:216-246`
- **修改:**
  ```solidity
  uint256 public constant MIN_REWARD_AMOUNT = 1e18;

  function notifyRewardAmount(address token, uint256 reward) external nonReentrant {
      require(reward >= MIN_REWARD_AMOUNT, "Gauge: reward too small");

      uint256 _rewardRate = reward / DURATION;
      require(_rewardRate > 0, "Gauge: reward rate too low");

      // ... 继续逻辑 ...
  }
  ```
- **测试:** 小额奖励应revert
- **依赖:** 无

#### [P0-044-046] 其他Gauge修复
- 添加紧急提取函数 (2h)
- 优化getReward gas (1.5h)
- 添加按索引领取 (1h)

---

### Bribe.sol (3个任务)

#### [P0-047] 添加最小贿赂金额 ⭐⭐⭐⭐
- **工时:** 1小时
- **文件:** `contracts/governance/Bribe.sol:186-219`
- **严重性:** HIGH
- **修改:**
  ```solidity
  uint256 public constant MIN_BRIBE_AMOUNT = 100 * 1e18;

  function notifyRewardAmount(address token, uint256 amount) external nonReentrant {
      require(amount >= MIN_BRIBE_AMOUNT, "Bribe: amount too small");
      // ... 继续逻辑 ...
  }
  ```
- **测试:** 小额贿赂应revert
- **依赖:** 无
- **验收标准:** 无法用粉尘攻击

#### [P0-048-049] 其他Bribe修复
- 优化检查点数组 (2h)
- 修复balanceOfAt逻辑 (1.5h)

---

## 🟠 P1 - 高优先级 (12-15天)

### 架构重构 (18个任务)

#### [P1-050] 创建独立PoolFees合约
- **工时:** 6小时
- **新文件:** `contracts/core/PoolFees.sol`
- **代码:**
  ```solidity
  contract PoolFees {
      address public immutable pool;
      address public immutable gauge;
      address public immutable token0;
      address public immutable token1;

      mapping(uint256 => uint256) public fees0PerEpoch;
      mapping(uint256 => uint256) public fees1PerEpoch;

      function claimFeesFor(address recipient) external returns (uint256, uint256) {
          require(msg.sender == gauge, "not gauge");

          (uint256 claimed0, uint256 claimed1) = IPool(pool).claimFees();

          uint256 epoch = block.timestamp / WEEK;
          fees0PerEpoch[epoch] += claimed0;
          fees1PerEpoch[epoch] += claimed1;

          if (claimed0 > 0) IERC20(token0).safeTransfer(recipient, claimed0);
          if (claimed1 > 0) IERC20(token1).safeTransfer(recipient, claimed1);

          emit FeesClaimed(epoch, recipient, claimed0, claimed1);

          return (claimed0, claimed1);
      }
  }
  ```
- **依赖:** 无
- **验收标准:** 手续费独立管理

#### [P1-051] 重构Pair.sol手续费逻辑
- **工时:** 4小时
- **修改:** 移除claimable0/claimable1,改为调用PoolFees
- **依赖:** P1-050

#### [P1-052-067] 其他P1架构任务
- 实现Factory自动创建Gauge (3h)
- 添加白名单机制 (2h)
- 实现多签+时间锁 (6h)
- 添加紧急暂停系统 (4h)
- ... (共18个任务)

---

### 功能增强 (25个任务)

#### [P1-068] 实现EIP-2612 Permit
- **工时:** 4小时
- **文件:** `contracts/core/Token.sol, Pair.sol`
- **修改:** 继承ERC20Permit
- **依赖:** 无

#### [P1-069-092] 其他P1功能任务
- 添加quoteRemoveLiquidity (2h)
- 实现removeLiquidityETH (2.5h)
- 添加delegateBySig (3h)
- 优化路径验证 (2h)
- ... (共25个任务)

---

### 前端开发 (25个任务)

#### [P1-093] 实现Vote模块链上数据
- **工时:** 8小时
- **文件:** `frontend/src/components/Vote/index.tsx`
- **功能:**
  - 获取所有Gauge列表
  - 查询池子投票权重
  - 实现投票功能
  - 显示用户投票分配
- **依赖:** 无
- **验收标准:** 移除所有模拟数据

#### [P1-094] 实现Rewards模块链上数据
- **工时:** 8小时
- **文件:** `frontend/src/components/Rewards/index.tsx`
- **功能:**
  - 查询Gauge奖励
  - 查询Bribe奖励
  - 查询Rebase奖励
  - 实现批量领取
- **依赖:** P0-034 (RewardsDistributor)
- **验收标准:** 显示真实奖励数据

#### [P1-095-117] 其他P1前端任务
- 添加交易历史 (6h)
- 优化React Query配置 (2h)
- 实现批量RPC调用 (4h)
- 添加虚拟滚动 (3h)
- 优化错误处理 (4h)
- ... (共25个任务)

---

## 🟡 P2 - 中优先级 (15-18天)

### 测试覆盖 (38个任务)

#### [P2-118] Token.sol单元测试
- **工时:** 4小时
- **文件:** `test/core/Token.test.ts`
- **覆盖:**
  - 初始供应测试
  - mint权限测试
  - burn功能测试
  - 所有edge cases
- **依赖:** P0-001-003
- **验收标准:** 100%覆盖率

#### [P2-119] Pair.sol单元测试
- **工时:** 12小时
- **文件:** `test/core/Pair.test.ts`
- **覆盖:**
  - mint/burn流动性
  - swap功能
  - k值验证
  - 手续费计算
  - 稳定币曲线
  - 所有revert情况
- **依赖:** P0-004-015
- **验收标准:** 100%覆盖率

#### [P2-120-155] 其他P2测试任务
- VotingEscrow单元测试 (10h)
- Voter单元测试 (8h)
- Minter单元测试 (6h)
- Gauge单元测试 (8h)
- Bribe单元测试 (6h)
- RewardsDistributor单元测试 (6h)
- PoolFees单元测试 (4h)
- 集成测试 (12h)
- 模糊测试 (8h)
- Gas优化测试 (4h)
- ... (共38个任务)

---

### 优化与完善 (30个任务)

#### [P2-156] 优化storage布局
- **工时:** 6小时
- **所有合约**
- **内容:** 重新排列变量减少storage slot
- **依赖:** 无
- **预期:** 节省20-30% gas

#### [P2-157-185] 其他P2优化任务
- 批量操作优化 (4h)
- 循环优化 (3h)
- 函数可见性优化 (2h)
- Constant/Immutable优化 (2h)
- 事件优化 (2h)
- ... (共30个任务)

---

### 功能扩展 (14个任务)

#### [P2-186] Managed veNFT支持
- **工时:** 12小时
- **新功能:** 委托投票机制
- **依赖:** 完成P0/P1任务
- **优先级:** 可选

#### [P2-187-199] 其他P2功能任务
- 跨链桥接准备 (8h)
- DAO治理模块 (10h)
- 参数动态调整 (6h)
- Oracle集成 (8h)
- ... (共14个任务)

---

## ⚪ P3 - 低优先级 (5-7天)

### 文档更新 (25个任务)

#### [P3-200] 更新README.md
- **工时:** 2小时
- **内容:**
  - 更新功能列表
  - 添加RewardsDistributor说明
  - 更新架构图
  - 完善使用指南
- **依赖:** 完成P0任务

#### [P3-201] 更新DEVELOPMENT.md
- **工时:** 3小时
- **内容:**
  - 更新合约架构
  - 添加新合约文档
  - 更新测试指南
  - 完善贡献指南

#### [P3-202] 更新DEPLOYMENT.md
- **工时:** 2小时
- **内容:**
  - 更新部署步骤
  - 添加RewardsDistributor部署
  - 更新验证命令
  - 完善故障排除

#### [P3-203-224] 其他P3文档任务
- 创建API文档 (4h)
- 编写合约注释 (6h)
- 生成NatSpec文档 (3h)
- 创建用户手册 (4h)
- 编写审计准备文档 (3h)
- ... (共25个任务)

---

### 审计准备 (15个任务)

#### [P3-225] 生成Slither报告
- **工时:** 2小时
- **命令:** `slither . --print all`
- **修复:** 所有HIGH/MEDIUM问题
- **依赖:** 完成P0/P1修复

#### [P3-226-239] 其他P3审计任务
- Mythril扫描 (2h)
- Echidna模糊测试 (4h)
- 形式化验证准备 (6h)
- 审计报告模板 (2h)
- Bug赏金计划 (3h)
- ... (共15个任务)

---

### 优化建议 (12个任务)

#### [P3-240-247] Nice-to-have功能
- 添加事件索引 (1h)
- 优化错误消息 (2h)
- 添加view函数 (2h)
- 实现批量查询 (3h)
- 添加统计功能 (2h)
- 优化前端性能 (4h)
- 添加分析工具 (3h)
- 实现导出功能 (2h)
- ... (共12个任务)

---

## 📊 执行计划

### Week 1-2: P0紧急修复

**目标:** 修复所有CRITICAL问题

- Day 1-2: Token + Pair关键修复
- Day 3-4: VotingEscrow + Voter
- Day 5-7: Minter + RewardsDistributor + Gauge + Bribe
- Day 8-10: 单元测试P0修复

**交付:**
- ✅ k值验证
- ✅ Flash loan防护
- ✅ Rebase机制
- ✅ 尾部排放
- ✅ 初始供应

### Week 3-4: P1高优先级

**目标:** 架构优化和功能完善

- Day 11-13: PoolFees重构
- Day 14-16: Permanent lock + 白名单
- Day 17-20: 前端Vote/Rewards模块
- Day 21-24: P1单元测试

**交付:**
- ✅ 独立PoolFees
- ✅ Permanent lock
- ✅ 前端真实数据
- ✅ 重要功能测试

### Week 5-6: P2中优先级

**目标:** 测试覆盖和优化

- Day 25-28: 完整单元测试
- Day 29-32: 集成测试+模糊测试
- Day 33-36: Gas优化
- Day 37-40: 文档更新

**交付:**
- ✅ 100%测试覆盖
- ✅ Gas优化20-30%
- ✅ 完整文档

### Week 7-8: P3低优先级

**目标:** 审计准备和优化

- Day 41-44: 静态分析修复
- Day 45-48: 审计文档准备
- Day 49-50: 最终检查

**交付:**
- ✅ 审计准备完成
- ✅ Bug赏金计划
- ✅ 生产就绪

---

## ✅ 验收标准

### P0完成标准

- [ ] 所有8个HIGH级别漏洞已修复
- [ ] RewardsDistributor合约已部署
- [ ] Minter双重分配正常工作
- [ ] 初始供应正确铸造
- [ ] 尾部排放机制生效
- [ ] 单元测试覆盖所有P0修复
- [ ] 本地测试网验证通过

### P1完成标准

- [ ] PoolFees独立合约已实现
- [ ] Permanent lock功能可用
- [ ] 前端Vote/Rewards模块无模拟数据
- [ ] 所有P1功能有单元测试
- [ ] 集成测试通过

### P2完成标准

- [ ] 测试覆盖率 >= 95%
- [ ] 模糊测试运行1000+次无错误
- [ ] Gas优化达到预期
- [ ] 文档完整更新
- [ ] Code review完成

### P3完成标准

- [ ] Slither无HIGH/MEDIUM问题
- [ ] Mythril扫描通过
- [ ] 审计文档完整
- [ ] Bug赏金计划启动
- [ ] 准备外部审计

---

## 📞 使用说明

### 如何使用本清单

1. **按优先级执行**
   - 先完成所有P0任务
   - 再进行P1任务
   - 最后处理P2/P3

2. **标记进度**
   - 在任务前添加 `[x]` 表示完成
   - 使用Git commit关联任务ID
   - 定期review完成情况

3. **并行开发**
   - 多人团队可并行处理不同合约
   - 注意依赖关系
   - 定期集成测试

4. **质量保证**
   - 每个任务完成后立即测试
   - Code review所有修改
   - 保持文档同步更新

---

**清单创建日期:** 2025-01-16
**预估完成日期:** 2025-03-01 (6-8周)
**成功率:** 90%+ (如严格执行)

---
