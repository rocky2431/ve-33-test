import { ethers } from 'hardhat'
import * as fs from 'fs'

async function main() {
  const [deployer] = await ethers.getSigners()
  const config = JSON.parse(fs.readFileSync('./deployed-contracts.json', 'utf-8'))
  const deployInfo = JSON.parse(fs.readFileSync('./deployed-test-tokens.json', 'utf-8'))

  const STE = deployInfo.tokens[0]
  const STF = deployInfo.tokens[1]
  const Factory = await ethers.getContractAt('Factory', config.factory)

  // 获取 Pair 地址
  const pairAddress = await Factory.getPair(STE.address, STF.address, false)
  console.log('Pair 地址:', pairAddress)

  if (pairAddress === ethers.ZeroAddress) {
    console.log('Pair 不存在')
    return
  }

  const Pair = await ethers.getContractAt('Pair', pairAddress)
  const TokenSTE = await ethers.getContractAt('SimpleToken', STE.address)
  const TokenSTF = await ethers.getContractAt('SimpleToken', STF.address)

  console.log('\n📊 Pair 合约状态:')

  // 基本信息
  const token0 = await Pair.token0()
  const token1 = await Pair.token1()
  const stable = await Pair.stable()
  console.log('Token0:', token0)
  console.log('Token1:', token1)
  console.log('Is Stable:', stable)

  // LP 总供应量
  const totalSupply = await Pair.totalSupply()
  console.log('LP Total Supply:', ethers.formatEther(totalSupply))

  // 储备金
  const reserves = await Pair.getReserves()
  console.log('Reserve0:', ethers.formatEther(reserves[0]))
  console.log('Reserve1:', ethers.formatEther(reserves[1]))
  console.log('BlockTimestamp:', reserves[2].toString())

  // Pair 的代币余额
  const balance0 = await TokenSTE.balanceOf(pairAddress)
  const balance1 = await TokenSTF.balanceOf(pairAddress)
  console.log('Pair Balance Token0:', ethers.formatEther(balance0))
  console.log('Pair Balance Token1:', ethers.formatEther(balance1))

  // claimable
  try {
    const claimable0 = await Pair.claimable0()
    const claimable1 = await Pair.claimable1()
    console.log('Claimable0:', ethers.formatEther(claimable0))
    console.log('Claimable1:', ethers.formatEther(claimable1))
  } catch (e) {
    console.log('无法读取 claimable（可能没有这个变量）')
  }

  // 检查部署者的 LP 余额
  const lpBalance = await Pair.balanceOf(deployer.address)
  console.log('\n部署者 LP 余额:', ethers.formatEther(lpBalance))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
