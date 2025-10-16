import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署 ve(3,3) DEX 合约...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. 部署治理代币
  console.log("📦 部署治理代币...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("Solidly Token", "SOLID");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ Token 部署完成:", tokenAddress, "\n");

  // 2. 部署工厂合约
  console.log("📦 部署 Factory...");
  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory 部署完成:", factoryAddress, "\n");

  // 3. 部署 WETH (或使用现有的)
  console.log("📦 部署 WETH...");
  // 这里使用简单的 ERC20 模拟 WETH,实际应该使用 WETH9
  const weth = await Token.deploy("Wrapped ETH", "WETH");
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("✅ WETH 部署完成:", wethAddress, "\n");

  // 4. 部署路由合约
  console.log("📦 部署 Router...");
  const Router = await ethers.getContractFactory("Router");
  const router = await Router.deploy(factoryAddress, wethAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router 部署完成:", routerAddress, "\n");

  // 输出部署摘要
  console.log("=" .repeat(60));
  console.log("🎉 部署完成!\n");
  console.log("📋 合约地址汇总:");
  console.log("   Token  :", tokenAddress);
  console.log("   Factory:", factoryAddress);
  console.log("   WETH   :", wethAddress);
  console.log("   Router :", routerAddress);
  console.log("=" .repeat(60));
  console.log("\n💡 下一步:");
  console.log("   1. 将合约地址更新到前端 .env 文件");
  console.log("   2. 在区块浏览器上验证合约");
  console.log("   3. 部署治理系统合约 (VotingEscrow, Voter, Gauge, etc.)");
  console.log("   4. 设置 Token 的 minter 权限");

  // 保存部署信息到文件
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      Token: tokenAddress,
      Factory: factoryAddress,
      WETH: wethAddress,
      Router: routerAddress,
    },
  };

  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n✅ 部署信息已保存到: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
