import { ethers } from 'hardhat'
import * as fs from 'fs'

/**
 * 为测试代币添加流动性
 * 创建所有可能的代币对（稳定池 + 波动池）
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('🚀 部署者地址:', deployer.address)

  // 读取已部署的代币信息
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))
  const tokens = deployInfo.tokens

  console.log('\n📊 已部署代币:')
  tokens.forEach((t: any) => {
    console.log(`${t.symbol}: ${t.address}`)
  })

  // 读取合约配置
  const configPath = './deployed-contracts.json'
  if (!fs.existsSync(configPath)) {
    console.error('❌ 请先部署主合约 (npm run deploy)')
    process.exit(1)
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const ROUTER_ADDRESS = config.router
  const FACTORY_ADDRESS = config.factory

  console.log('\n📝 合约地址:')
  console.log('Router:', ROUTER_ADDRESS)
  console.log('Factory:', FACTORY_ADDRESS)

  // 获取合约实例
  const Router = await ethers.getContractAt('Router', ROUTER_ADDRESS)
  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)

  // 每个池子的流动性金额 (使用较小的金额以便分配到多个池子)
  // 每个代币参与6个池子(3个配对×2种类型)，部署者有10亿代币
  // 所以每个池子最多: 10亿/6 ≈ 1.66亿，为了安全设置为1.5亿
  const LIQUIDITY_PER_POOL = ethers.parseEther('150000000') // 1.5亿代币每池
  const deadline = Math.floor(Date.now() / 1000) + 1200 // 20分钟

  console.log('\n💧 流动性配置:')
  console.log('每池金额:', ethers.formatEther(LIQUIDITY_PER_POOL), 'tokens')

  // 创建的池子信息
  const pools: any[] = []

  // 生成所有代币对组合
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const tokenA = tokens[i]
      const tokenB = tokens[j]

      console.log(`\n========================================`)
      console.log(`💱 创建交易对: ${tokenA.symbol}/${tokenB.symbol}`)
      console.log(`========================================`)

      // 获取代币合约
      const TokenA = await ethers.getContractAt('SimpleToken', tokenA.address)
      const TokenB = await ethers.getContractAt('SimpleToken', tokenB.address)

      // 授权 Router
      console.log('\n1️⃣ 授权 Router...')
      const approveA1 = await TokenA.approve(ROUTER_ADDRESS, LIQUIDITY_PER_POOL * 2n)
      await approveA1.wait()
      const approveB1 = await TokenB.approve(ROUTER_ADDRESS, LIQUIDITY_PER_POOL * 2n)
      await approveB1.wait()
      console.log('✅ 授权完成')

      // 创建并添加波动性池
      console.log('\n2️⃣ 创建波动性池 (Volatile Pool)...')
      try {
        const addLiquidityVolatile = await Router.addLiquidity(
          tokenA.address,
          tokenB.address,
          false, // stable = false (波动性池)
          LIQUIDITY_PER_POOL,
          LIQUIDITY_PER_POOL,
          0,
          0,
          deployer.address,
          deadline
        )
        await addLiquidityVolatile.wait()

        const pairVolatile = await Factory.getPair(tokenA.address, tokenB.address, false)
        console.log(`✅ 波动性池创建: ${pairVolatile}`)

        pools.push({
          tokenA: tokenA.symbol,
          tokenB: tokenB.symbol,
          type: 'volatile',
          address: pairVolatile,
          liquidity: ethers.formatEther(LIQUIDITY_PER_POOL),
        })
      } catch (error) {
        console.error('❌ 波动性池创建失败:', error)
      }

      // 创建并添加稳定币池
      console.log('\n3️⃣ 创建稳定币池 (Stable Pool)...')
      try {
        const addLiquidityStable = await Router.addLiquidity(
          tokenA.address,
          tokenB.address,
          true, // stable = true (稳定币池)
          LIQUIDITY_PER_POOL,
          LIQUIDITY_PER_POOL,
          0,
          0,
          deployer.address,
          deadline
        )
        await addLiquidityStable.wait()

        const pairStable = await Factory.getPair(tokenA.address, tokenB.address, true)
        console.log(`✅ 稳定币池创建: ${pairStable}`)

        pools.push({
          tokenA: tokenA.symbol,
          tokenB: tokenB.symbol,
          type: 'stable',
          address: pairStable,
          liquidity: ethers.formatEther(LIQUIDITY_PER_POOL),
        })
      } catch (error) {
        console.error('❌ 稳定币池创建失败:', error)
      }
    }
  }

  // 保存池子信息
  const poolsInfo = {
    network: 'bscTestnet',
    deployer: deployer.address,
    router: ROUTER_ADDRESS,
    factory: FACTORY_ADDRESS,
    liquidityPerPool: LIQUIDITY_PER_POOL.toString(),
    pools,
    timestamp: new Date().toISOString(),
  }

  fs.writeFileSync('./deployed-pools.json', JSON.stringify(poolsInfo, null, 2))
  console.log('\n💾 池子信息已保存到 deployed-pools.json')

  console.log('\n✅ 所有流动性池创建完成！')
  console.log(`\n📊 统计:`)
  console.log(`总池子数: ${pools.length}`)
  console.log(`波动性池: ${pools.filter((p) => p.type === 'volatile').length}`)
  console.log(`稳定币池: ${pools.filter((p) => p.type === 'stable').length}`)

  console.log('\n📋 池子列表:')
  pools.forEach((pool) => {
    console.log(
      `${pool.tokenA}/${pool.tokenB} [${pool.type}]: ${pool.address} (${pool.liquidity} each)`
    )
  })

  console.log('\n💡 下一步:')
  console.log('1. 为这些池子创建 Gauge (npm run create-gauges)')
  console.log('2. 更新前端代币配置')
  console.log('3. 在 Farms 页面查看池子')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
