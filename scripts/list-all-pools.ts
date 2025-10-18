import { ethers } from 'hardhat'

async function main() {
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')

  const factoryAddress = '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29' // 旧Factory - 前端实际使用的
  const factoryABI = [
    'function allPairsLength() external view returns (uint256)',
    'function allPairs(uint256) external view returns (address)',
  ]

  const factory = new ethers.Contract(factoryAddress, factoryABI, provider)

  console.log('🔍 查询BSC测试网上的所有池子...')
  console.log('Factory地址:', factoryAddress)
  console.log()

  try {
    const pairsLength = await factory.allPairsLength()
    console.log('📊 池子总数:', pairsLength.toString())
    console.log()

    if (pairsLength === 0n) {
      console.log('❌ 没有找到任何池子')
      return
    }

    const pairABI = [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function stable() external view returns (bool)',
      'function getReserves() external view returns (uint112, uint112, uint32)',
      'function totalSupply() external view returns (uint256)',
    ]

    console.log('📋 池子列表:')
    console.log('=' .repeat(120))

    for (let i = 0; i < Number(pairsLength); i++) {
      const pairAddress = await factory.allPairs(i)
      const pair = new ethers.Contract(pairAddress, pairABI, provider)

      const [token0, token1, stable, reserves, totalSupply] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.stable(),
        pair.getReserves(),
        pair.totalSupply(),
      ])

      console.log(`\n池子 #${i + 1}:`)
      console.log('  地址:', pairAddress)
      console.log('  Token0:', token0)
      console.log('  Token1:', token1)
      console.log('  类型:', stable ? '稳定币池' : '波动性池')
      console.log('  Reserve0:', ethers.formatEther(reserves[0]))
      console.log('  Reserve1:', ethers.formatEther(reserves[1]))
      console.log('  总供应:', ethers.formatEther(totalSupply))
      console.log('  比例 (Token1/Token0):', reserves[0] > 0n ? Number(reserves[1]) / Number(reserves[0]) : 'N/A')
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
