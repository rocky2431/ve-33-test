import { ethers } from "hardhat";

async function main() {
  const voterAddress = "0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D";
  const poolAddress = "0x302153709D851c9290237ad491E488aD28a5BE9E";

  const Voter = await ethers.getContractFactory("Voter");
  const voter = Voter.attach(voterAddress);

  console.log("🔍 检查 Gauge 状态...\n");

  // 查询 gauge 数量
  const length = await voter.gaugesLength();
  console.log("📊 Gauge 总数:", length.toString());

  // 查询所有 gauge
  for (let i = 0; i < Number(length); i++) {
    const gaugeAddr = await voter.allGauges(i);
    console.log(`\n   Gauge ${i}:`, gaugeAddr);

    const pool = await voter.poolForGauge(gaugeAddr);
    console.log(`   对应池子:`, pool);

    const bribe = await voter.bribes(gaugeAddr);
    console.log(`   Bribe地址:`, bribe);
  }

  // 直接查询池子的gauge
  console.log("\n🔍 查询 SRT/WSRT 池子的 Gauge:");
  const gaugeForPool = await voter.gauges(poolAddress);
  console.log("   Gauge地址:", gaugeForPool);

  if (gaugeForPool !== ethers.ZeroAddress) {
    const bribe = await voter.bribes(gaugeForPool);
    console.log("   Bribe地址:", bribe);
    console.log("\n✅ Gauge 创建成功！");
  } else {
    console.log("\n❌ Gauge 不存在");
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
