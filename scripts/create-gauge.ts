import { ethers } from "hardhat";

async function main() {
  console.log("🎯 开始创建 Gauge...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);

  // 从环境变量读取已部署的合约地址
  const VOTER_ADDRESS = process.env.VITE_CONTRACT_VOTER;
  const FACTORY_ADDRESS = process.env.VITE_CONTRACT_FACTORY;
  const SRT_ADDRESS = process.env.VITE_CONTRACT_TOKEN;
  const WSRT_ADDRESS = process.env.VITE_CONTRACT_WETH;

  if (!VOTER_ADDRESS || !FACTORY_ADDRESS || !SRT_ADDRESS || !WSRT_ADDRESS) {
    throw new Error("请先在.env文件中配置合约地址");
  }

  console.log("\n📋 使用的合约地址:");
  console.log("   Voter:", VOTER_ADDRESS);
  console.log("   Factory:", FACTORY_ADDRESS);
  console.log("   SRT:", SRT_ADDRESS);
  console.log("   WSRT:", WSRT_ADDRESS);

  // 连接合约
  const Voter = await ethers.getContractFactory("Voter");
  const voter = Voter.attach(VOTER_ADDRESS);

  const Factory = await ethers.getContractFactory("Factory");
  const factory = Factory.attach(FACTORY_ADDRESS);

  // 获取 SRT/WSRT 池地址
  console.log("\n🔍 查询 SRT/WSRT 池子地址...");
  const poolAddress = await factory.getPair(SRT_ADDRESS, WSRT_ADDRESS, false);

  if (poolAddress === ethers.ZeroAddress) {
    throw new Error("SRT/WSRT 池子不存在，请先创建流动性池");
  }

  console.log("   ✅ 找到池子:", poolAddress);

  // 检查 Gauge 是否已存在
  console.log("\n🔍 检查 Gauge 是否已存在...");
  const existingGauge = await voter.gauges(poolAddress);

  if (existingGauge !== ethers.ZeroAddress) {
    console.log("   ⚠️  Gauge 已存在:", existingGauge);
    console.log("\n✅ 无需创建新的 Gauge");
    return;
  }

  // 创建 Gauge
  console.log("\n🏗️  创建 Gauge...");
  const tx = await voter.createGauge(poolAddress);
  console.log("   📝 交易哈希:", tx.hash);

  const receipt = await tx.wait();
  console.log("   ✅ 交易确认");

  // 获取新创建的 Gauge 地址
  const gaugeAddress = await voter.gauges(poolAddress);
  console.log("   🎉 Gauge 创建成功:", gaugeAddress);

  // 获取 Bribe 地址
  const bribeAddress = await voter.bribes(gaugeAddress);
  console.log("   💰 Bribe 地址:", bribeAddress);

  console.log("\n" + "=".repeat(60));
  console.log("🎊 Gauge 创建完成!");
  console.log("=".repeat(60));
  console.log("\n📋 摘要:");
  console.log("   池子地址  :", poolAddress);
  console.log("   Gauge地址 :", gaugeAddress);
  console.log("   Bribe地址 :", bribeAddress);
  console.log("\n💡 现在用户可以:");
  console.log("   1. 对该池子进行投票");
  console.log("   2. 在 Gauge 中质押 LP token 获得奖励");
  console.log("   3. 在 Bribe 中存入奖励代币吸引投票\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 创建失败:", error);
    process.exit(1);
  });
