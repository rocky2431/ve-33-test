import { ethers } from 'hardhat'

async function main() {
  const VOTER_ADDRESS = '0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D'
  const POOL_ADDRESS = '0x9af24cE2e9Fa0b96E3a7654ceA2D89517Dc85dD8'

  console.log('为 SRT/SRUSD 池子创建 Gauge')
  console.log('池子地址:', POOL_ADDRESS)

  const Voter = await ethers.getContractAt('Voter', VOTER_ADDRESS)

  const tx = await Voter.createGauge(POOL_ADDRESS, { gasLimit: 3000000 })
  console.log('交易哈希:', tx.hash)

  await tx.wait()

  const gaugeAddress = await Voter.gauges(POOL_ADDRESS)
  console.log('✅ Gauge 创建成功:', gaugeAddress)
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
