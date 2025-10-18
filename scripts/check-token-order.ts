import { ethers } from 'hardhat'

async function main() {
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')

  const STE = '0x8103319987b2ABB1F59F4b9c8aD20F70C9b64E8c'
  const SRUSD = '0x5f3347B3C43821D2783792395B9A4f44A28308A7'
  const poolAddress = '0x50cD98D8b178cbc3502Eba9aeaE37B51C49D854B'

  const pairABI = [
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function getReserves() external view returns (uint112, uint112, uint32)',
  ]

  const pair = new ethers.Contract(poolAddress, pairABI, provider)

  const [token0, token1, reserves] = await Promise.all([
    pair.token0(),
    pair.token1(),
    pair.getReserves(),
  ])

  console.log('🔍 池子地址:', poolAddress)
  console.log()
  console.log('📊 Token 顺序:')
  console.log('  token0:', token0, token0 === SRUSD ? '(SRUSD)' : '(STE)')
  console.log('  token1:', token1, token1 === STE ? '(STE)' : '(SRUSD)')
  console.log()
  console.log('💰 Reserves:')
  console.log('  reserve0:', ethers.formatEther(reserves[0]), token0 === SRUSD ? 'SRUSD' : 'STE')
  console.log('  reserve1:', ethers.formatEther(reserves[1]), token1 === STE ? 'STE' : 'SRUSD')
  console.log()
  console.log('📈 正确价格计算:')
  if (token0 === SRUSD && token1 === STE) {
    const price = Number(reserves[0]) / Number(reserves[1])
    console.log('  1 STE =', price.toFixed(6), 'SRUSD')
    console.log('  1 SRUSD =', (1/price).toFixed(6), 'STE')
  }

  console.log()
  console.log('🔢 地址比较:')
  console.log('  STE地址:', STE)
  console.log('  SRUSD地址:', SRUSD)
  console.log('  STE < SRUSD?', STE.toLowerCase() < SRUSD.toLowerCase() ? 'true (STE是token0)' : 'false (SRUSD是token0)')
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
