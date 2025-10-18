import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('使用已部署的SRUSD创建流动性池')
  console.log('部署者地址:', deployer.address)
  console.log()

  const TEST_ADDRESS = '0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207'

  // 旧Router系统地址
  const ROUTER_ADDRESS = '0x4D6aa9a7740a4DDD4dCC8EDB3F4f43B205daA652'
  const FACTORY_ADDRESS = '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29'
  const VOTER_ADDRESS = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'

  // SRUSD地址（已部署）
  const SRUSD_ADDRESS = '0x5f3347B3C43821D2783792395B9A4f44A28308A7'

  // 现有代币地址
  const SRT = '0x4367741631B171d87f9d8a747636Fa3E3Bd048D8'
  const WSRT = '0x9799159b07f21106b6219B998184034C09e042ef'
  const STE = '0x8103319987b2ABB1F59F4b9c8aD20F70C9b64E8c'
  const STF = '0xB83da2B78d2C4734585b5167863881Dbf3Ea3cAb'
  const STCX = '0x4040a8cA682408c8cbD4Bb1bE9358409757b225C'
  const SBF = '0x048c72128d414e5FC9B3ab9853bb7457A046e365'

  // ========== 第一步：从测试地址转回SRUSD用于流动性 ==========
  console.log('📝 第一步：从测试地址转回SRUSD用于流动性')
  console.log('----------------------------------------')

  const SRUSD = await ethers.getContractAt(
    '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
    SRUSD_ADDRESS
  )

  // 计算需要的SRUSD总量
  const TOTAL_SRUSD_NEEDED = ethers.parseEther('16200000') // 1620万 SRUSD
  console.log('需要的SRUSD总量:', ethers.formatEther(TOTAL_SRUSD_NEEDED))

  // 先转账到部署者账户（需要从测试地址使用impersonate）
  console.log('⚠️  需要手动从测试地址转账SRUSD到部署者账户')
  console.log(`   或者直接通过UI添加流动性`)
  console.log()

  // 检查部署者的各代币余额
  console.log('📊 检查部署者代币余额:')
  const srtBalance = await ethers.getContractAt(
    '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
    SRT
  ).then((t) => t.balanceOf(deployer.address))
  const wsrtBalance = await ethers.getContractAt(
    '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
    WSRT
  ).then((t) => t.balanceOf(deployer.address))
  const srusdBalance = await SRUSD.balanceOf(deployer.address)

  console.log('  SRT:', ethers.formatEther(srtBalance))
  console.log('  WSRT:', ethers.formatEther(wsrtBalance))
  console.log('  SRUSD:', ethers.formatEther(srusdBalance))
  console.log()

  if (srusdBalance < TOTAL_SRUSD_NEEDED) {
    console.log('❌ 部署者SRUSD余额不足，无法添加流动性')
    console.log('💡 建议：从测试地址转账SRUSD到部署者，或通过UI手动添加流动性')
    return
  }

  // ========== 第二步：创建流动性池 ==========
  console.log('📝 第二步：添加流动性池')
  console.log('----------------------------------------')

  const Router = await ethers.getContractAt('Router', ROUTER_ADDRESS)
  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)
  const Voter = await ethers.getContractAt('Voter', VOTER_ADDRESS)

  // 定义流动性池配置
  const liquidityPools = [
    {
      name: 'SRT/SRUSD',
      tokenA: SRT,
      tokenB: SRUSD_ADDRESS,
      stable: true,
      amountA: ethers.parseEther('10000000'), // 1000万 SRT
      amountB: ethers.parseEther('10000000'), // 1000万 SRUSD
    },
    {
      name: 'WSRT/SRUSD',
      tokenA: WSRT,
      tokenB: SRUSD_ADDRESS,
      stable: true,
      amountA: ethers.parseEther('5000000'), // 500万 WSRT
      amountB: ethers.parseEther('5000000'), // 500万 SRUSD
    },
    {
      name: 'STE/SRUSD',
      tokenA: STE,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('200000'), // 20万 STE
      amountB: ethers.parseEther('100000'), // 10万 SRUSD
    },
    {
      name: 'STF/SRUSD',
      tokenA: STF,
      tokenB: SRUSD_ADDRESS,
      stable: false,
      amountA: ethers.parseEther('300000'), // 30万 STF
      amountB: ethers.parseEther('100000'), // 10万 SRUSD
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
      const tokenA = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        pool.tokenA
      )
      const tokenB = await ethers.getContractAt(
        '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
        pool.tokenB
      )

      const allowanceA = await tokenA.allowance(deployer.address, ROUTER_ADDRESS)
      if (allowanceA < pool.amountA) {
        console.log('  📝 授权 Token A...')
        const tx = await tokenA.approve(ROUTER_ADDRESS, ethers.MaxUint256)
        await tx.wait()
      }

      const allowanceB = await tokenB.allowance(deployer.address, ROUTER_ADDRESS)
      if (allowanceB < pool.amountB) {
        console.log('  📝 授权 Token B...')
        const tx = await tokenB.approve(ROUTER_ADDRESS, ethers.MaxUint256)
        await tx.wait()
      }

      // 添加流动性
      console.log('  📝 添加流动性...')
      const deadline = Math.floor(Date.now() / 1000) + 1200

      const tx = await Router.addLiquidity(
        pool.tokenA,
        pool.tokenB,
        pool.stable,
        pool.amountA,
        pool.amountB,
        0,
        0,
        deployer.address,
        deadline,
        { gasLimit: 5000000 }
      )

      console.log(`  ⏳ 等待确认: ${tx.hash}`)
      const receipt = await tx.wait()

      if (receipt?.status === 1) {
        const pairAddress = await Factory.getPair(pool.tokenA, pool.tokenB, pool.stable)
        console.log(`  ✅ 成功! 池子: ${pairAddress}`)
        createdPools.push({
          name: pool.name,
          address: pairAddress,
          hasGauge: false,
        })
      }
    } catch (error: any) {
      console.log(`  ❌ 失败:`, error.message)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // ========== 第三步：创建Gauge ==========
  console.log('\n\n📝 第三步：创建 Gauge')
  console.log('----------------------------------------')

  for (const pool of createdPools) {
    console.log(`\n${pool.name}`)
    try {
      const existingGauge = await Voter.gauges(pool.address)
      if (existingGauge && existingGauge !== ethers.ZeroAddress) {
        console.log(`  ✅ 已有Gauge: ${existingGauge}`)
        pool.hasGauge = true
        pool.gaugeAddress = existingGauge
        continue
      }

      console.log('  📝 创建 Gauge...')
      const tx = await Voter.createGauge(pool.address, { gasLimit: 3000000 })
      await tx.wait()

      const newGauge = await Voter.gauges(pool.address)
      console.log(`  ✅ Gauge: ${newGauge}`)

      pool.hasGauge = true
      pool.gaugeAddress = newGauge
    } catch (error: any) {
      console.log(`  ❌ 失败:`, error.message)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // 保存结果
  const result = {
    timestamp: new Date().toISOString(),
    srusd: SRUSD_ADDRESS,
    pools: createdPools,
  }

  fs.writeFileSync('./srusd-liquidity-result.json', JSON.stringify(result, null, 2))

  console.log('\n\n📊 完成')
  console.log('创建的池子:', createdPools.length)
  console.log('有Gauge的池子:', createdPools.filter((p) => p.hasGauge).length)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
