import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const config = JSON.parse(fs.readFileSync('./deployed-contracts.json', 'utf-8'))
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))

  const Factory = await ethers.getContractAt('Factory', config.factory)
  const tokens = deployInfo.tokens

  console.log('🔍 检查所有可能的池子组合\n')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const tokenA = tokens[i]
      const tokenB = tokens[j]

      console.log(`检查 ${tokenA.symbol}/${tokenB.symbol}:`)

      // 检查波动池
      const volatilePair = await Factory.getPair(tokenA.address, tokenB.address, false)
      if (volatilePair !== ethers.ZeroAddress) {
        console.log(`  ✅ 波动池: ${volatilePair}`)
        successCount++

        // 检查池子状态
        const Pair = await ethers.getContractAt('Pair', volatilePair)
        const reserves = await Pair.getReserves()
        const totalSupply = await Pair.totalSupply()
        console.log(`     储备金: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`)
        console.log(`     LP总量: ${ethers.formatEther(totalSupply)}`)
      } else {
        console.log(`  ❌ 波动池: 不存在`)
        failCount++
      }

      // 检查稳定池
      const stablePair = await Factory.getPair(tokenA.address, tokenB.address, true)
      if (stablePair !== ethers.ZeroAddress) {
        console.log(`  ✅ 稳定池: ${stablePair}`)
        successCount++

        // 检查池子状态
        const Pair = await ethers.getContractAt('Pair', stablePair)
        const reserves = await Pair.getReserves()
        const totalSupply = await Pair.totalSupply()
        console.log(`     储备金: ${ethers.formatEther(reserves[0])} / ${ethers.formatEther(reserves[1])}`)
        console.log(`     LP总量: ${ethers.formatEther(totalSupply)}`)
      } else {
        console.log(`  ❌ 稳定池: 不存在`)
        failCount++
      }

      console.log()
    }
  }

  console.log('\n📊 统计:')
  console.log(`已创建的池子: ${successCount}`)
  console.log(`未创建的池子: ${failCount}`)
  console.log(`总计: ${successCount + failCount} (应该是12个)`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
