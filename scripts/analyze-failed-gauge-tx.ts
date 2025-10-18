import { ethers } from 'hardhat'

async function main() {
  const txHash = '0x6d68055bea6ec81c0da5b2e65f7a5c246601c2f64c78cbd9496dae6085e11534'

  // 连接到BSC测试网
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')

  console.log('分析失败的createGauge交易...')
  console.log('交易哈希:', txHash)
  console.log()

  // 获取交易详情
  const tx = await provider.getTransaction(txHash)
  if (!tx || !tx.data) {
    console.log('❌ 交易不存在')
    return
  }

  console.log('📝 交易信息:')
  console.log('  Caller:', tx.from)
  console.log('  Voter合约:', tx.to)
  console.log()

  // 解析createGauge的参数
  // createGauge(address _pool)的函数签名: 0x8e8e2911
  const functionSelector = tx.data.slice(0, 10)
  console.log('  Function Selector:', functionSelector)

  if (functionSelector === '0x8e8e2911') {
    // 解码参数
    const params = ethers.AbiCoder.defaultAbiCoder().decode(['address'], '0x' + tx.data.slice(10))
    const poolAddress = params[0]

    console.log('  传入的池子地址:', poolAddress)
    console.log()

    // 检查这个地址是否是有效的Pair
    const FACTORY_ADDRESS = '0x5c8a0F82f07b987F30e5e61Ba95Ce9cAE6Af9933'

    const factoryABI = ['function isPair(address pool) external view returns (bool)']
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider)

    try {
      const isPair = await factory.isPair(poolAddress)
      console.log('🔍 Factory.isPair检查结果:', isPair ? '✅ 是有效Pair' : '❌ 不是有效Pair')

      if (!isPair) {
        console.log()
        console.log('💡 这就是失败原因！')
        console.log()
        console.log('可能的原因:')
        console.log('  1. 传入了Token地址而不是Pool地址')
        console.log('  2. 传入了错误的地址')
        console.log('  3. 池子还没有被创建')
        console.log()
        console.log('解决方案:')
        console.log('  请先在Liquidity页面添加流动性创建池子')
        console.log('  然后使用Factory.getPair获取正确的池子地址')
        console.log('  最后再调用createGauge')
      }
    } catch (error: any) {
      console.log('❌ 检查失败:', error.message)
    }
  } else {
    console.log('  ⚠️ 这不是createGauge函数调用')
  }

  console.log()
  console.log('🔗 在区块浏览器查看:')
  console.log(`   https://testnet.bscscan.com/tx/${txHash}`)
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
