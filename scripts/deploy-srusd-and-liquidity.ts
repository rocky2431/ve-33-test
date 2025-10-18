import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('部署SRUSD稳定币并创建主要流动性池')
  console.log('部署者地址:', deployer.address)
  console.log()

  const TEST_ADDRESS = '0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207'

  // 旧Router系统地址
  const ROUTER_ADDRESS = '0x4D6aa9a7740a4DDD4dCC8EDB3F4f43B205daA652'
  const FACTORY_ADDRESS = '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29'
  const VOTER_ADDRESS = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'

  // 现有代币地址
  const SRT = '0x4367741631B171d87f9d8a747636Fa3E3Bd048D8'
  const WSRT = '0x9799159b07f21106b6219B998184034C09e042ef'
  const STE = '0x8103319987b2ABB1F59F4b9c8aD20F70C9b64E8c'
  const STF = '0xB83da2B78d2C4734585b5167863881Dbf3Ea3cAb'
  const STCX = '0x4040a8cA682408c8cbD4Bb1bE9358409757b225C'
  const SBF = '0x048c72128d414e5FC9B3ab9853bb7457A046e365'

  // ========== 第一步：部署 SRUSD ==========
  console.log('📝 第一步：部署 SRUSD 稳定币')
  console.log('----------------------------------------')

  const SRUSD_SUPPLY = ethers.parseEther('100000000000') // 1000亿
  console.log('SRUSD 总供应量:', ethers.formatEther(SRUSD_SUPPLY), 'SRUSD')

  const SimpleToken = await ethers.getContractFactory('SimpleToken')
  const srusd = await SimpleToken.deploy('Star USD', 'SRUSD', SRUSD_SUPPLY, deployer.address)
  await srusd.waitForDeployment()

  const SRUSD_ADDRESS = await srusd.getAddress()
  console.log('✅ SRUSD 部署成功:', SRUSD_ADDRESS)
  console.log()

  // ========== 第二步：创建流动性池 ==========
  console.log('📝 第二步：添加主要流动性池')
  console.log('----------------------------------------')

  const Router = await ethers.getContractAt('Router', ROUTER_ADDRESS)
  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)
  const Voter = await ethers.getContractAt('Voter', VOTER_ADDRESS)

  // 定义流动性池配置
  const liquidityPools = [
    // 核心池 - SRT和WSRT对SRUSD
    {
      name: 'SRT/SRUSD',
      tokenA: SRT,
      tokenB: SRUSD_ADDRESS,
      stable: true,
      amountA: ethers.parseEther('10000000'), // 1000万 SRT
      amountB: ethers.parseEther('10000000'), // 1000万 SRUSD (假设 1 SRT = 1 USD)
    },
    {
      name: 'WSRT/SRUSD',
      tokenA: WSRT,
      tokenB: SRUSD_ADDRESS,
      stable: true,
      amountA: ethers.parseEther('5000000'), // 500万 WSRT
      amountB: ethers.parseEther('5000000'), // 500万 SRUSD
    },
    // 测试代币对SRUSD的池
    {
      name: 'STE/SRUSD',
      tokenA: STE,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('1000000'), // 100万 STE
      amountB: ethers.parseEther('500000'), // 50万 SRUSD (假设 1 STE = 0.5 USD)
    },
    {
      name: 'STF/SRUSD',
      tokenA: STF,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('1000000'), // 100万 STF
      amountB: ethers.parseEther('300000'), // 30万 SRUSD (假设 1 STF = 0.3 USD)
    },
    {
      name: 'STCX/SRUSD',
      tokenA: STCX,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('2000000'), // 200万 STCX
      amountB: ethers.parseEther('400000'), // 40万 SRUSD (假设 1 STCX = 0.2 USD)
    },
    {
      name: 'SBF/SRUSD',
      tokenA: SBF,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('5000000'), // 500万 SBF
      amountB: ethers.parseEther('1000000'), // 100万 SRUSD (假设 1 SBF = 0.2 USD)
    },
  ]

  const createdPools: Array<{
    name: string
    address: string
    hasGauge: boolean
    gaugeAddress?: string
  }> = []

  for (const pool of liquidityPools) {
    console.log(`\n处理池子: ${pool.name}`)
    console.log(`  Token A: ${pool.tokenA}`)
    console.log(`  Token B: ${pool.tokenB}`)
    console.log(`  类型: ${pool.stable ? '稳定池' : '波动池'}`)
    console.log(`  金额: ${ethers.formatEther(pool.amountA)} / ${ethers.formatEther(pool.amountB)}`)

    try {
      // 检查池子是否已存在
      const existingPair = await Factory.getPair(pool.tokenA, pool.tokenB, pool.stable)
      if (existingPair !== ethers.ZeroAddress) {
        console.log(`  ⚠️  池子已存在: ${existingPair}`)
        createdPools.push({
          name: pool.name,
          address: existingPair,
          hasGauge: false,
        })
        continue
      }

      // 授权代币
      console.log('  📝 授权 Token A...')
      const tokenA = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        pool.tokenA
      )
      const allowanceA = await tokenA.allowance(deployer.address, ROUTER_ADDRESS)
      if (allowanceA < pool.amountA) {
        const approveTxA = await tokenA.approve(ROUTER_ADDRESS, ethers.MaxUint256)
        await approveTxA.wait()
        console.log('  ✅ Token A 授权成功')
      } else {
        console.log('  ✅ Token A 已授权')
      }

      console.log('  📝 授权 Token B...')
      const tokenB = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        pool.tokenB
      )
      const allowanceB = await tokenB.allowance(deployer.address, ROUTER_ADDRESS)
      if (allowanceB < pool.amountB) {
        const approveTxB = await tokenB.approve(ROUTER_ADDRESS, ethers.MaxUint256)
        await approveTxB.wait()
        console.log('  ✅ Token B 授权成功')
      } else {
        console.log('  ✅ Token B 已授权')
      }

      // 添加流动性
      console.log('  📝 添加流动性...')
      const deadline = Math.floor(Date.now() / 1000) + 1200

      const addLiquidityTx = await Router.addLiquidity(
        pool.tokenA,
        pool.tokenB,
        pool.stable,
        pool.amountA,
        pool.amountB,
        0, // amountAMin - 设置为0以避免滑点问题
        0, // amountBMin
        deployer.address,
        deadline,
        { gasLimit: 5000000 }
      )

      console.log(`  ⏳ 等待交易确认: ${addLiquidityTx.hash}`)
      const receipt = await addLiquidityTx.wait()

      if (receipt?.status === 1) {
        // 获取创建的池子地址
        const pairAddress = await Factory.getPair(pool.tokenA, pool.tokenB, pool.stable)
        console.log(`  ✅ 流动性添加成功!`)
        console.log(`  池子地址: ${pairAddress}`)

        createdPools.push({
          name: pool.name,
          address: pairAddress,
          hasGauge: false,
        })
      } else {
        console.log(`  ❌ 交易失败`)
      }
    } catch (error: any) {
      console.log(`  ❌ 添加流动性失败:`, error.message)
    }

    // 等待一下避免RPC限制
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // ========== 第三步：为所有池子创建Gauge ==========
  console.log('\n\n📝 第三步：为所有池子创建 Gauge')
  console.log('----------------------------------------')

  for (const pool of createdPools) {
    console.log(`\n处理池子: ${pool.name}`)
    console.log(`  池子地址: ${pool.address}`)

    try {
      // 检查是否已有Gauge
      const existingGauge = await Voter.gauges(pool.address)
      if (existingGauge && existingGauge !== ethers.ZeroAddress) {
        console.log(`  ⚠️  已有Gauge: ${existingGauge}`)
        pool.hasGauge = true
        pool.gaugeAddress = existingGauge
        continue
      }

      // 创建Gauge
      console.log('  📝 创建 Gauge...')
      const createGaugeTx = await Voter.createGauge(pool.address, { gasLimit: 3000000 })
      console.log(`  ⏳ 等待交易确认: ${createGaugeTx.hash}`)
      await createGaugeTx.wait()

      const newGauge = await Voter.gauges(pool.address)
      console.log(`  ✅ Gauge 创建成功: ${newGauge}`)

      pool.hasGauge = true
      pool.gaugeAddress = newGauge
    } catch (error: any) {
      console.log(`  ❌ 创建Gauge失败:`, error.message)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // ========== 第四步：转账剩余SRUSD到测试地址 ==========
  console.log('\n\n📝 第四步：转账剩余 SRUSD 到测试地址')
  console.log('----------------------------------------')

  const srusdBalance = await srusd.balanceOf(deployer.address)
  console.log('部署者剩余 SRUSD:', ethers.formatEther(srusdBalance))

  if (srusdBalance > 0n) {
    console.log(`转账到测试地址: ${TEST_ADDRESS}`)
    const transferTx = await srusd.transfer(TEST_ADDRESS, srusdBalance)
    await transferTx.wait()
    console.log('✅ 转账成功')

    const testBalance = await srusd.balanceOf(TEST_ADDRESS)
    console.log('测试地址收到 SRUSD:', ethers.formatEther(testBalance))
  }

  // ========== 保存部署信息 ==========
  const deployInfo = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    testAddress: TEST_ADDRESS,
    srusd: {
      address: SRUSD_ADDRESS,
      symbol: 'SRUSD',
      name: 'Star USD',
      totalSupply: ethers.formatEther(SRUSD_SUPPLY),
    },
    pools: createdPools,
    router: ROUTER_ADDRESS,
    factory: FACTORY_ADDRESS,
    voter: VOTER_ADDRESS,
  }

  fs.writeFileSync('./deployed-srusd-liquidity.json', JSON.stringify(deployInfo, null, 2))
  console.log('\n✅ 部署信息已保存到 deployed-srusd-liquidity.json')

  // ========== 最终统计 ==========
  console.log('\n\n📊 最终统计')
  console.log('========================================')
  console.log('SRUSD 地址:', SRUSD_ADDRESS)
  console.log('创建的池子数:', createdPools.length)
  console.log('有 Gauge 的池子:', createdPools.filter((p) => p.hasGauge).length)
  console.log('\n池子列表:')
  createdPools.forEach((pool, i) => {
    console.log(`${i + 1}. ${pool.name}`)
    console.log(`   池子: ${pool.address}`)
    console.log(`   Gauge: ${pool.gaugeAddress || '未创建'}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
