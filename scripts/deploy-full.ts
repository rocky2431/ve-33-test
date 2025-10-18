import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署完整的 ve(3,3) DEX 系统...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ==================== 核心 AMM 层 ====================
  console.log("=" .repeat(60));
  console.log("📦 第一阶段: 部署核心 AMM 合约");
  console.log("=" .repeat(60) + "\n");

  // 1. 部署治理代币
  console.log("1️⃣  部署治理代币...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("Solidly Token", "SOLID");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("   ✅ Token:", tokenAddress, "\n");

  // 2. 部署工厂合约
  console.log("2️⃣  部署 Factory...");
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory:", factoryAddress, "\n");

  // 3. 部署 WETH
  console.log("3️⃣  部署 WETH...");
  const weth = await Token.deploy("Wrapped ETH", "WETH");
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("   ✅ WETH:", wethAddress, "\n");

  // 4. 部署路由合约
  console.log("4️⃣  部署 Router...");
  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(factoryAddress, wethAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("   ✅ Router:", routerAddress, "\n");

  // ==================== 治理层 ====================
  console.log("=" .repeat(60));
  console.log("📦 第二阶段: 部署 ve(3,3) 治理系统");
  console.log("=" .repeat(60) + "\n");

  // 5. 部署 VotingEscrow (ve-NFT)
  console.log("5️⃣  部署 VotingEscrow (ve-NFT)...");
  const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
  const votingEscrow = await VotingEscrow.deploy(tokenAddress);
  await votingEscrow.waitForDeployment();
  const votingEscrowAddress = await votingEscrow.getAddress();
  console.log("   ✅ VotingEscrow:", votingEscrowAddress, "\n");

  // 6. 部署 Voter
  console.log("6️⃣  部署 Voter...");
  const Voter = await ethers.getContractFactory("Voter");
  const voter = await Voter.deploy(votingEscrowAddress, factoryAddress, tokenAddress);
  await voter.waitForDeployment();
  const voterAddress = await voter.getAddress();
  console.log("   ✅ Voter:", voterAddress, "\n");

  // 7. 部署 RewardsDistributor
  console.log("7️⃣  部署 RewardsDistributor...");
  const RewardsDistributor = await ethers.getContractFactory("RewardsDistributor");
  const rewardsDistributor = await RewardsDistributor.deploy(votingEscrowAddress);
  await rewardsDistributor.waitForDeployment();
  const rewardsDistributorAddress = await rewardsDistributor.getAddress();
  console.log("   ✅ RewardsDistributor:", rewardsDistributorAddress, "\n");

  // 8. 部署 Minter
  console.log("8️⃣  部署 Minter...");
  const Minter = await ethers.getContractFactory("Minter");
  const minter = await Minter.deploy(tokenAddress, votingEscrowAddress);
  await minter.waitForDeployment();
  const minterAddress = await minter.getAddress();
  console.log("   ✅ Minter:", minterAddress, "\n");

  // ==================== 初始化配置 ====================
  console.log("=" .repeat(60));
  console.log("⚙️  第三阶段: 初始化系统配置");
  console.log("=" .repeat(60) + "\n");

  console.log("🔗 设置合约关联...");

  // 设置 VotingEscrow 的 voter
  console.log("   - VotingEscrow.setVoter()");
  await votingEscrow.setVoter(voterAddress);

  // 设置 Voter 的 minter
  console.log("   - Voter.setMinter()");
  await voter.setMinter(minterAddress);

  // 设置 Minter 的 voter 和 rewardsDistributor
  console.log("   - Minter.setVoter()");
  await minter.setVoter(voterAddress);
  console.log("   - Minter.setRewardsDistributor()");
  await minter.setRewardsDistributor(rewardsDistributorAddress);

  // 设置 Token 的 minter
  console.log("   - Token.setMinter()");
  await token.setMinter(minterAddress);

  console.log("   ✅ 系统配置完成（包括 30/70 排放分配）\n");

  // ==================== 部署摘要 ====================
  console.log("=" .repeat(60));
  console.log("🎉 部署成功!");
  console.log("=" .repeat(60) + "\n");

  console.log("📋 核心 AMM 层:");
  console.log("   Token     :", tokenAddress);
  console.log("   Factory   :", factoryAddress);
  console.log("   Router    :", routerAddress);
  console.log("   WETH      :", wethAddress);

  console.log("\n📋 治理系统层:");
  console.log("   VotingEscrow       :", votingEscrowAddress);
  console.log("   Voter              :", voterAddress);
  console.log("   RewardsDistributor :", rewardsDistributorAddress);
  console.log("   Minter             :", minterAddress);

  console.log("\n" + "=" .repeat(60));
  console.log("💡 下一步操作:");
  console.log("=" .repeat(60));
  console.log("\n1️⃣  前端配置:");
  console.log("   - 将合约地址更新到 frontend/.env");
  console.log("   - 启动前端: npm run frontend:dev");

  console.log("\n2️⃣  区块链浏览器:");
  console.log("   - 验证所有合约代码");
  console.log("   - 命令: npx hardhat verify --network <network> <address>");

  console.log("\n3️⃣  测试功能:");
  console.log("   - 创建测试交易对");
  console.log("   - 添加流动性");
  console.log("   - 测试交换功能");
  console.log("   - 测试锁仓和投票");

  console.log("\n4️⃣  启动 Minter:");
  console.log("   - 调用 minter.start() 开始代币增发");

  // 保存部署信息
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      core: {
        Token: tokenAddress,
        Factory: factoryAddress,
        Router: routerAddress,
        WETH: wethAddress,
      },
      governance: {
        VotingEscrow: votingEscrowAddress,
        Voter: voterAddress,
        RewardsDistributor: rewardsDistributorAddress,
        Minter: minterAddress,
      },
    },
  };

  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `full-deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n✅ 部署信息已保存: deployments/${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
