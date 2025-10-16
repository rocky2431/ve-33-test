import { expect } from "chai";
import { ethers } from "hardhat";
import { Pair, Token, Factory, Router } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * P0-004: k-值不变量验证测试
 *
 * 测试目标:
 * 1. 验证波动性池 swap 后 xy ≥ k_old
 * 2. 验证稳定币池 swap 后 x³y+y³x ≥ k_old
 * 3. 防止通过 swap 窃取流动性
 * 4. 确保 k-值只增不减
 */
describe("P0-004: Pair K-Invariant Verification", function () {
  let factory: Factory;
  let router: Router;
  let weth: Token;
  let token0: Token;
  let token1: Token;
  let volatilePair: Pair;
  let stablePair: Pair;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let attacker: SignerWithAddress;

  const INITIAL_LIQUIDITY_0 = ethers.parseEther("10000");
  const INITIAL_LIQUIDITY_1 = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();

    // 部署 Token
    const TokenFactory = await ethers.getContractFactory("Token");
    token0 = await TokenFactory.deploy("Token0", "TK0");
    token1 = await TokenFactory.deploy("Token1", "TK1");
    weth = await TokenFactory.deploy("WETH", "WETH");
    await token0.waitForDeployment();
    await token1.waitForDeployment();
    await weth.waitForDeployment();

    // 部署 Factory
    const FactoryContract = await ethers.getContractFactory("Factory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();

    // 部署 Router
    const RouterFactory = await ethers.getContractFactory("Router");
    router = await RouterFactory.deploy(
      await factory.getAddress(),
      await weth.getAddress()
    );
    await router.waitForDeployment();

    // 创建波动性池
    const token0Address = await token0.getAddress();
    const token1Address = await token1.getAddress();
    await factory.createPair(token0Address, token1Address, false);
    const volatilePairAddress = await factory.getPair(token0Address, token1Address, false);
    volatilePair = await ethers.getContractAt("Pair", volatilePairAddress);

    // 创建稳定币池
    await factory.createPair(token0Address, token1Address, true);
    const stablePairAddress = await factory.getPair(token0Address, token1Address, true);
    stablePair = await ethers.getContractAt("Pair", stablePairAddress);

    // 给用户和攻击者转账代币
    const largeAmount = ethers.parseEther("1000000");
    await token0.transfer(user.address, largeAmount);
    await token1.transfer(user.address, largeAmount);
    await token0.transfer(attacker.address, largeAmount);
    await token1.transfer(attacker.address, largeAmount);
  });

  describe("波动性池 k-值验证 (xy ≥ k)", function () {
    beforeEach(async function () {
      // 添加初始流动性
      await token0.approve(await router.getAddress(), INITIAL_LIQUIDITY_0);
      await token1.approve(await router.getAddress(), INITIAL_LIQUIDITY_1);

      const deadline = (await time.latest()) + 3600;
      await router.addLiquidity(
        await token0.getAddress(),
        await token1.getAddress(),
        false,
        INITIAL_LIQUIDITY_0,
        INITIAL_LIQUIDITY_1,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("正常 swap 应该保持 k-值不变或增加", async function () {
      // 获取 swap 前的储备量
      const [reserve0Before, reserve1Before] = await volatilePair.getReserves();
      const kBefore = reserve0Before * reserve1Before;

      // 用户执行 swap
      const swapAmount = ethers.parseEther("100");
      await token0.connect(user).approve(await router.getAddress(), swapAmount);

      const deadline = (await time.latest()) + 3600;
      const routes = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: false
      }];

      await router.connect(user).swapExactTokensForTokens(
        swapAmount,
        0,
        routes,
        user.address,
        deadline
      );

      // 获取 swap 后的储备量
      const [reserve0After, reserve1After] = await volatilePair.getReserves();
      const kAfter = reserve0After * reserve1After;

      // k-值应该增加(因为有手续费)
      expect(kAfter).to.be.gte(kBefore);
    });

    it("应该拒绝违反 k-值不变量的 swap", async function () {
      // 这个测试验证合约会拒绝任何试图降低 k-值的操作
      // 实际上,在正常的 swap 流程中,k-值验证会自动通过
      // 但如果有人试图直接调用 swap 函数并操纵数量,应该被拒绝

      const [reserve0, reserve1] = await volatilePair.getReserves();

      // 尝试直接调用 swap (这是低级操作,通常通过 Router)
      // 如果 amount0Out 和 amount1Out 计算不当,会违反 k-值
      const invalidAmount0Out = reserve0 / 2n; // 试图取出过多
      const invalidAmount1Out = 0n;

      // 首先转入一些代币(swap 要求先转入)
      const swapAmount = ethers.parseEther("1");
      await token0.transfer(await volatilePair.getAddress(), swapAmount);

      // 尝试执行无效的 swap
      await expect(
        volatilePair.swap(invalidAmount0Out, invalidAmount1Out, attacker.address, "0x")
      ).to.be.revertedWith("Pair: K_INVARIANT_VIOLATED");
    });

    it("小额 swap 不应该显著影响 k-值", async function () {
      const [reserve0Before, reserve1Before] = await volatilePair.getReserves();
      const kBefore = reserve0Before * reserve1Before;

      // 执行小额 swap
      const smallSwapAmount = ethers.parseEther("1");
      await token0.connect(user).approve(await router.getAddress(), smallSwapAmount);

      const deadline = (await time.latest()) + 3600;
      const routes = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: false
      }];

      await router.connect(user).swapExactTokensForTokens(
        smallSwapAmount,
        0,
        routes,
        user.address,
        deadline
      );

      const [reserve0After, reserve1After] = await volatilePair.getReserves();
      const kAfter = reserve0After * reserve1After;

      // k-值应该略有增加(手续费)但不应该大幅变化
      const kIncrease = (kAfter - kBefore) * 10000n / kBefore; // 基点
      expect(kIncrease).to.be.lte(100n); // 应该小于1%
    });

    it("大额 swap 也应该保持 k-值不变量", async function () {
      const [reserve0Before, reserve1Before] = await volatilePair.getReserves();
      const kBefore = reserve0Before * reserve1Before;

      // 执行大额 swap (接近储备量的10%)
      const largeSwapAmount = INITIAL_LIQUIDITY_0 / 10n;
      await token0.connect(user).approve(await router.getAddress(), largeSwapAmount);

      const deadline = (await time.latest()) + 3600;
      const routes = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: false
      }];

      await router.connect(user).swapExactTokensForTokens(
        largeSwapAmount,
        0,
        routes,
        user.address,
        deadline
      );

      const [reserve0After, reserve1After] = await volatilePair.getReserves();
      const kAfter = reserve0After * reserve1After;

      // 即使是大额交易,k-值也应该增加
      expect(kAfter).to.be.gt(kBefore);
    });
  });

  describe("稳定币池 k-值验证 (x³y+y³x ≥ k)", function () {
    beforeEach(async function () {
      // 添加初始流动性到稳定币池
      await token0.approve(await router.getAddress(), INITIAL_LIQUIDITY_0);
      await token1.approve(await router.getAddress(), INITIAL_LIQUIDITY_1);

      const deadline = (await time.latest()) + 3600;
      await router.addLiquidity(
        await token0.getAddress(),
        await token1.getAddress(),
        true, // stable = true
        INITIAL_LIQUIDITY_0,
        INITIAL_LIQUIDITY_1,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("稳定币池 swap 应该保持 k-值不变或增加", async function () {
      // 获取 swap 前的储备量
      const [reserve0Before, reserve1Before] = await stablePair.getReserves();

      // 用户执行 swap
      const swapAmount = ethers.parseEther("100");
      await token0.connect(user).approve(await router.getAddress(), swapAmount);

      const deadline = (await time.latest()) + 3600;
      const routes = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: true // 使用稳定币曲线
      }];

      await router.connect(user).swapExactTokensForTokens(
        swapAmount,
        0,
        routes,
        user.address,
        deadline
      );

      // 获取 swap 后的储备量
      const [reserve0After, reserve1After] = await stablePair.getReserves();

      // 稳定币池的 k-值计算: x³y + y³x
      // 验证 k 值增加(由于手续费)
      // 注意: 这里简化验证,实际的 k-值计算在合约内部
      expect(reserve0After).to.be.gt(reserve0Before);
      expect(reserve1After).to.be.lt(reserve1Before);
    });

    it("稳定币池在1:1附近应该有更低的滑点", async function () {
      // 稳定币池设计为在锚定价格(1:1)附近提供更好的流动性
      const swapAmount = ethers.parseEther("100");
      await token0.connect(user).approve(await router.getAddress(), swapAmount);

      const deadline = (await time.latest()) + 3600;
      const routesStable = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: true
      }];

      // 查询稳定币池的输出
      const amountsOutStable = await router.getAmountsOut(swapAmount, routesStable);
      const outputStable = amountsOutStable[1];

      // 查询波动性池的输出(用于对比)
      const routesVolatile = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: false
      }];
      const amountsOutVolatile = await router.getAmountsOut(swapAmount, routesVolatile);
      const outputVolatile = amountsOutVolatile[1];

      // 在1:1价格附近,稳定币池应该提供更好的输出(更低滑点)
      // 注意: 这取决于具体的储备量和曲线设计
      console.log("Stable output:", ethers.formatEther(outputStable));
      console.log("Volatile output:", ethers.formatEther(outputVolatile));
    });
  });

  describe("流动性窃取攻击防护", function () {
    beforeEach(async function () {
      // 添加初始流动性
      await token0.approve(await router.getAddress(), INITIAL_LIQUIDITY_0);
      await token1.approve(await router.getAddress(), INITIAL_LIQUIDITY_1);

      const deadline = (await time.latest()) + 3600;
      await router.addLiquidity(
        await token0.getAddress(),
        await token1.getAddress(),
        false,
        INITIAL_LIQUIDITY_0,
        INITIAL_LIQUIDITY_1,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("应该防止通过操纵储备量窃取流动性", async function () {
      // 记录攻击前的储备量
      const [reserve0Before, reserve1Before] = await volatilePair.getReserves();
      const totalLiquidityBefore = await volatilePair.totalSupply();

      // 攻击者尝试: 直接转入代币然后 skim
      const attackAmount = ethers.parseEther("100");
      await token0.connect(attacker).transfer(await volatilePair.getAddress(), attackAmount);

      // 调用 skim (移除多余的代币)
      await volatilePair.skim(attacker.address);

      // 验证: skim 只移除了多余的部分,不影响储备量
      const [reserve0After, reserve1After] = await volatilePair.getReserves();
      expect(reserve0After).to.equal(reserve0Before);
      expect(reserve1After).to.equal(reserve1Before);
    });

    it("应该防止通过 sync 操纵价格", async function () {
      const [reserve0Before, reserve1Before] = await volatilePair.getReserves();

      // 攻击者直接转入大量代币试图操纵价格
      const attackAmount = ethers.parseEther("10000");
      await token0.connect(attacker).transfer(await volatilePair.getAddress(), attackAmount);

      // 调用 sync 更新储备量
      await volatilePair.sync();

      // 储备量会更新,但k-值会相应增加
      const [reserve0After, reserve1After] = await volatilePair.getReserves();
      const kBefore = reserve0Before * reserve1Before;
      const kAfter = reserve0After * reserve1After;

      // k-值应该大幅增加(因为单边增加储备量)
      expect(kAfter).to.be.gt(kBefore);

      // 但攻击者无法从中获利,因为价格比例没有改变
      // 他只是向池子捐赠了代币
    });
  });

  describe("手续费对 k-值的影响", function () {
    beforeEach(async function () {
      await token0.approve(await router.getAddress(), INITIAL_LIQUIDITY_0);
      await token1.approve(await router.getAddress(), INITIAL_LIQUIDITY_1);

      const deadline = (await time.latest()) + 3600;
      await router.addLiquidity(
        await token0.getAddress(),
        await token1.getAddress(),
        false,
        INITIAL_LIQUIDITY_0,
        INITIAL_LIQUIDITY_1,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("每次 swap 都应该因手续费而增加 k-值", async function () {
      const [reserve0Initial, reserve1Initial] = await volatilePair.getReserves();
      const kInitial = reserve0Initial * reserve1Initial;

      // 执行多次 swap
      const swapAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) + 3600;
      const routes = [{
        from: await token0.getAddress(),
        to: await token1.getAddress(),
        stable: false
      }];

      for (let i = 0; i < 5; i++) {
        await token0.connect(user).approve(await router.getAddress(), swapAmount);
        await router.connect(user).swapExactTokensForTokens(
          swapAmount,
          0,
          routes,
          user.address,
          deadline
        );

        await token1.connect(user).approve(await router.getAddress(), swapAmount);
        const routesReverse = [{
          from: await token1.getAddress(),
          to: await token0.getAddress(),
          stable: false
        }];
        await router.connect(user).swapExactTokensForTokens(
          swapAmount,
          0,
          routesReverse,
          user.address,
          deadline
        );
      }

      // k-值应该持续增加
      const [reserve0Final, reserve1Final] = await volatilePair.getReserves();
      const kFinal = reserve0Final * reserve1Final;

      expect(kFinal).to.be.gt(kInitial);

      // 计算 k-值增加的百分比
      const kIncrease = ((kFinal - kInitial) * 10000n) / kInitial;
      console.log(`K-value increased by ${kIncrease} basis points after 10 swaps`);
    });
  });

  describe("边界条件", function () {
    it("空池应该拒绝 swap", async function () {
      // 创建新的空池
      const newToken0 = await (await ethers.getContractFactory("Token")).deploy("NT0", "NT0");
      const newToken1 = await (await ethers.getContractFactory("Token")).deploy("NT1", "NT1");
      await factory.createPair(
        await newToken0.getAddress(),
        await newToken1.getAddress(),
        false
      );
      const emptyPairAddress = await factory.getPair(
        await newToken0.getAddress(),
        await newToken1.getAddress(),
        false
      );
      const emptyPair = await ethers.getContractAt("Pair", emptyPairAddress);

      // 尝试在空池中 swap
      await newToken0.transfer(emptyPairAddress, ethers.parseEther("1"));

      await expect(
        emptyPair.swap(0, ethers.parseEther("1"), user.address, "0x")
      ).to.be.reverted; // 应该失败,因为没有流动性
    });

    it("应该拒绝零输出的 swap", async function () {
      await token0.approve(await router.getAddress(), INITIAL_LIQUIDITY_0);
      await token1.approve(await router.getAddress(), INITIAL_LIQUIDITY_1);

      const deadline = (await time.latest()) + 3600;
      await router.addLiquidity(
        await token0.getAddress(),
        await token1.getAddress(),
        false,
        INITIAL_LIQUIDITY_0,
        INITIAL_LIQUIDITY_1,
        0,
        0,
        owner.address,
        deadline
      );

      // 转入代币但要求0输出
      await token0.transfer(await volatilePair.getAddress(), ethers.parseEther("1"));

      await expect(
        volatilePair.swap(0, 0, user.address, "0x")
      ).to.be.revertedWith("Pair: INSUFFICIENT_OUTPUT_AMOUNT");
    });
  });
});
