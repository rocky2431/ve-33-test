# 🚀 Vercel 部署指南

本指南将帮助您将 ve(3,3) DEX 前端应用部署到 Vercel。

## 📋 部署前准备

### 1. Vercel 账户设置
1. 访问 https://vercel.com 并登录/注册
2. 连接您的 GitHub 账户
3. 授权 Vercel 访问您的仓库

### 2. 获取 WalletConnect Project ID
1. 访问 https://cloud.reown.com/app
2. 创建新项目或使用现有项目
3. 复制 Project ID（格式：`5c95ea8bc77173454cd81cb8f8c3350f`）

## 🔧 部署步骤

### 方式一：通过 Vercel Dashboard（推荐）

#### Step 1: 导入项目
1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 点击 **"Add New..."** → **"Project"**
3. 选择您的 GitHub 仓库：`rocky2431/ve-33-test`
4. 点击 **"Import"**

#### Step 2: 配置项目设置

**Framework Preset:** 选择 `Vite`

**Root Directory:** 保持默认（项目根目录）或选择 `frontend`

**Build Settings:**
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Install Command:** `cd frontend && npm install`

#### Step 3: 配置环境变量

在 **Environment Variables** 部分，添加以下变量：

```bash
# 网络配置
VITE_CHAIN_ID=97
VITE_CHAIN_NAME=BSC Testnet
VITE_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
VITE_BLOCK_EXPLORER=https://testnet.bscscan.com

# WalletConnect Project ID (必须配置)
VITE_WALLETCONNECT_PROJECT_ID=5c95ea8bc77173454cd81cb8f8c3350f

# 核心 AMM 层合约地址
VITE_CONTRACT_TOKEN=0x4367741631B171d87f9d8a747636Fa3E3Bd048D8
VITE_CONTRACT_FACTORY=0xbA33Aa1E0f257e7a3b54c2862ac1684c2f3E8C29
VITE_CONTRACT_ROUTER=0x4D6aa9a7740a4DDD4dCC8EDB3F4f43B205daA652
VITE_CONTRACT_WETH=0x9799159b07f21106b6219B998184034C09e042ef

# ve(3,3) 治理层合约地址
VITE_CONTRACT_VOTING_ESCROW=0x6d5174E4c1461ea76C03BF84e4bD2b621bfA7Fee
VITE_CONTRACT_VOTER=0xda38EcEA1300ea3c229f5b068eFb3C09e78A995D
VITE_CONTRACT_REWARDS_DISTRIBUTOR=0x194cC32a71dCE337943d1299120A57d7a2FCEB76
VITE_CONTRACT_MINTER=0x86b09D8C374FA0e83eDe3D47cAb5c261824Aff71
```

**重要提示：**
- 所有环境变量都适用于 `Production`, `Preview`, `Development` 环境
- 点击每个变量后的复选框以应用到所有环境

#### Step 4: 部署
1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，您将获得一个 Vercel URL（格式：`your-project.vercel.app`）

---

### 方式二：通过 Vercel CLI

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署项目
在项目根目录执行：
```bash
vercel
```

按照提示操作：
- **Set up and deploy?** → Yes
- **Which scope?** → 选择您的账户
- **Link to existing project?** → No
- **Project name?** → `ve33-dex` (或您想要的名称)
- **Directory?** → `./` (项目根目录)
- **Override settings?** → Yes
  - **Build Command:** `cd frontend && npm install && npm run build`
  - **Output Directory:** `frontend/dist`
  - **Development Command:** `cd frontend && npm run dev`

#### 4. 添加环境变量
```bash
# 通过 CLI 添加环境变量
vercel env add VITE_WALLETCONNECT_PROJECT_ID
# 输入值: 5c95ea8bc77173454cd81cb8f8c3350f

# 重复以上步骤添加其他环境变量
```

#### 5. 生产环境部署
```bash
vercel --prod
```

---

## 🔍 部署后验证

### 1. 检查网站访问
访问您的 Vercel URL，确保页面正常加载

### 2. 测试钱包连接
1. 点击 "连接钱包" 按钮
2. 选择钱包（如 MetaMask）
3. 确认连接到 BSC Testnet

### 3. 测试核心功能
- ✅ Swap 页面可以正常显示
- ✅ Liquidity 添加流动性功能
- ✅ Lock 创建 ve-NFT
- ✅ Vote 投票功能
- ✅ Rewards 奖励领取

---

## 🔄 自动部署（推荐）

Vercel 会自动监听您的 GitHub 仓库：

- **Push to `main` branch** → 自动部署到生产环境
- **Push to other branches** → 自动创建预览部署
- **Pull Request** → 自动生成预览链接

---

## ⚙️ 高级配置

### 自定义域名
1. 进入 Vercel 项目设置
2. 点击 **Domains**
3. 添加您的自定义域名
4. 按照指示配置 DNS 记录

### 性能优化
Vercel 自动提供：
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 图片优化
- ✅ 边缘缓存

---

## 🐛 常见问题排查

### 问题 1: 构建失败 - "VITE_WALLETCONNECT_PROJECT_ID is not set"
**解决方案：** 确保在 Vercel 环境变量中添加了 `VITE_WALLETCONNECT_PROJECT_ID`

### 问题 2: 页面空白或 404 错误
**解决方案：**
1. 检查 Output Directory 设置为 `frontend/dist`
2. 确认 `vercel.json` 中的 rewrites 规则正确

### 问题 3: 钱包连接失败
**解决方案：**
1. 检查 WalletConnect Project ID 是否正确
2. 确认合约地址配置正确
3. 检查浏览器控制台错误信息

### 问题 4: 环境变量未生效
**解决方案：**
1. 重新部署项目：Vercel Dashboard → Deployments → Redeploy
2. 确保环境变量应用到了正确的环境（Production/Preview/Development）

---

## 📊 监控和分析

### Vercel Analytics
1. 进入项目设置 → Analytics
2. 启用 **Vercel Analytics**
3. 查看页面性能、访问统计

### 日志查看
1. Vercel Dashboard → 选择部署
2. 点击 **Runtime Logs** 查看运行时日志
3. 点击 **Build Logs** 查看构建日志

---

## 🔐 安全建议

1. **环境变量安全**
   - ❌ 不要在代码中硬编码敏感信息
   - ✅ 使用 Vercel 环境变量功能
   - ✅ `.env` 文件已添加到 `.gitignore`

2. **HTTPS 强制**
   - Vercel 自动启用 HTTPS
   - 所有 HTTP 请求自动重定向到 HTTPS

3. **安全头配置**
   - `vercel.json` 中已配置安全响应头
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

---

## 📝 更新部署

### 更新代码
```bash
# 1. 更新代码
git add .
git commit -m "feat: 更新功能"
git push origin main

# 2. Vercel 自动检测并重新部署
```

### 更新环境变量
1. Vercel Dashboard → Settings → Environment Variables
2. 编辑现有变量或添加新变量
3. 重新部署以应用更改

---

## 🎉 部署完成！

您的 ve(3,3) DEX 前端应用现在已经部署到 Vercel！

- **生产环境 URL:** `https://your-project.vercel.app`
- **预览部署:** 每个 PR 都会自动生成预览链接
- **自动部署:** 每次推送到 main 分支都会触发部署

**下一步：**
1. 配置自定义域名
2. 启用 Vercel Analytics
3. 设置团队协作权限
4. 监控性能和错误日志

---

**需要帮助？**
- Vercel 文档: https://vercel.com/docs
- 项目问题: 提交 GitHub Issue
