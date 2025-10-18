import { ethers } from 'hardhat'

async function main() {
  const hash = '0x147b3aebb3c3df5cacdf9d6124680a3da257151e59a30ad9a2d649a9012cf29b'

  console.log('检查成功的交易:', hash)
  console.log('BSCScan:', `https://testnet.bscscan.com/tx/${hash}`)
  console.log()

  const receipt = await ethers.provider.getTransactionReceipt(hash)

  if (!receipt) {
    console.log('❌ 交易未找到')
    return
  }

  console.log('📊 交易状态:')
  console.log('状态:', receipt.status === 1 ? '✅ 成功' : '❌ 失败')
  console.log('区块号:', receipt.blockNumber)
  console.log('Gas 使用:', receipt.gasUsed.toString())
  console.log('发送者:', receipt.from)
  console.log('接收者:', receipt.to)
  console.log('事件数量:', receipt.logs.length)

  if (receipt.logs.length > 0) {
    console.log('\n📝 解析事件:')

    const Factory = await ethers.getContractAt('Factory', '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29')
    const Router = await ethers.getContractAt('Router', '0x4D6aa9a7740a4DDD4dCC8EDB3F4f43B205daA652')

    let pairAddress = ''
    let token0 = ''
    let token1 = ''
    let isStable = false

    for (const log of receipt.logs) {
      try {
        const parsed = Factory.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        })
        if (parsed) {
          console.log(`  - ${parsed.name}`)

          if (parsed.name === 'PairCreated') {
            pairAddress = parsed.args.pair
            token0 = parsed.args.token0
            token1 = parsed.args.token1
            isStable = parsed.args.stable

            console.log(`    Token0: ${token0}`)
            console.log(`    Token1: ${token1}`)
            console.log(`    Stable: ${isStable}`)
            console.log(`    Pair: ${pairAddress}`)
          }
        }
      } catch {
        try {
          const parsed = Router.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          })
          if (parsed) {
            console.log(`  - ${parsed.name}`, Object.keys(parsed.args))
          }
        } catch {
          // ERC20 事件
          const erc20Interface = new ethers.Interface([
            'event Transfer(address indexed from, address indexed to, uint256 value)',
            'event Approval(address indexed owner, address indexed spender, uint256 value)',
            'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
          ])
          try {
            const parsed = erc20Interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            })
            if (parsed) {
              console.log(`  - ${parsed.name}`)
              if (parsed.name === 'Transfer') {
                console.log(`    From: ${parsed.args.from}`)
                console.log(`    To: ${parsed.args.to}`)
                console.log(`    Amount: ${ethers.formatEther(parsed.args.value)}`)
              }
            }
          } catch {
            // 忽略
          }
        }
      }
    }

    // 如果创建了池子，检查池子状态
    if (pairAddress) {
      console.log('\n🔍 检查池子状态:')
      const Pair = await ethers.getContractAt('Pair', pairAddress)

      const reserves = await Pair.getReserves()
      const totalSupply = await Pair.totalSupply()
      const lpBalance = await Pair.balanceOf(receipt.from)

      console.log('Reserve0:', ethers.formatEther(reserves[0]))
      console.log('Reserve1:', ethers.formatEther(reserves[1]))
      console.log('LP总供应量:', ethers.formatEther(totalSupply))
      console.log('用户LP余额:', ethers.formatEther(lpBalance))
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
