import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * 项目状态检查脚本
 *
 * 检查项目配置、环境变量、合约编译状态等
 */

async function main() {
  console.log('\n🔍 开始检查项目状态...\n');

  let allGood = true;

  // ====================================================================
  // 1. 检查环境变量
  // ====================================================================
  console.log('====================================================================');
  console.log('📋 第一步: 检查环境变量');
  console.log('====================================================================\n');

  const requiredEnvVars = [
    'BSC_TESTNET_RPC_URL',
    'PRIVATE_KEY',
  ];

  const optionalEnvVars = [
    'BSCSCAN_API_KEY',
    'REPORT_GAS',
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: 已配置`);
    } else {
      console.log(`❌ ${envVar}: 未配置`);
      allGood = false;
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: 已配置 (可选)`);
    } else {
      console.log(`⚠️  ${envVar}: 未配置 (可选)`);
    }
  }

  // ====================================================================
  // 2. 检查网络连接
  // ====================================================================
  console.log('\n====================================================================');
  console.log('🌐 第二步: 检查网络连接');
  console.log('====================================================================\n');

  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
    );

    const network = await provider.getNetwork();
    console.log(`✅ 网络连接成功`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Name: ${network.name}`);

    // 检查账户余额
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      const balanceBNB = ethers.formatEther(balance);

      console.log(`\n💰 账户信息:`);
      console.log(`   地址: ${wallet.address}`);
      console.log(`   余额: ${balanceBNB} BNB`);

      if (parseFloat(balanceBNB) < 0.2) {
        console.log(`   ⚠️  余额不足! 建议至少 0.2 BNB 用于部署`);
        allGood = false;
      } else {
        console.log(`   ✅ 余额充足`);
      }
    }
  } catch (error: any) {
    console.log(`❌ 网络连接失败: ${error.message}`);
    allGood = false;
  }

  // ====================================================================
  // 3. 检查合约编译
  // ====================================================================
  console.log('\n====================================================================');
  console.log('🔨 第三步: 检查合约编译');
  console.log('====================================================================\n');

  const artifactsDir = path.join(__dirname, '../artifacts/contracts');

  const requiredContracts = [
    'core/Token.sol/Token.json',
    'core/Factory.sol/Factory.json',
    'core/Pair.sol/Pair.json',
    'core/Router.sol/Router.json',
    'governance/VotingEscrow.sol/VotingEscrow.json',
    'governance/Voter.sol/Voter.json',
    'governance/Gauge.sol/Gauge.json',
    'governance/Bribe.sol/Bribe.json',
    'governance/Minter.sol/Minter.json',
  ];

  for (const contract of requiredContracts) {
    const contractPath = path.join(artifactsDir, contract);
    if (fs.existsSync(contractPath)) {
      console.log(`✅ ${contract.split('/').pop()?.replace('.json', '')}: 已编译`);
    } else {
      console.log(`❌ ${contract.split('/').pop()?.replace('.json', '')}: 未编译`);
      allGood = false;
    }
  }

  // ====================================================================
  // 4. 检查部署记录
  // ====================================================================
  console.log('\n====================================================================');
  console.log('📦 第四步: 检查部署记录');
  console.log('====================================================================\n');

  const deploymentsDir = path.join(__dirname, '../deployments');

  if (fs.existsSync(deploymentsDir)) {
    const files = fs.readdirSync(deploymentsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length > 0) {
      console.log(`✅ 找到 ${jsonFiles.length} 个部署记录:`);
      jsonFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });

      // 显示最新部署信息
      const latestFile = jsonFiles[jsonFiles.length - 1];
      const deploymentPath = path.join(deploymentsDir, latestFile);
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

      console.log(`\n📋 最新部署信息 (${latestFile}):`);
      console.log(`   网络: ${deployment.network}`);
      console.log(`   部署者: ${deployment.deployer}`);
      console.log(`   时间: ${new Date(deployment.timestamp).toLocaleString()}`);

      if (deployment.contracts) {
        console.log(`\n   合约地址:`);
        Object.entries(deployment.contracts).forEach(([name, address]) => {
          console.log(`   - ${name}: ${address}`);
        });
      }
    } else {
      console.log(`⚠️  未找到部署记录`);
    }
  } else {
    console.log(`⚠️  部署目录不存在`);
  }

  // ====================================================================
  // 5. 检查前端配置
  // ====================================================================
  console.log('\n====================================================================');
  console.log('🌐 第五步: 检查前端配置');
  console.log('====================================================================\n');

  const frontendEnvPath = path.join(__dirname, '../frontend/.env');

  if (fs.existsSync(frontendEnvPath)) {
    console.log(`✅ 前端环境变量文件存在`);

    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');

    const frontendRequiredVars = [
      'VITE_CHAIN_ID',
      'VITE_RPC_URL',
      'VITE_WALLETCONNECT_PROJECT_ID',
    ];

    const frontendOptionalVars = [
      'VITE_CONTRACT_TOKEN',
      'VITE_CONTRACT_FACTORY',
      'VITE_CONTRACT_ROUTER',
      'VITE_CONTRACT_VENFT',
      'VITE_CONTRACT_VOTER',
      'VITE_CONTRACT_MINTER',
    ];

    console.log(`\n   必需变量:`);
    for (const varName of frontendRequiredVars) {
      if (frontendEnv.includes(`${varName}=`) && !frontendEnv.includes(`${varName}=\n`)) {
        console.log(`   ✅ ${varName}: 已配置`);
      } else {
        console.log(`   ❌ ${varName}: 未配置`);
        allGood = false;
      }
    }

    console.log(`\n   合约地址 (部署后配置):`);
    for (const varName of frontendOptionalVars) {
      if (frontendEnv.includes(`${varName}=0x`)) {
        console.log(`   ✅ ${varName}: 已配置`);
      } else {
        console.log(`   ⚠️  ${varName}: 未配置 (需要先部署合约)`);
      }
    }
  } else {
    console.log(`❌ 前端环境变量文件不存在`);
    console.log(`   运行: cd frontend && cp .env.example .env`);
    allGood = false;
  }

  // ====================================================================
  // 总结
  // ====================================================================
  console.log('\n====================================================================');
  console.log('📊 检查总结');
  console.log('====================================================================\n');

  if (allGood) {
    console.log('✅ 所有检查通过!');
    console.log('\n🚀 你可以开始部署了:');
    console.log('   npm run deploy:bsc');
  } else {
    console.log('❌ 发现一些问题,请修复后再部署');
    console.log('\n📚 参考文档:');
    console.log('   - QUICK_START.md - 快速启动指南');
    console.log('   - DEPLOYMENT_CHECKLIST.md - 部署检查清单');
    console.log('   - docs/DEPLOYMENT_GUIDE.md - 详细部署指南');
  }

  console.log('\n====================================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
