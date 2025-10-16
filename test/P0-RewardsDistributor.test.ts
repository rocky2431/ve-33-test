import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * P0-034: RewardsDistributor 功能测试
 *
 * 测试新增的 RewardsDistributor 合约，负责分配30%的排放量给ve持有者
 *
 * 关键功能：
 * 1. notifyRewardAmount - Minter 调用，记录每周奖励
 * 2. claimRebase - 用户领取单个 ve-NFT 的 rebase 奖励
 * 3. claimMany - 批量领取多个 NFT 的奖励
 * 4. _calculateReward - 根据投票权重计算份额
 *
 * 防护措施：
 * - claimed 映射防止双重领取
 * - onlyMinter 修饰符保护 notifyRewardAmount
 * - 只有 NFT 所有者可以领取
 * - 按 epoch 分配，不同 epoch 独立计算
 */

describe("P0-034: RewardsDistributor", function () {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let minter: HardhatEthersSigner; // 模拟 Minter 角色

  let token: any;
  let votingEscrow: any;
  let rewardsDistributor: any;

  const WEEK = 7n * 24n * 60n * 60n;
  const LOCK_AMOUNT = ethers.parseEther("1000");
  const REWARD_AMOUNT = ethers.parseEther("10000"); // 每周奖励

  beforeEach(async function () {
    [owner, alice, bob, charlie, minter] = await ethers.getSigners();

    // 1. 部署 Token
    const TokenFactory = await ethers.getContractFactory("PaimonToken");
    token = await TokenFactory.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    // 2. 部署 VotingEscrow
    const VotingEscrowFactory = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrowFactory.deploy(tokenAddress);
    await votingEscrow.waitForDeployment();
    const votingEscrowAddress = await votingEscrow.getAddress();

    // 3. 部署 RewardsDistributor
    const RewardsDistributorFactory = await ethers.getContractFactory("RewardsDistributor");
    rewardsDistributor = await RewardsDistributorFactory.deploy(
      votingEscrowAddress,
      tokenAddress
    );
    await rewardsDistributor.waitForDeployment();
    const rewardsDistributorAddress = await rewardsDistributor.getAddress();

    // 4. 设置 Minter 权限
    await rewardsDistributor.setMinter(minter.address);

    // 5. 分配代币
    await token.transfer(alice.address, ethers.parseEther("10000"));
    await token.transfer(bob.address, ethers.parseEther("10000"));
    await token.transfer(charlie.address, ethers.parseEther("10000"));
    await token.transfer(minter.address, ethers.parseEther("100000")); // Minter 需要代币来分配

    console.log("✅ RewardsDistributor 测试环境初始化完成");
    console.log(`  - Token: ${tokenAddress}`);
    console.log(`  - VotingEscrow: ${votingEscrowAddress}`);
    console.log(`  - RewardsDistributor: ${rewardsDistributorAddress}`);
  });

  // ========================================
  // 基础功能测试 (3个测试)
  // ========================================

  describe("基础功能", function () {
    it("部署时应该正确设置参数", async function () {
      const votingEscrowAddress = await votingEscrow.getAddress();
      const tokenAddress = await token.getAddress();

      expect(await rewardsDistributor.votingEscrow()).to.equal(votingEscrowAddress);
      expect(await rewardsDistributor.token()).to.equal(tokenAddress);
      expect(await rewardsDistributor.minter()).to.equal(minter.address);

      console.log("✅ 构造函数参数验证通过");
    });

    it("notifyRewardAmount 应该正确记录奖励", async function () {
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();

      // Minter 给 RewardsDistributor 转账
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);

      // 获取当前 epoch
      const currentEpoch = await rewardsDistributor.getCurrentEpoch();

      // Minter 调用 notifyRewardAmount
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      // 验证奖励记录
      const rewardForEpoch = await rewardsDistributor.rewardsPerEpoch(currentEpoch);
      expect(rewardForEpoch).to.equal(REWARD_AMOUNT);

      console.log(`✅ Epoch ${currentEpoch} 奖励记录: ${ethers.formatEther(rewardForEpoch)} tokens`);
    });

    it("应该按 epoch 分配奖励", async function () {
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();

      // 第一个 epoch
      const epoch1 = await rewardsDistributor.getCurrentEpoch();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      // 等待一周，进入下一个 epoch
      await time.increase(WEEK);

      // 第二个 epoch
      const epoch2 = await rewardsDistributor.getCurrentEpoch();
      const reward2 = ethers.parseEther("15000");
      await token.connect(minter).transfer(rewardsDistributorAddress, reward2);
      await rewardsDistributor.connect(minter).notifyRewardAmount(reward2);

      // 验证两个 epoch 的奖励独立
      expect(await rewardsDistributor.rewardsPerEpoch(epoch1)).to.equal(REWARD_AMOUNT);
      expect(await rewardsDistributor.rewardsPerEpoch(epoch2)).to.equal(reward2);
      expect(epoch2).to.equal(epoch1 + WEEK);

      console.log(`✅ Epoch 奖励独立验证通过`);
      console.log(`  - Epoch ${epoch1}: ${ethers.formatEther(REWARD_AMOUNT)} tokens`);
      console.log(`  - Epoch ${epoch2}: ${ethers.formatEther(reward2)} tokens`);
    });

    it("只有 Minter 可以调用 notifyRewardAmount", async function () {
      await expect(
        rewardsDistributor.connect(alice).notifyRewardAmount(REWARD_AMOUNT)
      ).to.be.revertedWith("RewardsDistributor: not minter");

      console.log("✅ onlyMinter 修饰符保护验证通过");
    });
  });

  // ========================================
  // claimRebase 功能测试 (5个测试)
  // ========================================

  describe("claimRebase 功能", function () {
    let tokenId1: bigint;
    let tokenId2: bigint;
    let lockEnd: bigint;

    beforeEach(async function () {
      // Alice 和 Bob 创建 ve-NFT
      const latestTime = BigInt(await time.latest());
      lockEnd = ((latestTime + 365n * 24n * 60n * 60n) / WEEK) * WEEK;

      await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, lockEnd);
      tokenId1 = 1n;

      await token.connect(bob).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(bob).createLock(LOCK_AMOUNT, lockEnd);
      tokenId2 = 2n;

      // Minter 分配奖励
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      console.log("✅ claimRebase 测试环境准备完成");
      console.log(`  - Alice tokenId: ${tokenId1}`);
      console.log(`  - Bob tokenId: ${tokenId2}`);
      console.log(`  - 本周奖励: ${ethers.formatEther(REWARD_AMOUNT)} tokens`);
    });

    it("用户应该能领取自己的 rebase 奖励", async function () {
      const balanceBefore = await token.balanceOf(alice.address);
      const epoch = await rewardsDistributor.getCurrentEpoch();

      // Alice 领取奖励
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);

      const balanceAfter = await token.balanceOf(alice.address);
      const claimed = balanceAfter - balanceBefore;

      expect(claimed).to.be.gt(0);
      console.log(`✅ Alice 成功领取 ${ethers.formatEther(claimed)} tokens`);

      // 验证 claimed 映射
      const isClaimed = await rewardsDistributor.claimed(tokenId1, epoch);
      expect(isClaimed).to.be.true;
    });

    it("应该防止双重领取 (claimed 映射)", async function () {
      const epoch = await rewardsDistributor.getCurrentEpoch();

      // 第一次领取成功
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);

      // 第二次领取应该失败
      await expect(
        rewardsDistributor.connect(alice).claimRebase(tokenId1)
      ).to.be.revertedWith("RewardsDistributor: already claimed");

      console.log("✅ 双重领取保护验证通过");
    });

    it("只有 NFT 所有者可以领取", async function () {
      // Bob 尝试领取 Alice 的 NFT 奖励
      await expect(
        rewardsDistributor.connect(bob).claimRebase(tokenId1)
      ).to.be.revertedWith("RewardsDistributor: not owner");

      console.log("✅ NFT 所有权验证通过");
    });

    it("奖励金额应该与投票权重成正比", async function () {
      // Alice 和 Bob 的锁仓量相同，所以奖励应该接近 50/50
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);
      const aliceReward = await token.balanceOf(alice.address);

      await rewardsDistributor.connect(bob).claimRebase(tokenId2);
      const bobReward = await token.balanceOf(bob.address);

      // 由于锁仓量相同，奖励差异应该很小 (允许1%误差)
      const diff = aliceReward > bobReward ? aliceReward - bobReward : bobReward - aliceReward;
      const maxDiff = (aliceReward * 1n) / 100n; // 1%

      expect(diff).to.be.lte(maxDiff);
      console.log(`✅ 奖励比例验证通过`);
      console.log(`  - Alice: ${ethers.formatEther(aliceReward)} tokens`);
      console.log(`  - Bob: ${ethers.formatEther(bobReward)} tokens`);
      console.log(`  - 差异: ${ethers.formatEther(diff)} tokens (< 1%)`);
    });

    it("不同锁仓时长应该获得不同奖励", async function () {
      // Charlie 创建一个更长时间的锁仓 (2年)
      const longLockEnd = ((BigInt(await time.latest()) + 2n * 365n * 24n * 60n * 60n) / WEEK) * WEEK;
      await token.connect(charlie).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(charlie).createLock(LOCK_AMOUNT, longLockEnd);
      const tokenId3 = 3n;

      // 等待下一个 epoch
      await time.increase(WEEK);

      // 新的一周奖励
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      // Alice (1年锁仓) vs Charlie (2年锁仓)
      const aliceBalanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);
      const aliceReward = (await token.balanceOf(alice.address)) - aliceBalanceBefore;

      const charlieBalanceBefore = await token.balanceOf(charlie.address);
      await rewardsDistributor.connect(charlie).claimRebase(tokenId3);
      const charlieReward = (await token.balanceOf(charlie.address)) - charlieBalanceBefore;

      // Charlie 锁仓时间更长，投票权重更高，奖励应该更多
      expect(charlieReward).to.be.gt(aliceReward);
      console.log(`✅ 锁仓时长奖励差异验证通过`);
      console.log(`  - Alice (1年): ${ethers.formatEther(aliceReward)} tokens`);
      console.log(`  - Charlie (2年): ${ethers.formatEther(charlieReward)} tokens`);
    });
  });

  // ========================================
  // claimMany 批量领取测试 (3个测试)
  // ========================================

  describe("claimMany 批量领取", function () {
    let tokenIds: bigint[];
    let lockEnd: bigint;

    beforeEach(async function () {
      const latestTime = BigInt(await time.latest());
      lockEnd = ((latestTime + 365n * 24n * 60n * 60n) / WEEK) * WEEK;

      // Alice 创建3个 ve-NFT
      tokenIds = [];
      for (let i = 0; i < 3; i++) {
        await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
        await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, lockEnd);
        tokenIds.push(BigInt(i + 1));
      }

      // Minter 分配奖励
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      console.log(`✅ 批量领取测试准备: Alice 拥有 ${tokenIds.length} 个 NFT`);
    });

    it("应该支持批量领取多个 NFT 的奖励", async function () {
      const balanceBefore = await token.balanceOf(alice.address);

      // 批量领取所有3个 NFT 的奖励
      await rewardsDistributor.connect(alice).claimMany(tokenIds);

      const balanceAfter = await token.balanceOf(alice.address);
      const totalClaimed = balanceAfter - balanceBefore;

      expect(totalClaimed).to.be.gt(0);
      console.log(`✅ 批量领取成功: ${ethers.formatEther(totalClaimed)} tokens`);
    });

    it("批量领取应该正确累加金额", async function () {
      // 先单独领取第一个 NFT
      const balanceBefore1 = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenIds[0]);
      const reward1 = (await token.balanceOf(alice.address)) - balanceBefore1;

      // 等待下一个 epoch
      await time.increase(WEEK);
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      // 批量领取所有3个 NFT
      const balanceBefore2 = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimMany(tokenIds);
      const totalReward = (await token.balanceOf(alice.address)) - balanceBefore2;

      // 批量领取的总额应该接近单个奖励的3倍 (因为有3个NFT)
      const expected = reward1 * 3n;
      const diff = totalReward > expected ? totalReward - expected : expected - totalReward;
      const maxDiff = (expected * 5n) / 100n; // 允许5%误差

      expect(diff).to.be.lte(maxDiff);
      console.log(`✅ 批量领取金额验证通过`);
      console.log(`  - 单个NFT奖励: ${ethers.formatEther(reward1)} tokens`);
      console.log(`  - 3个NFT批量: ${ethers.formatEther(totalReward)} tokens`);
    });

    it("批量领取应该跳过已领取的 NFT", async function () {
      const epoch = await rewardsDistributor.getCurrentEpoch();

      // 先单独领取第一个 NFT
      await rewardsDistributor.connect(alice).claimRebase(tokenIds[0]);

      // 批量领取所有3个 NFT (第一个已领取，应该跳过)
      const balanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimMany(tokenIds);
      const totalClaimed = (await token.balanceOf(alice.address)) - balanceBefore;

      // 只有2个NFT的奖励
      expect(totalClaimed).to.be.gt(0);

      // 验证所有3个NFT都标记为已领取
      for (const tokenId of tokenIds) {
        const isClaimed = await rewardsDistributor.claimed(tokenId, epoch);
        expect(isClaimed).to.be.true;
      }

      console.log(`✅ 批量领取跳过逻辑验证通过`);
    });
  });

  // ========================================
  // _calculateReward 计算测试 (2个测试)
  // ========================================

  describe("_calculateReward 计算", function () {
    let tokenId1: bigint;
    let tokenId2: bigint;

    beforeEach(async function () {
      const latestTime = BigInt(await time.latest());
      const lockEnd = ((latestTime + 365n * 24n * 60n * 60n) / WEEK) * WEEK;

      // Alice 锁仓 1000 tokens
      await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, lockEnd);
      tokenId1 = 1n;

      // Bob 锁仓 2000 tokens (2倍)
      const doubleLock = ethers.parseEther("2000");
      await token.connect(bob).approve(await votingEscrow.getAddress(), doubleLock);
      await votingEscrow.connect(bob).createLock(doubleLock, lockEnd);
      tokenId2 = 2n;

      // Minter 分配奖励
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      console.log("✅ _calculateReward 测试准备完成");
      console.log(`  - Alice 锁仓: 1000 tokens`);
      console.log(`  - Bob 锁仓: 2000 tokens`);
    });

    it("应该根据 ve-NFT 权重计算份额", async function () {
      // Alice 领取 (1000 tokens 锁仓)
      const aliceBalanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);
      const aliceReward = (await token.balanceOf(alice.address)) - aliceBalanceBefore;

      // Bob 领取 (2000 tokens 锁仓，应该是 Alice 的约2倍)
      const bobBalanceBefore = await token.balanceOf(bob.address);
      await rewardsDistributor.connect(bob).claimRebase(tokenId2);
      const bobReward = (await token.balanceOf(bob.address)) - bobBalanceBefore;

      // Bob 的奖励应该约是 Alice 的2倍 (允许10%误差)
      const ratio = (bobReward * 100n) / aliceReward;
      expect(ratio).to.be.gte(180n).and.lte(220n); // 1.8x ~ 2.2x

      console.log(`✅ 权重比例验证通过`);
      console.log(`  - Alice 奖励: ${ethers.formatEther(aliceReward)} tokens`);
      console.log(`  - Bob 奖励: ${ethers.formatEther(bobReward)} tokens`);
      console.log(`  - 比例: ${ratio / 100n}.${ratio % 100n}x`);
    });

    it("不同 epoch 的奖励应该独立", async function () {
      const epoch1 = await rewardsDistributor.getCurrentEpoch();

      // Epoch 1: Alice 领取
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);
      const aliceRewardEpoch1 = await token.balanceOf(alice.address);

      // 等待下一个 epoch
      await time.increase(WEEK);

      // Epoch 2: 新的奖励
      const epoch2 = await rewardsDistributor.getCurrentEpoch();
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      const reward2 = ethers.parseEther("20000"); // 不同金额
      await token.connect(minter).transfer(rewardsDistributorAddress, reward2);
      await rewardsDistributor.connect(minter).notifyRewardAmount(reward2);

      // Epoch 2: Alice 再次领取
      const balanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId1);
      const aliceRewardEpoch2 = (await token.balanceOf(alice.address)) - balanceBefore;

      // 两个 epoch 的奖励应该不同
      expect(aliceRewardEpoch2).to.not.equal(aliceRewardEpoch1);
      expect(epoch2).to.equal(epoch1 + WEEK);

      console.log(`✅ 跨 Epoch 奖励独立性验证通过`);
      console.log(`  - Epoch ${epoch1} 奖励: ${ethers.formatEther(aliceRewardEpoch1)} tokens`);
      console.log(`  - Epoch ${epoch2} 奖励: ${ethers.formatEther(aliceRewardEpoch2)} tokens`);
    });
  });

  // ========================================
  // 集成测试 (1个测试)
  // ========================================

  describe("集成测试", function () {
    it("Minter → RewardsDistributor → 用户 完整流程", async function () {
      // 1. 用户创建 ve-NFT
      const latestTime = BigInt(await time.latest());
      const lockEnd = ((latestTime + 365n * 24n * 60n * 60n) / WEEK) * WEEK;

      await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, lockEnd);
      const tokenId = 1n;

      console.log("✅ Step 1: Alice 创建 ve-NFT");

      // 2. Minter 分配奖励给 RewardsDistributor
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      const epoch = await rewardsDistributor.getCurrentEpoch();
      const rewardForEpoch = await rewardsDistributor.rewardsPerEpoch(epoch);
      expect(rewardForEpoch).to.equal(REWARD_AMOUNT);

      console.log(`✅ Step 2: Minter 分配 ${ethers.formatEther(REWARD_AMOUNT)} tokens 到 epoch ${epoch}`);

      // 3. 用户领取 rebase 奖励
      const balanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId);
      const balanceAfter = await token.balanceOf(alice.address);
      const claimed = balanceAfter - balanceBefore;

      expect(claimed).to.be.gt(0);
      expect(claimed).to.be.lte(REWARD_AMOUNT); // 不应超过总奖励

      console.log(`✅ Step 3: Alice 成功领取 ${ethers.formatEther(claimed)} tokens`);

      // 4. 验证防护措施
      await expect(
        rewardsDistributor.connect(alice).claimRebase(tokenId)
      ).to.be.revertedWith("RewardsDistributor: already claimed");

      console.log("✅ Step 4: 双重领取保护验证通过");

      // 5. 多周模拟
      for (let week = 1; week <= 3; week++) {
        await time.increase(WEEK);

        const currentEpoch = await rewardsDistributor.getCurrentEpoch();
        await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
        await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

        const balanceBefore = await token.balanceOf(alice.address);
        await rewardsDistributor.connect(alice).claimRebase(tokenId);
        const weekReward = (await token.balanceOf(alice.address)) - balanceBefore;

        console.log(`✅ Week ${week} (epoch ${currentEpoch}): Alice 领取 ${ethers.formatEther(weekReward)} tokens`);
      }

      console.log("✅ 完整流程集成测试通过");
    });
  });

  // ========================================
  // 边界条件测试 (3个测试)
  // ========================================

  describe("边界条件", function () {
    it("没有奖励时领取应该返回0", async function () {
      // 创建 ve-NFT
      const latestTime = BigInt(await time.latest());
      const lockEnd = ((latestTime + 365n * 24n * 60n * 60n) / WEEK) * WEEK;
      await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, lockEnd);
      const tokenId = 1n;

      // 没有调用 notifyRewardAmount，直接领取
      const balanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId);
      const balanceAfter = await token.balanceOf(alice.address);

      expect(balanceAfter).to.equal(balanceBefore); // 没有奖励
      console.log("✅ 无奖励时领取验证通过");
    });

    it("应该拒绝不存在的 tokenId", async function () {
      const nonExistentTokenId = 999n;

      await expect(
        rewardsDistributor.connect(alice).claimRebase(nonExistentTokenId)
      ).to.be.reverted; // VotingEscrow 会拒绝

      console.log("✅ 不存在的 tokenId 验证通过");
    });

    it("投票权重为0的 NFT 应该获得0奖励", async function () {
      // 创建一个即将到期的 ve-NFT (1周后到期)
      const latestTime = BigInt(await time.latest());
      const shortLockEnd = ((latestTime + WEEK) / WEEK) * WEEK;

      await token.connect(alice).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      await votingEscrow.connect(alice).createLock(LOCK_AMOUNT, shortLockEnd);
      const tokenId = 1n;

      // 分配奖励
      const rewardsDistributorAddress = await rewardsDistributor.getAddress();
      await token.connect(minter).transfer(rewardsDistributorAddress, REWARD_AMOUNT);
      await rewardsDistributor.connect(minter).notifyRewardAmount(REWARD_AMOUNT);

      // 等待锁定到期
      await time.increase(WEEK + 1n);

      // 此时投票权重应该为0
      const balanceBefore = await token.balanceOf(alice.address);
      await rewardsDistributor.connect(alice).claimRebase(tokenId);
      const balanceAfter = await token.balanceOf(alice.address);
      const claimed = balanceAfter - balanceBefore;

      expect(claimed).to.equal(0); // 投票权重为0，奖励为0
      console.log("✅ 零权重 NFT 奖励验证通过");
    });
  });
});
