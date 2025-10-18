import { ethers } from 'hardhat'

async function main() {
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')

  const voterAddress = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'
  const voterABI = [
    'function gaugesLength() external view returns (uint256)',
    'function allGauges(uint256) external view returns (address)',
    'function poolForGauge(address) external view returns (address)',
  ]

  const voter = new ethers.Contract(voterAddress, voterABI, provider)

  console.log('🔍 查询Voter合约中的所有Gauge...')
  console.log('Voter地址:', voterAddress)
  console.log()

  try {
    const gaugesLength = await voter.gaugesLength()
    console.log('📊 Gauge总数:', gaugesLength.toString())
    console.log()

    if (gaugesLength === 0n) {
      console.log('❌ 没有找到任何Gauge')
      return
    }

    const pairABI = [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function stable() external view returns (bool)',
      'function getReserves() external view returns (uint112, uint112, uint32)',
      'function totalSupply() external view returns (uint256)',
      'function symbol() external view returns (string)',
    ]

    console.log('📋 Gauge和池子列表:')
    console.log('='.repeat(120))

    for (let i = 0; i < Number(gaugesLength); i++) {
      const gaugeAddress = await voter.allGauges(i)
      const poolAddress = await voter.poolForGauge(gaugeAddress)

      console.log(`\nGauge #${i + 1}:`)
      console.log('  Gauge地址:', gaugeAddress)
      console.log('  池子地址:', poolAddress)

      if (poolAddress && poolAddress !== ethers.ZeroAddress) {
        const pair = new ethers.Contract(poolAddress, pairABI, provider)

        const [token0, token1, stable, reserves, totalSupply, symbol] = await Promise.all([
          pair.token0(),
          pair.token1(),
          pair.stable(),
          pair.getReserves(),
          pair.totalSupply(),
          pair.symbol().catch(() => 'LP'),
        ])

        console.log('  Token0:', token0)
        console.log('  Token1:', token1)
        console.log('  类型:', stable ? '稳定币池' : '波动性池')
        console.log('  LP Symbol:', symbol)
        console.log('  Reserve0:', ethers.formatEther(reserves[0]))
        console.log('  Reserve1:', ethers.formatEther(reserves[1]))
        console.log('  总供应:', ethers.formatEther(totalSupply))

        if (reserves[0] > 0n && reserves[1] > 0n) {
          console.log('  比例 (Token1/Token0):', (Number(reserves[1]) / Number(reserves[0])).toFixed(6))
          console.log('  状态: ✅ 有流动性')
        } else {
          console.log('  状态: ⚠️ 空池子（Gauge已创建但池子没有流动性）')
        }
      } else {
        console.log('  状态: ❌ 池子不存在')
      }

      console.log('-'.repeat(120))
    }

    console.log()
    console.log('✅ 查询完成')
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
