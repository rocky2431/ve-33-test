import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署到 BSC Testnet...\n");

  const [deployer] = await ethers.getSigners();
  const testAddress = "0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207"; // 测试地址

  console.log("📝 部署账户:", deployer.address);
  console.log("🧪 测试地址:", testAddress);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // ==================== 代币参数 ====================
  const TOKEN_SUPPLY = ethers.parseEther("10000000000"); // 100亿枚
  const POOL_LIQUIDITY = ethers.parseEther("1000000"); // 100万枚用于池子

  // ==================== 核心 AMM 层 ====================
  console.log("=" .repeat(60));
  console.log("📦 第一阶段: 部署核心 AMM 合约");
  console.log("=" .repeat(60) + "\n");

  // 1. 部署 SRT 代币（治理代币）
  console.log("1️⃣  部署 SRT 代币...");
  const Token = await ethers.getContractFactory("Token");
  const srt = await Token.deploy("SRT Token", "SRT");
  await srt.waitForDeployment();
  const srtAddress = await srt.getAddress();
  console.log("   ✅ SRT:", srtAddress);
  console.log("   📊 供应量:", ethers.formatEther(TOKEN_SUPPLY), "SRT\n");

  // 2. 部署工厂合约
  console.log("2️⃣  部署 Factory...");
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory:", factoryAddress, "\n");

  // 3. 部署 WSRT (Wrapped SRT)
  console.log("3️⃣  部署 WSRT (Wrapped SRT)...");
  const wsrt = await Token.deploy("Wrapped SRT", "WSRT");
  await wsrt.waitForDeployment();
  const wsrtAddress = await wsrt.getAddress();
  console.log("   ✅ WSRT:", wsrtAddress);
  console.log("   📊 供应量:", ethers.formatEther(TOKEN_SUPPLY), "WSRT\n");

  // 4. 部署路由合约
  console.log("4️⃣  部署 Router...");
  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(factoryAddress, wsrtAddress);
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
  const votingEscrow = await VotingEscrow.deploy(srtAddress);
  await votingEscrow.waitForDeployment();
  const votingEscrowAddress = await votingEscrow.getAddress();
  console.log("   ✅ VotingEscrow:", votingEscrowAddress, "\n");

  // 6. 部署 Voter
  console.log("6️⃣  部署 Voter...");
  const Voter = await ethers.getContractFactory("Voter");
  const voter = await Voter.deploy(votingEscrowAddress, factoryAddress, srtAddress);
  await voter.waitForDeployment();
  const voterAddress = await voter.getAddress();
  console.log("   ✅ Voter:", voterAddress, "\n");

  // 7. 部署 RewardsDistributor
  console.log("7️⃣  部署 RewardsDistributor...");
  const RewardsDistributor = await ethers.getContractFactory("RewardsDistributor");
  const rewardsDistributor = await RewardsDistributor.deploy(votingEscrowAddress, srtAddress);
  await rewardsDistributor.waitForDeployment();
  const rewardsDistributorAddress = await rewardsDistributor.getAddress();
  console.log("   ✅ RewardsDistributor:", rewardsDistributorAddress, "\n");

  // 8. 部署 Minter
  console.log("8️⃣  部署 Minter...");
  const Minter = await ethers.getContractFactory("Minter");
  const minter = await Minter.deploy(srtAddress, votingEscrowAddress);
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
  console.log("   - SRT.setMinter()");
  await srt.setMinter(minterAddress);

  console.log("   ✅ 系统配置完成\n");

  // ==================== 创建流动性池 ====================
  console.log("=" .repeat(60));
  console.log("💧 第四阶段: 创建初始流动性池");
  console.log("=" .repeat(60) + "\n");

  console.log("🏊 创建 SRT/WSRT 流动性池...");

  // 检查代币余额
  const srtBalanceBefore = await srt.balanceOf(deployer.address);
  const wsrtBalanceBefore = await wsrt.balanceOf(deployer.address);
  console.log("   - SRT 余额:", ethers.formatEther(srtBalanceBefore));
  console.log("   - WSRT 余额:", ethers.formatEther(wsrtBalanceBefore));

  // 批准 Router 使用代币（使用最大额度）
  console.log("   - 批准 SRT 给 Router");
  await srt.approve(routerAddress, ethers.MaxUint256);
  console.log("   - 批准 WSRT 给 Router");
  await wsrt.approve(routerAddress, ethers.MaxUint256);

  // 添加流动性
  console.log("   - 添加流动性到 SRT/WSRT 池");
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期

  const addLiquidityTx = await router.addLiquidity(
    srtAddress,
    wsrtAddress,
    false, // stable pool
    POOL_LIQUIDITY,
    POOL_LIQUIDITY,
    0, // min amounts
    0,
    deployer.address,
    deadline,
    {
      gasLimit: 5000000 // 手动设置 gas limit
    }
  );
  await addLiquidityTx.wait();

  console.log("   ✅ 流动性池创建成功");
  console.log("   📊 SRT 池子流动性:", ethers.formatEther(POOL_LIQUIDITY));
  console.log("   📊 WSRT 池子流动性:", ethers.formatEther(POOL_LIQUIDITY), "\n");

  // ==================== 转移剩余代币 ====================
  console.log("=" .repeat(60));
  console.log("💸 第五阶段: 转移剩余代币到测试地址");
  console.log("=" .repeat(60) + "\n");

  // 计算剩余代币
  const srtBalance = await srt.balanceOf(deployer.address);
  const wsrtBalance = await wsrt.balanceOf(deployer.address);

  console.log("📤 转移 SRT 代币...");
  console.log("   - 当前余额:", ethers.formatEther(srtBalance));
  console.log("   - 转移到:", testAddress);
  await srt.transfer(testAddress, srtBalance);
  console.log("   ✅ SRT 转移完成\n");

  console.log("📤 转移 WSRT 代币...");
  console.log("   - 当前余额:", ethers.formatEther(wsrtBalance));
  console.log("   - 转移到:", testAddress);
  await wsrt.transfer(testAddress, wsrtBalance);
  console.log("   ✅ WSRT 转移完成\n");

  // 验证转账
  const testSrtBalance = await srt.balanceOf(testAddress);
  const testWsrtBalance = await wsrt.balanceOf(testAddress);
  console.log("✅ 测试地址最终余额:");
  console.log("   - SRT:", ethers.formatEther(testSrtBalance));
  console.log("   - WSRT:", ethers.formatEther(testWsrtBalance), "\n");

  // ==================== 部署摘要 ====================
  console.log("=" .repeat(60));
  console.log("🎉 部署成功!");
  console.log("=" .repeat(60) + "\n");

  console.log("📋 核心 AMM 层:");
  console.log("   SRT Token :", srtAddress);
  console.log("   Factory   :", factoryAddress);
  console.log("   Router    :", routerAddress);
  console.log("   WSRT      :", wsrtAddress);

  console.log("\n📋 治理系统层:");
  console.log("   VotingEscrow       :", votingEscrowAddress);
  console.log("   Voter              :", voterAddress);
  console.log("   RewardsDistributor :", rewardsDistributorAddress);
  console.log("   Minter             :", minterAddress);

  console.log("\n📋 代币分配:");
  console.log("   测试地址 SRT  :", ethers.formatEther(testSrtBalance));
  console.log("   测试地址 WSRT :", ethers.formatEther(testWsrtBalance));
  console.log("   流动性池 SRT  :", ethers.formatEther(POOL_LIQUIDITY));
  console.log("   流动性池 WSRT :", ethers.formatEther(POOL_LIQUIDITY));

  // 保存部署信息
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: "bsc-testnet",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    testAddress: testAddress,
    timestamp: new Date().toISOString(),
    tokens: {
      SRT: {
        address: srtAddress,
        totalSupply: ethers.formatEther(TOKEN_SUPPLY),
        poolLiquidity: ethers.formatEther(POOL_LIQUIDITY),
        testBalance: ethers.formatEther(testSrtBalance),
      },
      WSRT: {
        address: wsrtAddress,
        totalSupply: ethers.formatEther(TOKEN_SUPPLY),
        poolLiquidity: ethers.formatEther(POOL_LIQUIDITY),
        testBalance: ethers.formatEther(testWsrtBalance),
      },
    },
    contracts: {
      core: {
        SRT: srtAddress,
        Factory: factoryAddress,
        Router: routerAddress,
        WSRT: wsrtAddress,
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

  const filename = `bsc-testnet-deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n✅ 部署信息已保存: deployments/${filename}\n`);

  console.log("\n" + "=" .repeat(60));
  console.log("💡 下一步操作:");
  console.log("=" .repeat(60));
  console.log("\n1️⃣  更新前端配置:");
  console.log(`   VITE_CONTRACT_TOKEN=${srtAddress}`);
  console.log(`   VITE_CONTRACT_FACTORY=${factoryAddress}`);
  console.log(`   VITE_CONTRACT_ROUTER=${routerAddress}`);
  console.log(`   VITE_CONTRACT_WETH=${wsrtAddress}`);
  console.log(`   VITE_CONTRACT_VOTING_ESCROW=${votingEscrowAddress}`);
  console.log(`   VITE_CONTRACT_VOTER=${voterAddress}`);
  console.log(`   VITE_CONTRACT_MINTER=${minterAddress}`);

  console.log("\n2️⃣  在 BscScan 验证合约:");
  console.log(`   npx hardhat verify --network bscTestnet ${srtAddress} "SRT Token" "SRT"`);
  console.log(`   npx hardhat verify --network bscTestnet ${wsrtAddress} "Wrapped SRT" "WSRT"`);
  console.log(`   npx hardhat verify --network bscTestnet ${factoryAddress}`);
  console.log(`   npx hardhat verify --network bscTestnet ${routerAddress} ${factoryAddress} ${wsrtAddress}`);

  console.log("\n3️⃣  测试地址已获得代币:");
  console.log(`   ${testAddress}`);
  console.log(`   - SRT: ${ethers.formatEther(testSrtBalance)}`);
  console.log(`   - WSRT: ${ethers.formatEther(testWsrtBalance)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
