import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const config = JSON.parse(fs.readFileSync('./deployed-contracts.json', 'utf-8'))
  const FACTORY_ADDRESS = config.factory

  console.log('Factory 地址:', FACTORY_ADDRESS)

  const Factory = await ethers.getContractAt('Factory', FACTORY_ADDRESS)

  try {
    const isPaused = await Factory.isPaused()
    console.log('isPaused:', isPaused)

    if (isPaused) {
      console.log('❌ Factory 已暂停！需要取消暂停才能创建池子。')
    } else {
      console.log('✅ Factory 未暂停，可以创建池子。')
    }
  } catch (error: any) {
    console.error('检查失败:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
