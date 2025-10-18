import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  // 旧Router系统的地址
  const VOTER_ADDRESS = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'

  console.log('为池子创建Gauge')
  console.log('部署者地址:', deployer.address)
  console.log('Voter合约:', VOTER_ADDRESS)
  console.log()

  const Voter = await ethers.getContractAt('Voter', VOTER_ADDRESS)

  // 需要创建Gauge的池子
  const pools = [
    {
      name: 'STE/STF 波动池',
      address: '0x05D7b76CA7EA9a85E4fDd75612467AFb05c2f72F',
    },
    {
      name: 'STCX/STE 波动池',
      address: '0x64E4d20A8a462E45cd6002A9c3E1274cAd8859cD',
    },
    {
      name: 'SRT/STE 波动池',
      address: '0x586b1A35E954c975d7BdB1388ee30679E9DF22E3',
    },
  ]

  console.log(`准备为 ${pools.length} 个池子创建Gauge\n`)

  for (const pool of pools) {
    console.log(`\n处理: ${pool.name}`)
    console.log(`池子地址: ${pool.address}`)

    // 检查是否已有Gauge
    const existingGauge = await Voter.gauges(pool.address)
    if (existingGauge && existingGauge !== ethers.ZeroAddress) {
      console.log(`  ⚠️  该池子已有Gauge: ${existingGauge}`)
      continue
    }

    try {
      console.log('  📝 创建Gauge交易中...')
      const tx = await Voter.createGauge(pool.address, {
        gasLimit: 3000000,
      })

      console.log(`  ⏳ 等待交易确认: ${tx.hash}`)
      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        // 获取新创建的Gauge地址
        const newGauge = await Voter.gauges(pool.address)
        console.log(`  ✅ Gauge创建成功!`)
        console.log(`  Gauge地址: ${newGauge}`)
        console.log(`  交易哈希: ${tx.hash}`)
      } else {
        console.log(`  ❌ 交易失败`)
      }
    } catch (error: any) {
      console.log(`  ❌ 创建失败:`, error.message)
    }
  }

  // 验证结果
  console.log('\n\n📊 最终统计:')
  const gaugesLength = await Voter.gaugesLength()
  console.log(`Gauge总数: ${gaugesLength}`)

  console.log('\n所有Gauge列表:')
  for (let i = 0; i < Number(gaugesLength); i++) {
    const gaugeAddr = await Voter.allGauges(i)
    const poolAddr = await Voter.poolForGauge(gaugeAddr)

    const poolInfo = pools.find((p) => p.address.toLowerCase() === poolAddr.toLowerCase())
    const poolName = poolInfo ? poolInfo.name : '其他池子'

    console.log(`\nGauge ${i + 1}: ${poolName}`)
    console.log(`  Gauge地址: ${gaugeAddr}`)
    console.log(`  Pool地址: ${poolAddr}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
