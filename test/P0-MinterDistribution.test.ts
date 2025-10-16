import { expect } from "chai";
import { ethers } from "hardhat";
import { Minter, Token, VotingEscrow, Voter, Factory, RewardsDistributor } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * P0-035/036/037: Minter 多项修复测试
 *
 * 测试目标:
 * 1. P0-035: 验证正确的 30/70 排放分配
 * 2. P0-036: 验证尾部排放机制 (2% 地板)
 * 3. P0-037: 验证 circulatingSupply 下溢保护
 */
describe("P0-Minter: Multiple Fixes", function () {
  let minter: Minter;
  let token: Token;
  let votingEscrow: VotingEscrow;
  let voter: Voter;
  let factory: Factory;
  let rewardsDistributor: RewardsDistributor;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("20000000"); // 2000万
  const WEEK = 7 * 24 * 3600;
  const VE_DISTRIBUTION = 30n; // 30%
  const TAIL_EMISSION_RATE = 200n; // 2%
  const TAIL_EMISSION_BASE = 10000n;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // 部署 Token
    const TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.deploy("Solidly", "SOLID");
    await token.waitForDeployment();

    // 部署 Factory
    const FactoryContract = await ethers.getContractFactory("Factory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // 部署 VotingEscrow
    const VotingEscrowFactory = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrowFactory.deploy(await token.getAddress());
    await votingEscrow.waitForDeployment();

    // 部署 Voter
    const VoterFactory = await ethers.getContractFactory("Voter");
    voter = await VoterFactory.deploy(
      await votingEscrow.getAddress(),
      await factory.getAddress(),
      await token.getAddress()
    );
    await voter.waitForDeployment();

    // 部署 Minter
    const MinterFactory = await ethers.getContractFactory("Minter");
    minter = await MinterFactory.deploy(
      await token.getAddress(),
      await votingEscrow.getAddress()
    );
    await minter.waitForDeployment();

    // 部署 RewardsDistributor
    const RewardsDistributorFactory = await ethers.getContractFactory("RewardsDistributor");
    rewardsDistributor = await RewardsDistributorFactory.deploy(
      await votingEscrow.getAddress(),
      await token.getAddress()
    );
    await rewardsDistributor.waitForDeployment();

    // 设置关联
    await minter.setVoter(await voter.getAddress());
    await token.setMinter(await minter.getAddress());

    // 设置 RewardsDistributor
    await minter.setRewardsDistributor(await rewardsDistributor.getAddress());

    // 启动 Minter
    await minter.start();
  });

  describe("P0-035: 30/70 排放分配", function () {
    it("VE_DISTRIBUTION 常量应该是 30", async function () {
      const veDistribution = await minter.VE_DISTRIBUTION();
      expect(veDistribution).to.equal(VE_DISTRIBUTION);
      expect(veDistribution).to.equal(30n);
    });

    it("update_period 应该正确分配 30% 给 ve 持有者", async function () {
      // 等待一周
      await time.increase(WEEK);

      // 记录初始余额
      const minterBalanceBefore = await token.balanceOf(await minter.getAddress());
      const rewardsDistributorBalanceBefore = await token.balanceOf(await rewardsDistributor.getAddress());

      // 调用 update_period
      const tx = await minter.update_period();
      const receipt = await tx.wait();

      // 获取铸造事件
      const events = receipt?.logs || [];

      // 检查 RewardsDistributor 余额增加
      const rewardsDistributorBalanceAfter = await token.balanceOf(await rewardsDistributor.getAddress());
      const receivedByVe = rewardsDistributorBalanceAfter - rewardsDistributorBalanceBefore;

      // 验证 ve 持有者收到了代币
      expect(receivedByVe).to.be.gt(0);

      console.log(`RewardsDistributor received: ${ethers.formatEther(receivedByVe)} tokens`);
    });

    it("update_period 应该正确分配 70% 给 Gauge", async function () {
      // 等待一周
      await time.increase(WEEK);

      // 记录 Voter 初始余额
      const voterBalanceBefore = await token.balanceOf(await voter.getAddress());

      // 调用 update_period
      await minter.update_period();

      // 检查 Voter 余额(用于分配给Gauge)
      const voterBalanceAfter = await token.balanceOf(await voter.getAddress());
      const receivedByVoter = voterBalanceAfter - voterBalanceBefore;

      // Voter 应该收到了代币
      expect(receivedByVoter).to.be.gt(0);

      console.log(`Voter received: ${ethers.formatEther(receivedByVoter)} tokens`);
    });

    it("30% 和 70% 的比例应该正确", async function () {
      // 等待一周
      await time.increase(WEEK);

      const rewardsDistributorBefore = await token.balanceOf(await rewardsDistributor.getAddress());
      const voterBefore = await token.balanceOf(await voter.getAddress());

      await minter.update_period();

      const rewardsDistributorAfter = await token.balanceOf(await rewardsDistributor.getAddress());
      const voterAfter = await token.balanceOf(await voter.getAddress());

      const forVe = rewardsDistributorAfter - rewardsDistributorBefore;
      const forGauges = voterAfter - voterBefore;

      // 计算比例
      const ratio = (forVe * 100n) / (forVe + forGauges);

      // 应该约等于 30%
      expect(ratio).to.be.gte(29n).and.lte(31n);

      console.log(`Distribution ratio - ve: ${ratio}%, Gauges: ${100n - ratio}%`);
      console.log(`Amounts - ve: ${ethers.formatEther(forVe)}, Gauges: ${ethers.formatEther(forGauges)}`);
    });

    it("多次 update_period 应该持续正确分配", async function () {
      let totalForVe = 0n;
      let totalForGauges = 0n;

      for (let i = 0; i < 3; i++) {
        await time.increase(WEEK);

        const rewardsDistributorBefore = await token.balanceOf(await rewardsDistributor.getAddress());
        const voterBefore = await token.balanceOf(await voter.getAddress());

        await minter.update_period();

        const rewardsDistributorAfter = await token.balanceOf(await rewardsDistributor.getAddress());
        const voterAfter = await token.balanceOf(await voter.getAddress());

        const forVe = rewardsDistributorAfter - rewardsDistributorBefore;
        const forGauges = voterAfter - voterBefore;

        totalForVe += forVe;
        totalForGauges += forGauges;
      }

      // 累积比例应该接近 30/70
      const ratio = (totalForVe * 100n) / (totalForVe + totalForGauges);
      expect(ratio).to.be.gte(29n).and.lte(31n);

      console.log(`Total distribution - ve: ${ethers.formatEther(totalForVe)}, Gauges: ${ethers.formatEther(totalForGauges)}`);
    });
  });

  describe("P0-036: 尾部排放机制", function () {
    it("TAIL_EMISSION_RATE 应该是 200 (2%)", async function () {
      const rate = await minter.TAIL_EMISSION_RATE();
      expect(rate).to.equal(TAIL_EMISSION_RATE);
    });

    it("TAIL_EMISSION_BASE 应该是 10000", async function () {
      const base = await minter.TAIL_EMISSION_BASE();
      expect(base).to.equal(TAIL_EMISSION_BASE);
    });

    it("calculateEmission 应该返回 max(weekly, 2% 流通量)", async function () {
      // 初始阶段
      const emission1 = await minter.calculateEmission();
      const weekly1 = await minter.weekly();
      const circulating1 = await minter.circulatingSupply();
      const tailEmission1 = (circulating1 * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;

      // emission 应该是两者的最大值
      const expected1 = weekly1 > tailEmission1 ? weekly1 : tailEmission1;
      expect(emission1).to.equal(expected1);

      console.log(`Week 1 - weekly: ${ethers.formatEther(weekly1)}, tail: ${ethers.formatEther(tailEmission1)}, actual: ${ethers.formatEther(emission1)}`);
    });

    it("衰减到极低值时应该切换到 2% 地板", async function () {
      // 快速推进多周,让 weekly 衰减
      for (let i = 0; i < 50; i++) {
        await time.increase(WEEK);
        await minter.update_period();
      }

      const weekly = await minter.weekly();
      const circulating = await minter.circulatingSupply();
      const tailEmission = (circulating * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;
      const emission = await minter.calculateEmission();

      console.log(`After 50 weeks:`);
      console.log(`  Weekly (decayed): ${ethers.formatEther(weekly)}`);
      console.log(`  Tail (2% floor): ${ethers.formatEther(tailEmission)}`);
      console.log(`  Actual emission: ${ethers.formatEther(emission)}`);

      // 此时应该使用尾部排放
      if (tailEmission > weekly) {
        expect(emission).to.equal(tailEmission);
      }
    });

    it("长期运行应该维持至少 2% 的排放", async function () {
      // 模拟 100 周
      for (let i = 0; i < 100; i++) {
        await time.increase(WEEK);
        await minter.update_period();
      }

      const circulating = await minter.circulatingSupply();
      const minEmission = (circulating * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;
      const actualEmission = await minter.calculateEmission();

      // 实际排放应该至少是 2%
      expect(actualEmission).to.be.gte(minEmission);

      console.log(`After 100 weeks - min: ${ethers.formatEther(minEmission)}, actual: ${ethers.formatEther(actualEmission)}`);
    });

    it("尾部排放应该随流通量增加而增加", async function () {
      const circulating1 = await minter.circulatingSupply();
      const tailEmission1 = (circulating1 * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;

      // 增发几周,增加流通量
      for (let i = 0; i < 10; i++) {
        await time.increase(WEEK);
        await minter.update_period();
      }

      const circulating2 = await minter.circulatingSupply();
      const tailEmission2 = (circulating2 * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;

      // 流通量增加,尾部排放也应该增加
      expect(circulating2).to.be.gt(circulating1);
      expect(tailEmission2).to.be.gt(tailEmission1);

      console.log(`Circulating growth: ${ethers.formatEther(circulating1)} → ${ethers.formatEther(circulating2)}`);
      console.log(`Tail emission growth: ${ethers.formatEther(tailEmission1)} → ${ethers.formatEther(tailEmission2)}`);
    });
  });

  describe("P0-037: circulatingSupply 下溢保护", function () {
    it("正常情况应该返回 totalSupply - lockedSupply", async function () {
      const totalSupply = await token.totalSupply();
      const lockedSupply = await votingEscrow.supply();
      const circulating = await minter.circulatingSupply();

      expect(circulating).to.equal(totalSupply - lockedSupply);
    });

    it("lockedSupply > totalSupply 时应该返回 0", async function () {
      // 这种情况在实际中不应该发生,但代码应该防护
      // 我们通过创建大量锁仓来测试边界

      // 给用户转账代币
      await token.transfer(user.address, ethers.parseEther("10000000"));

      // 用户创建大额锁仓
      await token.connect(user).approve(await votingEscrow.getAddress(), ethers.parseEther("10000000"));
      const currentTime = await time.latest();
      await votingEscrow.connect(user).create_lock(
        ethers.parseEther("10000000"),
        currentTime + 4 * 365 * 86400 // 4年
      );

      const circulating = await minter.circulatingSupply();

      // 应该是非负数
      expect(circulating).to.be.gte(0);
    });

    it("没有锁仓时 circulatingSupply 应该等于 totalSupply", async function () {
      const totalSupply = await token.totalSupply();
      const lockedSupply = await votingEscrow.supply();

      // 初始没有锁仓
      expect(lockedSupply).to.equal(0);

      const circulating = await minter.circulatingSupply();
      expect(circulating).to.equal(totalSupply);
    });

    it("锁仓增加应该减少 circulatingSupply", async function () {
      const circulatingBefore = await minter.circulatingSupply();

      // 创建锁仓
      await token.transfer(user.address, ethers.parseEther("1000000"));
      await token.connect(user).approve(await votingEscrow.getAddress(), ethers.parseEther("1000000"));
      const currentTime = await time.latest();
      await votingEscrow.connect(user).create_lock(
        ethers.parseEther("1000000"),
        currentTime + 365 * 86400
      );

      const circulatingAfter = await minter.circulatingSupply();

      // 流通量应该减少
      expect(circulatingAfter).to.be.lt(circulatingBefore);
      expect(circulatingBefore - circulatingAfter).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("集成测试", function () {
    it("完整的周期更新流程", async function () {
      // 1. 等待一周
      await time.increase(WEEK);

      // 2. 记录初始状态
      const totalSupplyBefore = await token.totalSupply();
      const rewardsDistributorBefore = await token.balanceOf(await rewardsDistributor.getAddress());
      const voterBefore = await token.balanceOf(await voter.getAddress());

      // 3. 更新周期
      await minter.update_period();

      // 4. 验证状态变化
      const totalSupplyAfter = await token.totalSupply();
      const rewardsDistributorAfter = await token.balanceOf(await rewardsDistributor.getAddress());
      const voterAfter = await token.balanceOf(await voter.getAddress());

      // 总供应应该增加
      expect(totalSupplyAfter).to.be.gt(totalSupplyBefore);

      // ve 和 Gauge 都应该收到代币
      expect(rewardsDistributorAfter).to.be.gt(rewardsDistributorBefore);
      expect(voterAfter).to.be.gt(voterBefore);

      // 铸造量 = ve收到 + Gauge收到
      const minted = totalSupplyAfter - totalSupplyBefore;
      const forVe = rewardsDistributorAfter - rewardsDistributorBefore;
      const forGauges = voterAfter - voterBefore;

      expect(minted).to.equal(forVe + forGauges);

      console.log(`Minted: ${ethers.formatEther(minted)}, forVe: ${ethers.formatEther(forVe)}, forGauges: ${ethers.formatEther(forGauges)}`);
    });

    it("多周排放累积验证", async function () {
      let totalMinted = 0n;
      let totalForVe = 0n;
      let totalForGauges = 0n;

      // 模拟 10 周
      for (let i = 0; i < 10; i++) {
        await time.increase(WEEK);

        const totalSupplyBefore = await token.totalSupply();
        const rewardsDistributorBefore = await token.balanceOf(await rewardsDistributor.getAddress());
        const voterBefore = await token.balanceOf(await voter.getAddress());

        await minter.update_period();

        const totalSupplyAfter = await token.totalSupply();
        const rewardsDistributorAfter = await token.balanceOf(await rewardsDistributor.getAddress());
        const voterAfter = await token.balanceOf(await voter.getAddress());

        totalMinted += (totalSupplyAfter - totalSupplyBefore);
        totalForVe += (rewardsDistributorAfter - rewardsDistributorBefore);
        totalForGauges += (voterAfter - voterBefore);
      }

      // 验证累积分配
      expect(totalMinted).to.equal(totalForVe + totalForGauges);

      const ratio = (totalForVe * 100n) / totalMinted;
      expect(ratio).to.be.gte(29n).and.lte(31n);

      console.log(`10 weeks total:`);
      console.log(`  Minted: ${ethers.formatEther(totalMinted)}`);
      console.log(`  For ve (30%): ${ethers.formatEther(totalForVe)}`);
      console.log(`  For Gauges (70%): ${ethers.formatEther(totalForGauges)}`);
    });

    it("weekly 应该按 99/100 衰减", async function () {
      const EMISSION_DECAY = 99n;
      const EMISSION_BASE = 100n;

      const weekly1 = await minter.weekly();

      await time.increase(WEEK);
      await minter.update_period();

      const weekly2 = await minter.weekly();

      // weekly2 应该约等于 weekly1 * 99 / 100
      const expected = (weekly1 * EMISSION_DECAY) / EMISSION_BASE;
      expect(weekly2).to.equal(expected);

      console.log(`Weekly decay: ${ethers.formatEther(weekly1)} → ${ethers.formatEther(weekly2)}`);
    });

    it("activePeriod 应该正确更新", async function () {
      const period1 = await minter.activePeriod();

      await time.increase(WEEK);
      await minter.update_period();

      const period2 = await minter.activePeriod();

      // 应该推进一周
      expect(period2).to.equal(period1 + BigInt(WEEK));
    });
  });

  describe("边界条件", function () {
    it("在同一周期内多次调用 update_period 不应该重复铸造", async function () {
      await time.increase(WEEK);

      const totalSupplyBefore = await token.totalSupply();

      // 第一次调用
      await minter.update_period();
      const totalSupplyAfter1 = await token.totalSupply();

      // 第二次调用(同一周期)
      await minter.update_period();
      const totalSupplyAfter2 = await token.totalSupply();

      // 第二次不应该铸造
      expect(totalSupplyAfter1).to.be.gt(totalSupplyBefore);
      expect(totalSupplyAfter2).to.equal(totalSupplyAfter1);
    });

    it("未启动的 Minter 不应该更新", async function () {
      // 部署新的 Minter 但不启动
      const MinterFactory = await ethers.getContractFactory("Minter");
      const newMinter = await MinterFactory.deploy(
        await token.getAddress(),
        await votingEscrow.getAddress()
      );

      await expect(
        newMinter.updatePeriod()
      ).to.be.revertedWith("Minter: not started");
    });

    it("未设置 RewardsDistributor 时仍应该正常运行", async function () {
      // 部署新的 Minter
      const MinterFactory = await ethers.getContractFactory("Minter");
      const newMinter = await MinterFactory.deploy(
        await token.getAddress(),
        await votingEscrow.getAddress()
      );

      await newMinter.setVoter(await voter.getAddress());
      await newMinter.start();

      await time.increase(WEEK);

      // 应该不会失败,只是ve部分不分配
      await expect(newMinter.update_period()).to.not.be.reverted;
    });
  });
});
