import { ethers } from 'hardhat'
import * as fs from 'fs'

/**
 * 测试创建单个池子，获取详细错误信息
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('🚀 部署者地址:', deployer.address)

  // 读取已部署的代币信息
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))
  const config = JSON.parse(fs.readFileSync('./deployed-contracts.json', 'utf-8'))

  const STE = deployInfo.tokens[0]  // STE
  const STF = deployInfo.tokens[1]  // STF

  const ROUTER_ADDRESS = config.router
  const FACTORY_ADDRESS = config.factory

  console.log('\n📝 合约地址:')
  console.log('Router:', ROUTER_ADDRESS)
  console.log('Factory:', FACTORY_ADDRESS)
  console.log('STE:', STE.address)
  console.log('STF:', STF.address)

  // 获取合约实例
  const Router = await ethers.getContractAt('Router', ROUTER_ADDRESS)
  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)
  const TokenSTE = await ethers.getContractAt('SimpleToken', STE.address)
  const TokenSTF = await ethers.getContractAt('SimpleToken', STF.address)

  const LIQUIDITY_AMOUNT = ethers.parseEther('150000000') // 1.5亿
  const deadline = Math.floor(Date.now() / 1000) + 1200 // 20分钟

  console.log('\n1️⃣ 检查余额:')
  const balanceSTE = await TokenSTE.balanceOf(deployer.address)
  const balanceSTF = await TokenSTF.balanceOf(deployer.address)
  console.log(`STE 余额: ${ethers.formatEther(balanceSTE)}`)
  console.log(`STF 余额: ${ethers.formatEther(balanceSTF)}`)

  console.log('\n2️⃣ 授权 Router...')
  try {
    const approveSTE = await TokenSTE.approve(ROUTER_ADDRESS, LIQUIDITY_AMOUNT * 2n)
    await approveSTE.wait()
    console.log('✅ STE 授权完成')

    const approveSTF = await TokenSTF.approve(ROUTER_ADDRESS, LIQUIDITY_AMOUNT * 2n)
    await approveSTF.wait()
    console.log('✅ STF 授权完成')
  } catch (error: any) {
    console.error('❌ 授权失败:', error.message)
    return
  }

  console.log('\n3️⃣ 检查授权额度:')
  const allowanceSTE = await TokenSTE.allowance(deployer.address, ROUTER_ADDRESS)
  const allowanceSTF = await TokenSTF.allowance(deployer.address, ROUTER_ADDRESS)
  console.log(`STE 授权额度: ${ethers.formatEther(allowanceSTE)}`)
  console.log(`STF 授权额度: ${ethers.formatEther(allowanceSTF)}`)

  console.log('\n4️⃣ 检查是否已存在池子:')
  const existingVolatile = await Factory.getPair(STE.address, STF.address, false)
  const existingStable = await Factory.getPair(STE.address, STF.address, true)
  console.log(`波动池: ${existingVolatile}`)
  console.log(`稳定池: ${existingStable}`)

  console.log('\n5️⃣ 尝试创建波动性池...')
  try {
    const tx = await Router.addLiquidity(
      STE.address,
      STF.address,
      false, // volatile
      LIQUIDITY_AMOUNT,
      LIQUIDITY_AMOUNT,
      0,
      0,
      deployer.address,
      deadline,
      { gasLimit: 5000000 } // 设置足够的 gas limit
    )

    console.log('交易哈希:', tx.hash)
    const receipt = await tx.wait()
    console.log('✅ 池子创建成功!')
    console.log('Gas 使用:', receipt?.gasUsed.toString())
  } catch (error: any) {
    console.error('\n❌ 池子创建失败!')
    console.error('错误消息:', error.message)
    if (error.data) {
      console.error('错误数据:', error.data)
    }
    if (error.error) {
      console.error('底层错误:', error.error)
    }

    // 尝试解析revert原因
    if (error.reason) {
      console.error('Revert 原因:', error.reason)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
