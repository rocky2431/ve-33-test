import { ethers } from 'hardhat'

async function main() {
  const txHash = '0x92ad2d3c0e87de2b02e4f387c0173055008806a3e7b9293f67bb10a2e3ff5b22'

  // 连接到BSC测试网
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/')

  console.log('查询BSC测试网交易详情...')
  console.log('交易哈希:', txHash)
  console.log()

  try {
    // 获取交易详情
    const tx = await provider.getTransaction(txHash)
    if (!tx) {
      console.log('❌ 交易不存在')
      return
    }

    console.log('📝 交易信息:')
    console.log('  From:', tx.from)
    console.log('  To:', tx.to)
    console.log('  Value:', ethers.formatEther(tx.value || 0n), 'BNB')
    console.log('  Gas Limit:', tx.gasLimit?.toString())
    console.log('  Nonce:', tx.nonce)
    console.log()

    // 获取交易回执
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) {
      console.log('⏳ 交易还在pending中...')
      return
    }

    console.log('📋 交易回执:')
    console.log('  Status:', receipt.status === 1 ? '✅ 成功' : '❌ 失败')
    console.log('  Gas Used:', receipt.gasUsed.toString())
    console.log('  Block Number:', receipt.blockNumber)
    console.log('  Contract Address:', receipt.contractAddress || 'N/A')
    console.log()

    if (receipt.status === 0) {
      console.log('❌ 交易失败！')
      console.log()

      // 尝试重放交易获取revert原因
      try {
        await provider.call(
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: tx.value,
          },
          receipt.blockNumber
        )
      } catch (error: any) {
        console.log('🔍 失败原因分析:')

        if (error.data) {
          console.log('  Error data:', error.data)

          // 尝试解析标准的Error(string)
          try {
            if (error.data.startsWith('0x08c379a0')) {
              // Error(string) selector
              const reason = ethers.AbiCoder.defaultAbiCoder().decode(
                ['string'],
                '0x' + error.data.slice(10)
              )[0]
              console.log('  ❗ Revert原因:', reason)
            }
          } catch (e) {
            // 忽略解码错误
          }
        }

        if (error.reason) {
          console.log('  Reason:', error.reason)
        }

        if (error.message && !error.reason) {
          console.log('  Message:', error.message)
        }

        console.log()
        console.log('💡 常见失败原因:')
        console.log('  1. Gauge已存在 - 该池子已经有Gauge了')
        console.log('  2. 权限不足 - 只有白名单地址可以创建Gauge')
        console.log('  3. 池子地址无效 - 池子不存在或地址错误')
        console.log('  4. Gas不足 - 交易gas limit设置太低')
      }
    } else {
      console.log('✅ 交易成功！')
      console.log()
      console.log('📊 事件日志 (' + receipt.logs.length + '个):')
      receipt.logs.forEach((log, i) => {
        console.log(`  Log ${i}:`)
        console.log('    Address:', log.address)
        console.log('    Topics:', log.topics[0].slice(0, 18) + '...')
      })
    }

    console.log()
    console.log('🔗 在区块浏览器查看:')
    console.log(`   https://testnet.bscscan.com/tx/${txHash}`)
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error)
