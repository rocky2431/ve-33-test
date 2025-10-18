import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  // 旧Router系统的地址
  const OLD_FACTORY = '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29'
  const OLD_VOTER = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'

  console.log('检查旧Router系统的池子\n')
  console.log('Factory:', OLD_FACTORY)
  console.log('Voter:', OLD_VOTER)

  const Factory = await ethers.getContractAt('Factory', OLD_FACTORY)
  const Voter = await ethers.getContractAt('Voter', OLD_VOTER)

  // 检查Factory中的所有池子
  const allPairsLength = await Factory.allPairsLength()
  console.log('\n📊 Factory统计:')
  console.log('总池子数:', allPairsLength.toString())

  if (allPairsLength > 0n) {
    console.log('\n所有池子:')
    for (let i = 0; i < Number(allPairsLength); i++) {
      const pairAddr = await Factory.allPairs(i)
      const Pair = await ethers.getContractAt('Pair', pairAddr)

      const token0 = await Pair.token0()
      const token1 = await Pair.token1()
      const stable = await Pair.stable()
      const reserves = await Pair.getReserves()
      const totalSupply = await Pair.totalSupply()

      console.log(`\n池子 ${i + 1}: ${pairAddr}`)
      console.log(`  Token0: ${token0}`)
      console.log(`  Token1: ${token1}`)
      console.log(`  类型: ${stable ? '稳定池' : '波动池'}`)
      console.log(`  储备金: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`)
      console.log(`  LP总量: ${ethers.formatEther(totalSupply)}`)

      // 检查是否有Gauge
      const gaugeAddr = await Voter.gauges(pairAddr)
      if (gaugeAddr && gaugeAddr !== ethers.ZeroAddress) {
        console.log(`  ✅ Gauge: ${gaugeAddr}`)
      } else {
        console.log(`  ❌ Gauge: 未创建`)
      }
    }
  }

  // 检查Voter中的Gauge数量
  const gaugesLength = await Voter.gaugesLength()
  console.log('\n\n📊 Voter统计:')
  console.log('Gauge数量:', gaugesLength.toString())

  if (gaugesLength > 0n) {
    console.log('\n所有Gauge:')
    for (let i = 0; i < Number(gaugesLength); i++) {
      const gaugeAddr = await Voter.allGauges(i)
      const poolAddr = await Voter.poolForGauge(gaugeAddr)

      console.log(`\nGauge ${i + 1}:`)
      console.log(`  Gauge地址: ${gaugeAddr}`)
      console.log(`  Pool地址: ${poolAddr}`)
    }
  }

  // 获取测试代币配置
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))
  const tokens = deployInfo.tokens

  console.log('\n\n🔍 检查测试代币池子:')
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const tokenA = tokens[i]
      const tokenB = tokens[j]

      console.log(`\n${tokenA.symbol}/${tokenB.symbol}:`)

      // 检查波动池
      const volatilePair = await Factory.getPair(tokenA.address, tokenB.address, false)
      if (volatilePair !== ethers.ZeroAddress) {
        console.log(`  ✅ 波动池: ${volatilePair}`)

        const Pair = await ethers.getContractAt('Pair', volatilePair)
        const reserves = await Pair.getReserves()
        console.log(`     储备金: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`)

        // 检查Gauge
        const gaugeAddr = await Voter.gauges(volatilePair)
        if (gaugeAddr && gaugeAddr !== ethers.ZeroAddress) {
          console.log(`     ✅ Gauge已创建: ${gaugeAddr}`)
        } else {
          console.log(`     ❌ Gauge未创建`)
        }
      } else {
        console.log(`  ❌ 波动池: 不存在`)
      }

      // 检查稳定池
      const stablePair = await Factory.getPair(tokenA.address, tokenB.address, true)
      if (stablePair !== ethers.ZeroAddress) {
        console.log(`  ✅ 稳定池: ${stablePair}`)

        const Pair = await ethers.getContractAt('Pair', stablePair)
        const reserves = await Pair.getReserves()
        console.log(`     储备金: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`)

        // 检查Gauge
        const gaugeAddr = await Voter.gauges(stablePair)
        if (gaugeAddr && gaugeAddr !== ethers.ZeroAddress) {
          console.log(`     ✅ Gauge已创建: ${gaugeAddr}`)
        } else {
          console.log(`     ❌ Gauge未创建`)
        }
      } else {
        console.log(`  ❌ 稳定池: 不存在`)
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
