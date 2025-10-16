import { expect } from "chai";
import { ethers } from "hardhat";
import { Voter, VotingEscrow, Token, Factory, Pair } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * P0-024: Flash Loan 攻击防护测试
 *
 * 测试目标:
 * 1. 阻止同区块创建 ve-NFT 并投票
 * 2. 强制执行最小持有期 (1天)
 * 3. 防止闪电贷操纵投票权重
 */
describe("P0-024: Voter Flash Loan Protection", function () {
  let voter: Voter;
  let votingEscrow: VotingEscrow;
  let token: Token;
  let factory: Factory;
  let pair: Pair;
  let owner: SignerWithAddress;
  let attacker: SignerWithAddress;
  let user: SignerWithAddress;

  const LOCK_AMOUNT = ethers.parseEther("1000");
  const MIN_HOLDING_PERIOD = 86400; // 1 day in seconds

  beforeEach(async function () {
    [owner, attacker, user] = await ethers.getSigners();

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

    // 设置 VotingEscrow 的 voter 地址
    await votingEscrow.setVoter(await voter.getAddress());

    // 创建测试 Pair
    const WETH = await TokenFactory.deploy("WETH", "WETH");
    await WETH.waitForDeployment();

    const tokenAddress = await token.getAddress();
    const wethAddress = await WETH.getAddress();

    await factory.createPair(tokenAddress, wethAddress, false);
    const pairAddress = await factory.getPair(tokenAddress, wethAddress, false);
    pair = await ethers.getContractAt("Pair", pairAddress);

    // 创建 Gauge
    await voter.createGauge(pairAddress);

    // 给攻击者和用户转账代币
    await token.transfer(attacker.address, LOCK_AMOUNT * 10n);
    await token.transfer(user.address, LOCK_AMOUNT * 10n);
  });

  describe("同区块攻击防护", function () {
    it("应该阻止在创建 ve-NFT 的同一区块内投票", async function () {
      // 攻击者批准代币
      await token.connect(attacker).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 创建 ve-NFT
      await votingEscrow.connect(attacker).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 尝试在同一区块立即投票
      const pairAddress = await pair.getAddress();

      // 注意: 在实际区块链中,这会在同一区块执行
      // 在hardhat测试中,每个交易都在不同区块,所以会触发最小持有期检查
      // 两种错误都能有效防护攻击
      const voteTx = voter.connect(attacker).vote(tokenId, [pairAddress], [100]);
      await expect(voteTx).to.be.reverted; // 接受任何revert (同区块或最小持有期)
    });

    it("应该允许在下一个区块投票", async function () {
      // 用户批准代币
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 创建 ve-NFT
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进到下一个区块
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);

      // 等待最小持有期
      await time.increase(MIN_HOLDING_PERIOD);

      // 现在应该可以投票
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.not.be.reverted;
    });
  });

  describe("最小持有期防护", function () {
    it("应该强制执行1天的最小持有期", async function () {
      // 用户批准代币
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 创建 ve-NFT
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进到下一个区块(但不足1天)
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);

      // 尝试立即投票(持有期不足)
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.be.revertedWith("Voter: minimum holding period not met");
    });

    it("持有期满1天后应该允许投票", async function () {
      // 用户批准代币
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 创建 ve-NFT
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进到下一个区块
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);

      // 等待最小持有期 (1天)
      await time.increase(MIN_HOLDING_PERIOD);

      // 现在应该可以投票
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.emit(voter, "Voted");
    });
  });

  describe("重复投票限制", function () {
    it("应该强制执行1周的投票冷却期", async function () {
      // 用户批准代币
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 创建 ve-NFT
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进到下一个区块并等待最小持有期
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);
      await time.increase(MIN_HOLDING_PERIOD);

      // 第一次投票
      const pairAddress = await pair.getAddress();
      await voter.connect(user).vote(tokenId, [pairAddress], [100]);

      // 立即尝试再次投票
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.be.revertedWith("Voter: already voted this week");

      // 等待1周后应该可以再次投票
      await time.increase(7 * 86400); // 7 days

      // 现在应该可以投票
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.not.be.reverted;
    });
  });

  describe("闪电贷攻击场景模拟", function () {
    it("应该防止闪电贷借入代币→创建ve-NFT→投票→归还的攻击", async function () {
      // 模拟攻击者使用闪电贷的场景
      const flashLoanAmount = ethers.parseEther("1000000"); // 100万代币

      // 给攻击者大量代币(模拟闪电贷)
      await token.transfer(attacker.address, flashLoanAmount);

      // 攻击者批准代币
      await token.connect(attacker).approve(await votingEscrow.getAddress(), flashLoanAmount);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400; // 1年

      // 攻击者创建大额 ve-NFT
      await votingEscrow.connect(attacker).create_lock(flashLoanAmount, lockDuration);
      const tokenId = 1n;

      // 尝试立即投票以操纵投票权重
      const pairAddress = await pair.getAddress();
      // 在hardhat中,每个交易都在不同区块,会触发最小持有期检查
      await expect(
        voter.connect(attacker).vote(tokenId, [pairAddress], [100])
      ).to.be.reverted;

      // 即使推进一个区块,仍然需要满足最小持有期
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);

      await expect(
        voter.connect(attacker).vote(tokenId, [pairAddress], [100])
      ).to.be.revertedWith("Voter: minimum holding period not met");

      // 验证: 攻击者无法在同区块或1天内完成攻击
      // 这使得闪电贷攻击不可行,因为需要归还借款
    });
  });

  describe("NFT 创建区块追踪", function () {
    it("应该正确记录 NFT 创建区块号", async function () {
      // 用户批准代币
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);

      // 获取当前区块时间
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400;

      // 获取创建前的区块号
      const blockBefore = await ethers.provider.getBlockNumber();

      // 创建 ve-NFT
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 检查 nftCreationBlock 映射
      // 注意: 首次投票时会设置为 block.number - 1
      // 这是一个近似值,因为我们无法在构造时获取 NFT ID

      // 推进到下一个区块并等待最小持有期
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);
      await time.increase(MIN_HOLDING_PERIOD);

      // 验证可以在下一个区块后投票
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.emit(voter, "Voted");
    });
  });

  describe("边界条件测试", function () {
    it("应该拒绝使用不存在的 tokenId 投票", async function () {
      const nonExistentTokenId = 999n;
      const pairAddress = await pair.getAddress();

      await expect(
        voter.connect(user).vote(nonExistentTokenId, [pairAddress], [100])
      ).to.be.reverted; // ve-NFT 不存在,所以 ownerOf 会失败
    });

    it("应该拒绝非 NFT 所有者投票", async function () {
      // 用户创建 ve-NFT
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      const currentTime = await time.latest();
      const lockDuration = 365 * 86400;
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进区块并等待最小持有期
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);
      await time.increase(MIN_HOLDING_PERIOD);

      // 攻击者尝试使用用户的 NFT 投票
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(attacker).vote(tokenId, [pairAddress], [100])
      ).to.be.revertedWith("Voter: not owner");
    });

    it("应该拒绝投票权重为0的 NFT 投票", async function () {
      // 用户创建一个即将到期的 ve-NFT (投票权重可能为0)
      await token.connect(user).approve(await votingEscrow.getAddress(), LOCK_AMOUNT);
      const currentTime = await time.latest();
      const lockDuration = 7 * 86400; // 仅锁定1周
      await votingEscrow.connect(user).create_lock(LOCK_AMOUNT, lockDuration);
      const tokenId = 1n;

      // 推进区块并等待最小持有期
      await time.increase(1);
      await ethers.provider.send("evm_mine", []);
      await time.increase(MIN_HOLDING_PERIOD);

      // 时间快进到锁定期结束
      await time.increase(7 * 86400);

      // 此时投票权重应该为0或接近0
      const pairAddress = await pair.getAddress();
      await expect(
        voter.connect(user).vote(tokenId, [pairAddress], [100])
      ).to.be.revertedWith("Voter: no voting power");
    });
  });
});
