import { ethers } from 'hardhat'

async function main() {
  const txHash = '0x6d68055bea6ec81c0da5b2e65f7a5c246601c2f64c78cbd9496dae6085e11534'

  console.log('查询交易详情...')
  console.log('交易哈希:', txHash)
  console.log()

  try {
    // 获取交易详情
    const tx = await ethers.provider.getTransaction(txHash)
    if (!tx) {
      console.log('❌ 交易不存在')
      return
    }

    console.log('📝 交易信息:')
    console.log('  From:', tx.from)
    console.log('  To:', tx.to)
    console.log('  Value:', ethers.formatEther(tx.value), 'BNB')
    console.log('  Gas Limit:', tx.gasLimit.toString())
    console.log()

    // 获取交易回执
    const receipt = await ethers.provider.getTransactionReceipt(txHash)
    if (!receipt) {
      console.log('⏳ 交易还在pending中...')
      return
    }

    console.log('📋 交易回执:')
    console.log('  Status:', receipt.status === 1 ? '✅ 成功' : '❌ 失败')
    console.log('  Gas Used:', receipt.gasUsed.toString())
    console.log('  Block Number:', receipt.blockNumber)
    console.log()

    if (receipt.status === 0) {
      console.log('❌ 交易失败！')
      console.log()

      // 尝试重放交易获取revert原因
      try {
        await ethers.provider.call(
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: tx.value,
            gasLimit: tx.gasLimit,
          },
          receipt.blockNumber
        )
      } catch (error: any) {
        console.log('🔍 失败原因:')
        if (error.data) {
          console.log('  Error data:', error.data)
        }
        if (error.reason) {
          console.log('  Reason:', error.reason)
        }
        if (error.message) {
          console.log('  Message:', error.message)
        }
        console.log()

        // 尝试解析revert原因
        if (error.data) {
          try {
            const decoded = ethers.toUtf8String('0x' + error.data.slice(138))
            console.log('  Decoded:', decoded)
          } catch (e) {
            // 忽略解码错误
          }
        }
      }
    } else {
      console.log('✅ 交易成功！')
      console.log()
      console.log('📊 事件日志:')
      receipt.logs.forEach((log, i) => {
        console.log(`  Log ${i}:`, log.topics[0])
      })
    }
  } catch (error: any) {
    console.error('查询失败:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
