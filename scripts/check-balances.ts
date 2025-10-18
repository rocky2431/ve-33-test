import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('🔍 检查部署者地址:', deployer.address)

  // 读取代币信息
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))
  const tokens = deployInfo.tokens

  console.log('\n📊 代币余额检查:\n')

  for (const token of tokens) {
    const tokenContract = await ethers.getContractAt('SimpleToken', token.address)
    const balance = await tokenContract.balanceOf(deployer.address)
    const formattedBalance = ethers.formatEther(balance)

    console.log(`${token.symbol}:`)
    console.log(`  地址: ${token.address}`)
    console.log(`  余额: ${formattedBalance} (${balance.toString()})`)
    console.log(`  预期: 1,000,000,000 (10亿)`)
    console.log(`  匹配: ${formattedBalance === '1000000000.0' ? '✅' : '❌'}`)
    console.log()
  }

  // 检查测试地址的余额
  const TEST_ADDRESS = '0x771Bd7b8Cd910333c3E8A4E2c463E73Bc57Ea207'
  console.log(`\n📊 测试地址余额检查 (${TEST_ADDRESS}):\n`)

  for (const token of tokens) {
    const tokenContract = await ethers.getContractAt('SimpleToken', token.address)
    const balance = await tokenContract.balanceOf(TEST_ADDRESS)
    const formattedBalance = ethers.formatEther(balance)

    console.log(`${token.symbol}: ${formattedBalance}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
