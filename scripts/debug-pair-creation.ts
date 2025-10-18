import { ethers } from 'hardhat'
import * as fs from 'fs'

/**
 * 逐步调试池子创建过程
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('🚀 部署者地址:', deployer.address)

  // 读取配置
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))
  const config = JSON.parse(fs.readFileSync('./deployed-contracts.json', 'utf-8'))

  const STE = deployInfo.tokens[0]
  const STF = deployInfo.tokens[1]
  const FACTORY_ADDRESS = config.factory

  console.log('\n📝 配置:')
  console.log('Factory:', FACTORY_ADDRESS)
  console.log('STE:', STE.address)
  console.log('STF:', STF.address)

  // 获取合约实例
  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)
  const TokenSTE = await ethers.getContractAt('SimpleToken', STE.address)
  const TokenSTF = await ethers.getContractAt('SimpleToken', STF.address)

  const LIQUIDITY_AMOUNT = ethers.parseEther('150000000')

  // 步骤1: 创建 Pair
  console.log('\n步骤1: 创建 Pair 合约')
  try {
    const existingPair = await Factory.getPair(STE.address, STF.address, false)

    if (existingPair === ethers.ZeroAddress) {
      console.log('池子不存在，创建新池子...')
      const createTx = await Factory.createPair(STE.address, STF.address, false, { gasLimit: 5000000 })
      const receipt = await createTx.wait()
      console.log('✅ createPair 交易已确认')
      console.log('交易哈希:', receipt?.hash)
      console.log('Gas 使用:', receipt?.gasUsed.toString())
      console.log('状态:', receipt?.status === 1 ? '成功' : '失败')

      // 检查事件
      if (receipt) {
        console.log('事件数量:', receipt.logs.length)
        for (const log of receipt.logs) {
          try {
            const parsed = Factory.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            })
            if (parsed) {
              console.log('事件:', parsed.name, parsed.args)
            }
          } catch (e) {
            // 忽略无法解析的日志
          }
        }
      }
    } else {
      console.log('池子已存在:', existingPair)
    }

    const pairAddress = await Factory.getPair(STE.address, STF.address, false)
    console.log('Pair 地址:', pairAddress)

    if (pairAddress === ethers.ZeroAddress) {
      throw new Error('Failed to create pair')
    }

    // 获取 Pair 合约实例
    const Pair = await ethers.getContractAt('Pair', pairAddress)

    // 步骤2: 检查Pair合约信息
    console.log('\n步骤2: 检查 Pair 合约信息')
    const token0 = await Pair.token0()
    const token1 = await Pair.token1()
    const stable = await Pair.stable()
    console.log('Token0:', token0)
    console.log('Token1:', token1)
    console.log('Is Stable:', stable)

    // 步骤3: 转账代币到 Pair
    console.log('\n步骤3: 转账代币到 Pair')
    const transferSTE = await TokenSTE.transfer(pairAddress, LIQUIDITY_AMOUNT)
    await transferSTE.wait()
    console.log(`✅ 已转账 ${ethers.formatEther(LIQUIDITY_AMOUNT)} STE 到 Pair`)

    const transferSTF = await TokenSTF.transfer(pairAddress, LIQUIDITY_AMOUNT)
    await transferSTF.wait()
    console.log(`✅ 已转账 ${ethers.formatEther(LIQUIDITY_AMOUNT)} STF 到 Pair`)

    // 步骤4: 检查 Pair 的代币余额
    console.log('\n步骤4: 检查 Pair 的代币余额')
    const pairBalanceSTE = await TokenSTE.balanceOf(pairAddress)
    const pairBalanceSTF = await TokenSTF.balanceOf(pairAddress)
    console.log('Pair STE 余额:', ethers.formatEther(pairBalanceSTE))
    console.log('Pair STF 余额:', ethers.formatEther(pairBalanceSTF))

    // 步骤5: 调用 mint
    console.log('\n步骤5: 调用 Pair.mint()')
    try {
      const mintTx = await Pair.mint(deployer.address, { gasLimit: 5000000 })
      const receipt = await mintTx.wait()
      console.log('✅ Mint 成功!')
      console.log('交易哈希:', receipt?.hash)
      console.log('Gas 使用:', receipt?.gasUsed.toString())

      // 检查 LP 代币余额
      const lpBalance = await Pair.balanceOf(deployer.address)
      console.log('LP 代币余额:', ethers.formatEther(lpBalance))
    } catch (error: any) {
      console.error('\n❌ Mint 失败!')
      console.error('错误:', error.message)
      if (error.data) {
        console.error('错误数据:', error.data)
      }
    }
  } catch (error: any) {
    console.error('\n❌ 过程失败!')
    console.error('错误:', error.message)
    if (error.data) {
      console.error('错误数据:', error.data)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
