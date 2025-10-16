import { expect } from "chai";
import { ethers } from "hardhat";
import { Factory, Token } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Factory", function () {
  let factory: Factory;
  let tokenA: Token;
  let tokenB: Token;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // 部署工厂合约
    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();

    // 部署测试代币
    const Token = await ethers.getContractFactory("Token");
    tokenA = await Token.deploy("Token A", "TKA");
    tokenB = await Token.deploy("Token B", "TKB");
  });

  describe("部署", function () {
    it("应该正确设置管理员", async function () {
      expect(await factory.admin()).to.equal(owner.address);
    });

    it("初始状态应该未暂停", async function () {
      expect(await factory.isPaused()).to.equal(false);
    });

    it("初始交易对数量应该为 0", async function () {
      expect(await factory.allPairsLength()).to.equal(0);
    });
  });

  describe("创建交易对", function () {
    it("应该能创建波动性交易对", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await expect(factory.createPair(tokenAAddress, tokenBAddress, false))
        .to.emit(factory, "PairCreated");

      expect(await factory.allPairsLength()).to.equal(1);

      const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress, false);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
      expect(await factory.isPair(pairAddress)).to.equal(true);
    });

    it("应该能创建稳定币交易对", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await expect(factory.createPair(tokenAAddress, tokenBAddress, true))
        .to.emit(factory, "PairCreated");

      const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress, true);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("相同代币对可以创建稳定和波动两个版本", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await factory.createPair(tokenAAddress, tokenBAddress, false);
      await factory.createPair(tokenAAddress, tokenBAddress, true);

      expect(await factory.allPairsLength()).to.equal(2);

      const volatilePair = await factory.getPair(tokenAAddress, tokenBAddress, false);
      const stablePair = await factory.getPair(tokenAAddress, tokenBAddress, true);

      expect(volatilePair).to.not.equal(stablePair);
    });

    it("不应该允许创建相同的交易对", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await factory.createPair(tokenAAddress, tokenBAddress, false);

      await expect(
        factory.createPair(tokenAAddress, tokenBAddress, false)
      ).to.be.revertedWith("Factory: PAIR_EXISTS");
    });

    it("不应该允许创建相同代币的交易对", async function () {
      const tokenAAddress = await tokenA.getAddress();

      await expect(
        factory.createPair(tokenAAddress, tokenAAddress, false)
      ).to.be.revertedWith("Factory: IDENTICAL_ADDRESSES");
    });

    it("不应该允许使用零地址", async function () {
      const tokenAAddress = await tokenA.getAddress();

      await expect(
        factory.createPair(tokenAAddress, ethers.ZeroAddress, false)
      ).to.be.revertedWith("Factory: ZERO_ADDRESS");
    });

    it("暂停时不应该允许创建交易对", async function () {
      await factory.setPause(true);

      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      await expect(
        factory.createPair(tokenAAddress, tokenBAddress, false)
      ).to.be.revertedWith("Factory: paused");
    });
  });

  describe("管理功能", function () {
    it("只有管理员可以设置暂停状态", async function () {
      await expect(factory.connect(user).setPause(true))
        .to.be.revertedWith("Factory: not admin");

      await factory.setPause(true);
      expect(await factory.isPaused()).to.equal(true);
    });

    it("只有管理员可以更换管理员", async function () {
      await expect(factory.connect(user).setAdmin(user.address))
        .to.be.revertedWith("Factory: not admin");

      await factory.setAdmin(user.address);
      expect(await factory.admin()).to.equal(user.address);
    });

    it("不应该允许设置零地址为管理员", async function () {
      await expect(factory.setAdmin(ethers.ZeroAddress))
        .to.be.revertedWith("Factory: zero address");
    });
  });

  describe("查询功能", function () {
    it("应该正确返回交易对代码哈希", async function () {
      const hash = await factory.pairCodeHash();
      expect(hash).to.be.properHex(64);
    });

    it("对于不存在的交易对应该返回零地址", async function () {
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      const pair = await factory.getPair(tokenAAddress, tokenBAddress, false);
      expect(pair).to.equal(ethers.ZeroAddress);
    });
  });
});
