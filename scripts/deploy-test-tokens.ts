import { ethers } from 'hardhat'

/**
 * 部署测试代币并创建流动性池
 * 代币: STE, STF, STCX, SBF
 * 每个代币: 100亿供应量, 10%用于流动性, 90%发送到测试地址
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('🚀 部署者地址:', deployer.address)

  // 测试地址（接收90%代币）
  const TEST_ADDRESS = '0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207'

  // 代币配置
  const TOTAL_SUPPLY = ethers.parseEther('10000000000') // 100亿
  const LIQUIDITY_AMOUNT = TOTAL_SUPPLY / 10n // 10% 用于流动性
  const TRANSFER_AMOUNT = TOTAL_SUPPLY - LIQUIDITY_AMOUNT // 90% 转账

  const tokens = [
    { name: 'Star Energy', symbol: 'STE' },
    { name: 'Star Finance', symbol: 'STF' },
    { name: 'Star Chain X', symbol: 'STCX' },
    { name: 'Star Base Finance', symbol: 'SBF' },
  ]

  console.log('\n📊 代币信息:')
  console.log('总供应量:', ethers.formatEther(TOTAL_SUPPLY), 'per token')
  console.log('流动性金额:', ethers.formatEther(LIQUIDITY_AMOUNT), '(10%)')
  console.log('转账金额:', ethers.formatEther(TRANSFER_AMOUNT), '(90%)')
  console.log('接收地址:', TEST_ADDRESS)

  // 1️⃣ 部署代币
  console.log('\n1️⃣ 部署代币合约...')
  const SimpleToken = await ethers.getContractFactory('SimpleToken')
  const deployedTokens: any[] = []

  for (const token of tokens) {
    console.log(`\n部署 ${token.symbol}...`)
    const tokenContract = await SimpleToken.deploy(
      token.name,
      token.symbol,
      TOTAL_SUPPLY,
      deployer.address
    )
    await tokenContract.waitForDeployment()
    const address = await tokenContract.getAddress()

    console.log(`✅ ${token.symbol} 部署完成:`, address)
    deployedTokens.push({
      ...token,
      address,
      contract: tokenContract,
    })
  }

  // 保存部署信息
  const deployInfo = {
    network: 'bscTestnet',
    deployer: deployer.address,
    testAddress: TEST_ADDRESS,
    totalSupply: TOTAL_SUPPLY.toString(),
    liquidityAmount: LIQUIDITY_AMOUNT.toString(),
    transferAmount: TRANSFER_AMOUNT.toString(),
    tokens: deployedTokens.map((t) => ({
      name: t.name,
      symbol: t.symbol,
      address: t.address,
    })),
    timestamp: new Date().toISOString(),
  }

  console.log('\n💾 部署信息已保存到 deployed-test-tokens.json')
  await require('fs').promises.writeFile(
    './deployed-test-tokens.json',
    JSON.stringify(deployInfo, null, 2)
  )

  // 2️⃣ 转账90%到测试地址
  if (TEST_ADDRESS !== deployer.address) {
    console.log('\n2️⃣ 转账90%代币到测试地址...')
    for (const token of deployedTokens) {
      const tx = await token.contract.transfer(TEST_ADDRESS, TRANSFER_AMOUNT)
      await tx.wait()
      console.log(`✅ ${token.symbol}: 转账 ${ethers.formatEther(TRANSFER_AMOUNT)} 到 ${TEST_ADDRESS}`)
    }
  } else {
    console.log('\n2️⃣ 测试地址与部署者相同，跳过转账')
  }

  console.log('\n✅ 所有代币部署完成！')
  console.log('\n📋 代币地址列表:')
  deployedTokens.forEach((t) => {
    console.log(`${t.symbol}: ${t.address}`)
  })

  console.log('\n💡 下一步:')
  console.log('1. 运行 npm run deploy:add-liquidity 创建流动性池')
  console.log('2. 更新 frontend/src/constants/tokens.ts 添加新代币')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
