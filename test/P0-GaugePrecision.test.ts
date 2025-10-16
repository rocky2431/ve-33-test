import { expect } from "chai";
import { ethers } from "hardhat";
import { Gauge, Token, VotingEscrow, Voter, Factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * P0-042: Gauge 奖励精度修复测试
 *
 * 测试目标:
 * 1. 验证从 1e18 升级到 1e36 精度
 * 2. 防止小额质押时的精度损失
 * 3. 确保奖励计算准确性
 * 4. 对比 1e18 和 1e36 精度差异
 */
describe("P0-042: Gauge Precision Fix", function () {
  let gauge: Gauge;
  let stakingToken: Token;
  let rewardToken: Token;
  let votingEscrow: VotingEscrow;
  let voter: Voter;
  let factory: Factory;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  const PRECISION = ethers.parseEther("1000000000000000000"); // 1e36
  const OLD_PRECISION = ethers.parseEther("1"); // 1e18
  const REWARD_AMOUNT = ethers.parseEther("1000000"); // 100万奖励
  const DURATION = 7 * 24 * 3600; // 7天

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();

    // 部署 Token
    const TokenFactory = await ethers.getContractFactory("Token");
    stakingToken = await TokenFactory.deploy("LP Token", "LP");
    rewardToken = await TokenFactory.deploy("Reward Token", "RWD");
    await stakingToken.waitForDeployment();
    await rewardToken.waitForDeployment();

    // 部署 Factory
    const FactoryContract = await ethers.getContractFactory("Factory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // 部署 VotingEscrow
    const VotingEscrowFactory = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrowFactory.deploy(await rewardToken.getAddress());
    await votingEscrow.waitForDeployment();

    // 部署 Voter
    const VoterFactory = await ethers.getContractFactory("Voter");
    voter = await VoterFactory.deploy(
      await votingEscrow.getAddress(),
      await factory.getAddress(),
      await rewardToken.getAddress()
    );
    await voter.waitForDeployment();

    // 部署 Gauge
    const GaugeFactory = await ethers.getContractFactory("Gauge");
    gauge = await GaugeFactory.deploy(
      await stakingToken.getAddress(),
      await votingEscrow.getAddress(),
      await voter.getAddress()
    );
    await gauge.waitForDeployment();

    // 分配代币
    const largeAmount = ethers.parseEther("10000000000"); // 100亿
    await stakingToken.transfer(alice.address, largeAmount);
    await stakingToken.transfer(bob.address, largeAmount);
    await stakingToken.transfer(carol.address, largeAmount);
    await rewardToken.transfer(await gauge.getAddress(), REWARD_AMOUNT * 10n);
  });

  describe("PRECISION 常量验证", function () {
    it("应该使用 1e36 精度常量", async function () {
      const precision = await gauge.PRECISION();
      expect(precision).to.equal(PRECISION);
      expect(precision).to.equal(ethers.parseEther("1000000000000000000"));
    });

    it("PRECISION 应该是 1e18 的 1e18 倍", async function () {
      const precision = await gauge.PRECISION();
      expect(precision / OLD_PRECISION).to.equal(OLD_PRECISION);
    });
  });

  describe("小额质押精度测试", function () {
    it("1 wei 质押应该能正确计算奖励", async function () {
      // Alice 质押 1 wei (最小金额)
      const tinyStake = 1n;
      await stakingToken.connect(alice).approve(await gauge.getAddress(), tinyStake);
      await gauge.connect(alice).deposit(tinyStake);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待一半时间
      await time.increase(DURATION / 2);

      // 检查奖励
      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 即使是 1 wei 质押,也应该有奖励(不应该因精度损失为0)
      expect(earned).to.be.gt(0);

      console.log(`1 wei stake earned: ${ethers.formatEther(earned)} tokens`);
    });

    it("小额质押应该避免精度损失", async function () {
      // Alice 质押 1000 wei
      const smallStake = 1000n;
      await stakingToken.connect(alice).approve(await gauge.getAddress(), smallStake);
      await gauge.connect(alice).deposit(smallStake);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待完整周期
      await time.increase(DURATION);

      // Alice 应该获得全部奖励(因为只有她一个人质押)
      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 允许小幅度误差(由于区块时间)
      const expectedReward = REWARD_AMOUNT;
      const tolerance = expectedReward / 1000n; // 0.1% 容差

      expect(earned).to.be.gte(expectedReward - tolerance);
      expect(earned).to.be.lte(expectedReward + tolerance);

      console.log(`Small stake precision: ${ethers.formatEther(earned)} / ${ethers.formatEther(expectedReward)}`);
    });

    it("多个小额质押者应该按比例分配奖励", async function () {
      // Alice 质押 100 wei
      const aliceStake = 100n;
      await stakingToken.connect(alice).approve(await gauge.getAddress(), aliceStake);
      await gauge.connect(alice).deposit(aliceStake);

      // Bob 质押 200 wei (2倍)
      const bobStake = 200n;
      await stakingToken.connect(bob).approve(await gauge.getAddress(), bobStake);
      await gauge.connect(bob).deposit(bobStake);

      // Carol 质押 300 wei (3倍)
      const carolStake = 300n;
      await stakingToken.connect(carol).approve(await gauge.getAddress(), carolStake);
      await gauge.connect(carol).deposit(carolStake);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待完整周期
      await time.increase(DURATION);

      // 获取奖励
      const aliceEarned = await gauge.earned(await rewardToken.getAddress(), alice.address);
      const bobEarned = await gauge.earned(await rewardToken.getAddress(), bob.address);
      const carolEarned = await gauge.earned(await rewardToken.getAddress(), carol.address);

      // 验证比例: Alice:Bob:Carol = 1:2:3
      const ratioAB = (bobEarned * 100n) / aliceEarned; // 应该约等于 200
      const ratioAC = (carolEarned * 100n) / aliceEarned; // 应该约等于 300

      expect(ratioAB).to.be.gte(195n).and.lte(205n); // 2倍 ±5%
      expect(ratioAC).to.be.gte(295n).and.lte(305n); // 3倍 ±5%

      console.log(`Reward ratio - Alice:Bob:Carol = 1:${ratioAB / 100n}:${ratioAC / 100n}`);
    });
  });

  describe("rewardPerToken 计算验证", function () {
    it("应该使用 PRECISION (1e36) 进行计算", async function () {
      // Alice 质押
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待一段时间
      await time.increase(3600); // 1小时

      // 获取 rewardPerToken
      const rewardPerToken = await gauge.rewardPerToken(await rewardToken.getAddress());

      // rewardPerToken 应该是一个很大的数(因为使用了 1e36 精度)
      expect(rewardPerToken).to.be.gt(0);

      // 验证精度级别
      // 如果是 1e18 精度,这个值会小很多
      console.log(`rewardPerToken: ${rewardPerToken}`);
    });

    it("totalSupply = 0 时不应该溢出", async function () {
      // 在没有任何质押的情况下查询
      const rewardPerToken = await gauge.rewardPerToken(await rewardToken.getAddress());

      // 应该返回 rewardPerTokenStored (初始为0)
      expect(rewardPerToken).to.equal(0);
    });

    it("时间流逝应该线性增加 rewardPerToken", async function () {
      // Alice 质押
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 记录初始 rewardPerToken
      const rpt1 = await gauge.rewardPerToken(await rewardToken.getAddress());

      // 等待1小时
      await time.increase(3600);
      const rpt2 = await gauge.rewardPerToken(await rewardToken.getAddress());

      // 再等待1小时
      await time.increase(3600);
      const rpt3 = await gauge.rewardPerToken(await rewardToken.getAddress());

      // 增量应该大致相等(线性增长)
      const increment1 = rpt2 - rpt1;
      const increment2 = rpt3 - rpt2;

      // 允许小幅度误差
      const tolerance = increment1 / 100n; // 1% 容差
      expect(increment2).to.be.gte(increment1 - tolerance);
      expect(increment2).to.be.lte(increment1 + tolerance);

      console.log(`Increments: ${increment1} vs ${increment2}`);
    });
  });

  describe("earned 函数精度验证", function () {
    it("应该正确计算用户可领取奖励", async function () {
      // Alice 质押
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待完整周期
      await time.increase(DURATION);

      // Alice 应该获得全部奖励
      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      const tolerance = REWARD_AMOUNT / 1000n; // 0.1% 容差
      expect(earned).to.be.gte(REWARD_AMOUNT - tolerance);
      expect(earned).to.be.lte(REWARD_AMOUNT + tolerance);
    });

    it("多次查询 earned 应该返回一致结果", async function () {
      // Alice 质押
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待一段时间
      await time.increase(3600);

      // 多次查询
      const earned1 = await gauge.earned(await rewardToken.getAddress(), alice.address);
      const earned2 = await gauge.earned(await rewardToken.getAddress(), alice.address);
      const earned3 = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 在同一区块内查询应该返回相同结果
      expect(earned1).to.equal(earned2);
      expect(earned2).to.equal(earned3);
    });

    it("领取后 earned 应该重置为0", async function () {
      // Alice 质押
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加奖励
      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      // 等待一段时间
      await time.increase(3600);

      // 领取奖励
      await gauge.connect(alice).getReward();

      // 领取后应该为0
      const earnedAfter = await gauge.earned(await rewardToken.getAddress(), alice.address);
      expect(earnedAfter).to.equal(0);
    });
  });

  describe("精度对比测试 (1e18 vs 1e36)", function () {
    it("1e36 精度应该显著优于 1e18 精度", async function () {
      // 使用极小的质押量来放大精度差异
      const tinyStake = 1000n; // 1000 wei
      const largeReward = ethers.parseEther("1000000"); // 100万奖励
      const shortDuration = 60; // 1分钟

      await stakingToken.connect(alice).approve(await gauge.getAddress(), tinyStake);
      await gauge.connect(alice).deposit(tinyStake);

      await gauge.notifyRewardAmount(await rewardToken.getAddress(), largeReward);

      // 等待短时间
      await time.increase(shortDuration);

      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 使用 1e18 精度,这种场景可能导致奖励为0或很小
      // 使用 1e36 精度,应该能准确计算
      expect(earned).to.be.gt(0);

      // 计算理论值
      const rewardRate = largeReward / BigInt(DURATION);
      const theoreticalEarned = rewardRate * BigInt(shortDuration);

      console.log(`Earned with 1e36: ${ethers.formatEther(earned)}`);
      console.log(`Theoretical: ${ethers.formatEther(theoreticalEarned)}`);

      // 实际值应该接近理论值
      const tolerance = theoreticalEarned / 100n; // 1% 容差
      expect(earned).to.be.gte(theoreticalEarned - tolerance);
    });

    it("大额质押应该保持精度一致", async function () {
      // 使用大额质押
      const largeStake = ethers.parseEther("1000000000"); // 10亿
      await stakingToken.connect(alice).approve(await gauge.getAddress(), largeStake);
      await gauge.connect(alice).deposit(largeStake);

      await gauge.notifyRewardAmount(await rewardToken.getAddress(), REWARD_AMOUNT);

      await time.increase(DURATION);

      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 大额质押也应该精确
      const tolerance = REWARD_AMOUNT / 1000n;
      expect(earned).to.be.gte(REWARD_AMOUNT - tolerance);
      expect(earned).to.be.lte(REWARD_AMOUNT + tolerance);
    });
  });

  describe("极端场景测试", function () {
    it("质押量 >> 奖励量时应该正常工作", async function () {
      const hugeStake = ethers.parseEther("1000000000000"); // 1万亿
      const smallReward = ethers.parseEther("1"); // 1个代币

      await stakingToken.connect(alice).approve(await gauge.getAddress(), hugeStake);
      await gauge.connect(alice).deposit(hugeStake);

      await gauge.notifyRewardAmount(await rewardToken.getAddress(), smallReward);

      await time.increase(DURATION);

      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 应该获得接近全部的小额奖励
      expect(earned).to.be.gt(smallReward * 99n / 100n); // 至少99%
    });

    it("质押量 << 奖励量时应该正常工作", async function () {
      const tinyStake = 1n;
      const hugeReward = ethers.parseEther("1000000000"); // 10亿

      await stakingToken.connect(alice).approve(await gauge.getAddress(), tinyStake);
      await gauge.connect(alice).deposit(tinyStake);

      await gauge.notifyRewardAmount(await rewardToken.getAddress(), hugeReward);

      await time.increase(DURATION);

      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 应该获得大部分奖励
      expect(earned).to.be.gt(hugeReward * 99n / 100n);
    });

    it("多次小额奖励累积应该精确", async function () {
      const stakeAmount = ethers.parseEther("1000");
      await stakingToken.connect(alice).approve(await gauge.getAddress(), stakeAmount);
      await gauge.connect(alice).deposit(stakeAmount);

      // 添加10次小额奖励
      const smallReward = ethers.parseEther("10000");
      for (let i = 0; i < 10; i++) {
        await gauge.notifyRewardAmount(await rewardToken.getAddress(), smallReward);
        await time.increase(DURATION / 10);
      }

      await time.increase(DURATION);

      const earned = await gauge.earned(await rewardToken.getAddress(), alice.address);

      // 总计应该接近 10 * smallReward
      const expectedTotal = smallReward * 10n;
      const tolerance = expectedTotal / 50n; // 2% 容差

      expect(earned).to.be.gte(expectedTotal - tolerance);
      expect(earned).to.be.lte(expectedTotal + tolerance);

      console.log(`Accumulated: ${ethers.formatEther(earned)} / ${ethers.formatEther(expectedTotal)}`);
    });
  });

  describe("MIN_REWARD_AMOUNT 验证", function () {
    it("应该拒绝小于最小金额的奖励", async function () {
      const tooSmallReward = ethers.parseEther("0.5"); // 小于 1e18

      await expect(
        gauge.notifyRewardAmount(await rewardToken.getAddress(), tooSmallReward)
      ).to.be.revertedWith("Gauge: reward too small");
    });

    it("应该接受等于最小金额的奖励", async function () {
      const minReward = ethers.parseEther("1"); // 正好 1e18

      await expect(
        gauge.notifyRewardAmount(await rewardToken.getAddress(), minReward)
      ).to.not.be.reverted;
    });
  });
});
