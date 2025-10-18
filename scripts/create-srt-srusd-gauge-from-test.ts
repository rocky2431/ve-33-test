import { ethers } from 'hardhat'

async function main() {
  // 使用测试地址作为signer（需要在测试网有BNB）
  const TEST_ADDRESS = '0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207'
  const VOTER_ADDRESS = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'
  const POOL_ADDRESS = '0x9af24cE2e9Fa0b96E3a7654ceA2D89517Dc85dD8'

  console.log('为 SRT/SRUSD 池子创建 Gauge')
  console.log('池子地址:', POOL_ADDRESS)
  console.log('⚠️ 需要使用测试地址:', TEST_ADDRESS)
  console.log()

  // 获取测试地址的私钥（从环境变量）
  if (!process.env.TEST_PRIVATE_KEY) {
    console.log('❌ 未设置 TEST_PRIVATE_KEY 环境变量')
    console.log('💡 请在 .env 文件添加: TEST_PRIVATE_KEY=你的测试地址私钥')
    console.log()
    console.log('或者直接在 UI 中操作：')
    console.log('  1. 连接测试地址钱包')
    console.log('  2. 在 Liquidity 页面添加流动性')
    console.log('  3. 系统会自动创建 Gauge')
    return
  }

  const wallet = new ethers.Wallet(process.env.TEST_PRIVATE_KEY, ethers.provider)
  console.log('使用钱包地址:', wallet.address)

  if (wallet.address.toLowerCase() !== TEST_ADDRESS.toLowerCase()) {
    console.log('❌ 私钥对应的地址不匹配')
    return
  }

  const Voter = await ethers.getContractAt('Voter', VOTER_ADDRESS, wallet)

  // 检查是否已有Gauge
  const existingGauge = await Voter.gauges(POOL_ADDRESS)
  if (existingGauge && existingGauge !== ethers.ZeroAddress) {
    console.log('✅ 池子已有Gauge:', existingGauge)
    return
  }

  console.log('📝 创建 Gauge...')
  const tx = await Voter.createGauge(POOL_ADDRESS, { gasLimit: 3000000 })
  console.log('交易哈希:', tx.hash)

  await tx.wait()

  const gaugeAddress = await Voter.gauges(POOL_ADDRESS)
  console.log('✅ Gauge 创建成功:', gaugeAddress)
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
