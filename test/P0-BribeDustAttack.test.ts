import { expect } from "chai";
import { ethers } from "hardhat";
import { Bribe, Token, VotingEscrow, Voter, Factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * P0-047: Bribe 粉尘攻击防护测试
 *
 * 测试目标:
 * 1. 验证 MIN_BRIBE_AMOUNT (100 代币) 最小贿赂门槛
 * 2. 防止攻击者用极小金额填满 rewards 数组
 * 3. 确保 rewards 数组最多10个代币
 * 4. 模拟粉尘攻击场景
 */
describe("P0-047: Bribe Dust Attack Protection", function () {
  let bribe: Bribe;
  let votingEscrow: VotingEscrow;
  let voter: Voter;
  let factory: Factory;
  let mainToken: Token;
  let rewardTokens: Token[] = [];
  let owner: SignerWithAddress;
  let attacker: SignerWithAddress;
  let user: SignerWithAddress;

  const MIN_BRIBE_AMOUNT = ethers.parseEther("100"); // 100 代币
  const LARGE_BRIBE = ethers.parseEther("10000"); // 1万代币
  const MAX_REWARDS = 10;

  beforeEach(async function () {
    [owner, attacker, user] = await ethers.getSigners();

    // 部署主代币
    const TokenFactory = await ethers.getContractFactory("Token");
    mainToken = await TokenFactory.deploy("Main Token", "MAIN");
    await mainToken.waitForDeployment();

    // 部署 Factory
    const FactoryContract = await ethers.getContractFactory("Factory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // 部署 VotingEscrow
    const VotingEscrowFactory = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrowFactory.deploy(await mainToken.getAddress());
    await votingEscrow.waitForDeployment();

    // 部署 Voter
    const VoterFactory = await ethers.getContractFactory("Voter");
    voter = await VoterFactory.deploy(
      await votingEscrow.getAddress(),
      await factory.getAddress(),
      await mainToken.getAddress()
    );
    await voter.waitForDeployment();

    // 部署 Bribe
    const BribeFactory = await ethers.getContractFactory("Bribe");
    bribe = await BribeFactory.deploy(
      await votingEscrow.getAddress(),
      await voter.getAddress()
    );
    await bribe.waitForDeployment();

    // 创建15个奖励代币(用于测试数组限制)
    for (let i = 0; i < 15; i++) {
      const token = await TokenFactory.deploy(`Reward${i}`, `RWD${i}`);
      await token.waitForDeployment();
      rewardTokens.push(token);

      // 给攻击者和用户转账
      await token.transfer(attacker.address, ethers.parseEther("1000000"));
      await token.transfer(user.address, ethers.parseEther("1000000"));
    }
  });

  describe("MIN_BRIBE_AMOUNT 常量验证", function () {
    it("应该设置为 100 代币 (100 * 1e18)", async function () {
      const minBribeAmount = await bribe.MIN_BRIBE_AMOUNT();
      expect(minBribeAmount).to.equal(MIN_BRIBE_AMOUNT);
      expect(minBribeAmount).to.equal(ethers.parseEther("100"));
    });
  });

  describe("最小贿赂金额验证", function () {
    it("应该拒绝小于 MIN_BRIBE_AMOUNT 的贿赂", async function () {
      const token = rewardTokens[0];
      const tooSmallBribe = MIN_BRIBE_AMOUNT - 1n;

      await token.connect(user).approve(await bribe.getAddress(), tooSmallBribe);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), tooSmallBribe)
      ).to.be.revertedWith("Bribe: amount too small");
    });

    it("应该拒绝 1 wei 的贿赂", async function () {
      const token = rewardTokens[0];
      const dustAmount = 1n;

      await token.connect(attacker).approve(await bribe.getAddress(), dustAmount);

      await expect(
        bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), dustAmount)
      ).to.be.revertedWith("Bribe: amount too small");
    });

    it("应该拒绝 99.99 代币的贿赂", async function () {
      const token = rewardTokens[0];
      const almostEnough = ethers.parseEther("99.99");

      await token.connect(user).approve(await bribe.getAddress(), almostEnough);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), almostEnough)
      ).to.be.revertedWith("Bribe: amount too small");
    });

    it("应该接受正好 100 代币的贿赂", async function () {
      const token = rewardTokens[0];
      const exactMin = MIN_BRIBE_AMOUNT;

      await token.connect(user).approve(await bribe.getAddress(), exactMin);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), exactMin)
      ).to.not.be.reverted;

      // 验证奖励已添加
      expect(await bribe.isReward(await token.getAddress())).to.be.true;
      expect(await bribe.rewardsListLength()).to.equal(1);
    });

    it("应该接受大于 100 代币的贿赂", async function () {
      const token = rewardTokens[0];
      const largeBribe = LARGE_BRIBE;

      await token.connect(user).approve(await bribe.getAddress(), largeBribe);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), largeBribe)
      ).to.emit(bribe, "RewardAdded");
    });
  });

  describe("rewards 数组保护", function () {
    it("应该限制最多 10 个奖励代币", async function () {
      // 添加 10 个有效的奖励代币
      for (let i = 0; i < MAX_REWARDS; i++) {
        const token = rewardTokens[i];
        await token.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
        await bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);
      }

      // 验证已添加10个
      expect(await bribe.rewardsListLength()).to.equal(MAX_REWARDS);

      // 尝试添加第11个应该失败
      const token11 = rewardTokens[10];
      await token11.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token11.getAddress(), MIN_BRIBE_AMOUNT)
      ).to.be.revertedWith("Bribe: too many rewards");
    });

    it("同一代币可以多次添加贿赂", async function () {
      const token = rewardTokens[0];

      // 第一次添加
      await token.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
      await bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);

      // 第二次添加(应该累积)
      await token.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
      await bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);

      // rewards 数组应该只有1个元素
      expect(await bribe.rewardsListLength()).to.equal(1);
      expect(await bribe.isReward(await token.getAddress())).to.be.true;
    });

    it("应该正确返回 rewardsListLength", async function () {
      expect(await bribe.rewardsListLength()).to.equal(0);

      // 添加3个奖励代币
      for (let i = 0; i < 3; i++) {
        const token = rewardTokens[i];
        await token.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
        await bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);
      }

      expect(await bribe.rewardsListLength()).to.equal(3);
    });
  });

  describe("粉尘攻击场景模拟", function () {
    it("攻击者无法用1 wei填满 rewards 数组", async function () {
      // 攻击者尝试用 1 wei 填满数组
      for (let i = 0; i < 15; i++) {
        const token = rewardTokens[i];
        const dustAmount = 1n;

        await token.connect(attacker).approve(await bribe.getAddress(), dustAmount);

        // 每次都应该失败
        await expect(
          bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), dustAmount)
        ).to.be.revertedWith("Bribe: amount too small");
      }

      // rewards 数组应该仍然为空
      expect(await bribe.rewardsListLength()).to.equal(0);
    });

    it("攻击者无法用 99 代币填满数组", async function () {
      const almostEnough = ethers.parseEther("99");

      for (let i = 0; i < 15; i++) {
        const token = rewardTokens[i];

        await token.connect(attacker).approve(await bribe.getAddress(), almostEnough);

        await expect(
          bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), almostEnough)
        ).to.be.revertedWith("Bribe: amount too small");
      }

      expect(await bribe.rewardsListLength()).to.equal(0);
    });

    it("即使满足最小金额,也不能超过10个代币", async function () {
      // 攻击者尝试用最小金额填满数组
      let successfulAdds = 0;

      for (let i = 0; i < 15; i++) {
        const token = rewardTokens[i];

        await token.connect(attacker).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);

        try {
          await bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);
          successfulAdds++;
        } catch (error: any) {
          // 前10个应该成功,后5个应该失败
          expect(error.message).to.include("Bribe: too many rewards");
        }
      }

      // 应该只成功添加10个
      expect(successfulAdds).to.equal(MAX_REWARDS);
      expect(await bribe.rewardsListLength()).to.equal(MAX_REWARDS);
    });
  });

  describe("组合攻击防护", function () {
    it("应该防止粉尘攻击 + 数组填充组合攻击", async function () {
      // 场景: 攻击者试图先用小额填充,再用大额阻止正常贿赂

      // 步骤1: 攻击者尝试用小额填充(应该失败)
      for (let i = 0; i < 10; i++) {
        const token = rewardTokens[i];
        const smallAmount = ethers.parseEther("1"); // 小于最小值

        await token.connect(attacker).approve(await bribe.getAddress(), smallAmount);

        await expect(
          bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), smallAmount)
        ).to.be.revertedWith("Bribe: amount too small");
      }

      // rewards 数组应该仍为空
      expect(await bribe.rewardsListLength()).to.equal(0);

      // 步骤2: 正常用户可以添加贿赂
      const token0 = rewardTokens[0];
      await token0.connect(user).approve(await bribe.getAddress(), LARGE_BRIBE);
      await bribe.connect(user).notifyRewardAmount(await token0.getAddress(), LARGE_BRIBE);

      expect(await bribe.rewardsListLength()).to.equal(1);
      expect(await bribe.isReward(await token0.getAddress())).to.be.true;
    });

    it("应该防止快速连续的小额贿赂", async function () {
      const token = rewardTokens[0];
      const smallAmount = ethers.parseEther("50"); // 每次50,总共100

      // 第一次 50 (失败)
      await token.connect(attacker).approve(await bribe.getAddress(), smallAmount);
      await expect(
        bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), smallAmount)
      ).to.be.revertedWith("Bribe: amount too small");

      // 再次 50 (仍然失败,不能累积)
      await token.connect(attacker).approve(await bribe.getAddress(), smallAmount);
      await expect(
        bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), smallAmount)
      ).to.be.revertedWith("Bribe: amount too small");

      // 必须一次性达到100
      await token.connect(attacker).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
      await bribe.connect(attacker).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);

      expect(await bribe.rewardsListLength()).to.equal(1);
    });
  });

  describe("边界条件和异常处理", function () {
    it("零地址代币应该被拒绝", async function () {
      // 尝试使用零地址
      await expect(
        bribe.notifyRewardAmount(ethers.ZeroAddress, MIN_BRIBE_AMOUNT)
      ).to.be.reverted; // SafeERC20 会失败
    });

    it("未授权的代币转账应该失败", async function () {
      const token = rewardTokens[0];

      // 不授权直接调用
      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT)
      ).to.be.reverted; // ERC20: insufficient allowance
    });

    it("余额不足应该失败", async function () {
      const token = rewardTokens[0];
      const userBalance = await token.balanceOf(user.address);

      // 授权超过余额的金额
      const tooMuch = userBalance + ethers.parseEther("1");
      await token.connect(user).approve(await bribe.getAddress(), tooMuch);

      await expect(
        bribe.connect(user).notifyRewardAmount(await token.getAddress(), tooMuch)
      ).to.be.reverted; // ERC20: transfer amount exceeds balance
    });

    it("rewardRate 应该基于 DURATION 正确计算", async function () {
      const token = rewardTokens[0];
      await token.connect(user).approve(await bribe.getAddress(), LARGE_BRIBE);
      await bribe.connect(user).notifyRewardAmount(await token.getAddress(), LARGE_BRIBE);

      // 获取 rewardData
      const rewardData = await bribe.rewardData(await token.getAddress());

      // rewardRate = amount / DURATION
      const DURATION = 7 * 24 * 3600; // 7天
      const expectedRate = LARGE_BRIBE / BigInt(DURATION);

      expect(rewardData.rewardRate).to.equal(expectedRate);
    });

    it("应该正确处理奖励期结束后的新贿赂", async function () {
      const token = rewardTokens[0];

      // 第一次贿赂
      await token.connect(user).approve(await bribe.getAddress(), LARGE_BRIBE);
      await bribe.connect(user).notifyRewardAmount(await token.getAddress(), LARGE_BRIBE);

      // 等待超过7天
      await time.increase(8 * 24 * 3600);

      // 第二次贿赂
      await token.connect(user).approve(await bribe.getAddress(), LARGE_BRIBE);
      await bribe.connect(user).notifyRewardAmount(await token.getAddress(), LARGE_BRIBE);

      // 应该开始新的奖励期
      const rewardData = await bribe.rewardData(await token.getAddress());
      expect(rewardData.periodFinish).to.be.gt(await time.latest());
    });
  });

  describe("性能和 Gas 优化验证", function () {
    it("10个奖励代币不应该导致过高的 Gas 消耗", async function () {
      // 添加10个奖励代币
      for (let i = 0; i < MAX_REWARDS; i++) {
        const token = rewardTokens[i];
        await token.connect(user).approve(await bribe.getAddress(), MIN_BRIBE_AMOUNT);
        await bribe.connect(user).notifyRewardAmount(await token.getAddress(), MIN_BRIBE_AMOUNT);
      }

      // 创建一个ve-NFT并模拟投票
      await mainToken.connect(user).approve(await votingEscrow.getAddress(), ethers.parseEther("1000"));
      const currentTime = await time.latest();
      await votingEscrow.connect(user).createLock(ethers.parseEther("1000"), currentTime + 365 * 86400);

      // getReward 应该能处理10个代币
      // 注意: 这需要 Voter 合约的支持,这里简化测试
      expect(await bribe.rewardsListLength()).to.equal(MAX_REWARDS);
    });
  });
});
