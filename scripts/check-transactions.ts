import { ethers } from 'hardhat'

async function main() {
  const txHashes = [
    '0xf4378ca760ddc2cc9e00af376318481bad17c53a82c8ca453ec29c9169880e4c', // 成功的
    '0xde45db9116605afdfbc46eb4a879d397a6ae57dc5de5f98567d35db4630d7180', // 失败1
    '0x715ae854394ac19f86b0df1e6c871226824cb964376500419b34c3f2fcc09546', // 失败2
  ]

  for (let i = 0; i < txHashes.length; i++) {
    const hash = txHashes[i]
    console.log(`\n${'='.repeat(80)}`)
    console.log(`交易 ${i + 1}: ${hash}`)
    console.log('='.repeat(80))

    try {
      const receipt = await ethers.provider.getTransactionReceipt(hash)

      if (!receipt) {
        console.log('❌ 交易未找到或未确认')
        continue
      }

      console.log('\n📊 交易状态:')
      console.log('状态:', receipt.status === 1 ? '✅ 成功' : '❌ 失败')
      console.log('区块号:', receipt.blockNumber)
      console.log('Gas 使用:', receipt.gasUsed.toString())
      console.log('发送者:', receipt.from)
      console.log('接收者:', receipt.to)

      if (receipt.contractAddress) {
        console.log('创建的合约:', receipt.contractAddress)
      }

      console.log('\n📝 事件日志数量:', receipt.logs.length)

      if (receipt.logs.length > 0) {
        console.log('\n事件详情:')

        // 尝试解析事件
        const Factory = await ethers.getContractAt('Factory', '0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29')
        const Router = await ethers.getContractAt('Router', '0x4D6aa9a7740a4DDD4dCC8EDB3F4f43B205daA652')

        for (const log of receipt.logs) {
          try {
            // 尝试用 Factory 接口解析
            const parsed = Factory.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            })
            if (parsed) {
              console.log(`  - ${parsed.name}:`, parsed.args)

              // 如果是 PairCreated 事件，记录池子地址
              if (parsed.name === 'PairCreated') {
                console.log(`    ✅ 新池子地址: ${parsed.args.pair}`)
              }
            }
          } catch {
            // 尝试用 Router 接口解析
            try {
              const parsed = Router.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
              })
              if (parsed) {
                console.log(`  - ${parsed.name}:`, parsed.args)
              }
            } catch {
              // 无法解析的日志
              console.log(`  - 未知事件:`, log.address)
            }
          }
        }
      }

      // 如果交易失败，尝试获取失败原因
      if (receipt.status === 0) {
        console.log('\n❌ 交易失败')

        // 获取原始交易
        const tx = await ethers.provider.getTransaction(hash)
        if (tx) {
          console.log('尝试重放交易以获取错误原因...')
          try {
            await ethers.provider.call({
              ...tx,
              blockTag: receipt.blockNumber - 1
            })
          } catch (error: any) {
            console.log('失败原因:', error.message || error.toString())
          }
        }
      }

    } catch (error: any) {
      console.error('检查交易时出错:', error.message)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
