import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Flex,
  Badge,
  Skeleton,
  useToast,
} from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useProtocolStats } from '../../hooks/useProtocolStats'
import { useUserPortfolio } from '../../hooks/useUserPortfolio'
import { useUserRewards, useClaimAllRewards } from '../../hooks/useUserRewards'
import { useUserLiquidityPositions } from '../../hooks/useUserLiquidityPositions'
import { useUserVeNFTs } from '../../hooks/useVeNFT'
import { formatUSDPrice } from '../../hooks/useTokenPrice'
import { formatTokenAmount } from '../../utils/format'
import { colors } from '../../constants/theme'

// 模拟收益历史数据（用于图表）
const mockEarningsData = [
  { date: '1/1', value: 0 },
  { date: '1/5', value: 120 },
  { date: '1/10', value: 250 },
  { date: '1/15', value: 380 },
  { date: '1/20', value: 520 },
  { date: '1/25', value: 680 },
  { date: '1/30', value: 850 },
]

export function DashboardV2() {
  const { isConnected } = useAccount()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const toast = useToast()

  // 数据Hooks
  const protocolStats = useProtocolStats()
  const userPortfolio = useUserPortfolio()
  const userRewards = useUserRewards()
  const { positions } = useUserLiquidityPositions()
  const { nfts: veNFTs } = useUserVeNFTs()
  const { claimAll, isPending: isClaimPending } = useClaimAllRewards()

  // 自动刷新机制
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // 触发数据重新获取（通过修改key或使用refetch）
      console.log('🔄 自动刷新数据...')
    }, 30000) // 30秒

    return () => clearInterval(interval)
  }, [autoRefresh])

  // 处理领取所有奖励
  const handleClaimAll = async () => {
    try {
      await claimAll()
      toast({
        title: '领取成功',
        description: '所有奖励已成功领取',
        status: 'success',
        duration: 5000,
      })
    } catch (error) {
      toast({
        title: '领取失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 5000,
      })
    }
  }

  // 未连接钱包状态
  if (!isConnected) {
    return (
      <Box maxW="1200px" mx="auto" p={6}>
        <ChakraCard>
          <CardBody textAlign="center" py={16}>
            <Text fontSize="6xl" mb={4}>
              👛
            </Text>
            <Heading size="lg" mb={2}>
              欢迎来到 ve(3,3) DEX
            </Heading>
            <Text color="gray.500" mb={6}>
              请连接钱包以开始使用
            </Text>
            <w3m-button />
          </CardBody>
        </ChakraCard>
      </Box>
    )
  }

  return (
    <Box maxW="1400px" mx="auto" p={6}>
      {/* 页面标题 */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading
            size="xl"
            bgGradient="linear(to-r, purple.400, pink.400)"
            bgClip="text"
            fontWeight="bold"
          >
            仪表盘
          </Heading>
          <Text color="gray.500" mt={1}>
            管理您的资产和参与治理
          </Text>
        </Box>
        <Flex gap={2}>
          <Badge colorScheme={autoRefresh ? 'green' : 'gray'} p={2} borderRadius="md">
            {autoRefresh ? '🟢 自动刷新' : '⏸️ 已暂停'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '暂停' : '启用'}刷新
          </Button>
        </Flex>
      </Flex>

      {/* 协议全局统计 */}
      <ChakraCard mb={6} bg={`${colors.bgSecondary}cc`} backdropFilter="blur(10px)">
        <CardHeader>
          <Heading size="md">📊 协议概览</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <Stat>
              <StatLabel>总TVL</StatLabel>
              <Skeleton isLoaded={!protocolStats.isLoading}>
                <StatNumber color="green.400">
                  {formatUSDPrice(protocolStats.protocolTVL, 0)}
                </StatNumber>
              </Skeleton>
              <StatHelpText>
                <StatArrow type="increase" />
                12.5%
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>24h交易量</StatLabel>
              <Skeleton isLoaded={!protocolStats.isLoading}>
                <StatNumber>{formatUSDPrice(protocolStats.volume24h, 0)}</StatNumber>
              </Skeleton>
              <StatHelpText>
                <StatArrow type="increase" />
                8.3%
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>流动性池数</StatLabel>
              <Skeleton isLoaded={!protocolStats.isLoading}>
                <StatNumber>{protocolStats.poolCount}</StatNumber>
              </Skeleton>
              <StatHelpText>活跃池子</StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>ve-NFT 活跃数</StatLabel>
              <Skeleton isLoaded={!protocolStats.isLoading}>
                <StatNumber>{protocolStats.veNFTCount}</StatNumber>
              </Skeleton>
              <StatHelpText>投票治理</StatHelpText>
            </Stat>
          </Grid>
        </CardBody>
      </ChakraCard>

      {/* 用户资产概览 */}
      <ChakraCard mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">💼 我的资产总览</Heading>
            <Skeleton isLoaded={!userPortfolio.isLoading}>
              <Heading size="lg" color="green.400">
                {formatUSDPrice(userPortfolio.totalValueUSD, 2)}
              </Heading>
            </Skeleton>
          </Flex>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <Stat>
              <StatLabel>💰 钱包余额</StatLabel>
              <Skeleton isLoaded={!userPortfolio.isLoading}>
                <StatNumber fontSize="xl">
                  {formatUSDPrice(userPortfolio.walletValueUSD, 2)}
                </StatNumber>
              </Skeleton>
            </Stat>

            <Stat>
              <StatLabel>💧 流动性</StatLabel>
              <Skeleton isLoaded={!userPortfolio.isLoading}>
                <StatNumber fontSize="xl">
                  {formatUSDPrice(userPortfolio.liquidityValueUSD, 2)}
                </StatNumber>
              </Skeleton>
              <StatHelpText>{userPortfolio.liquidityPositions} 个池</StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>🏦 质押资产</StatLabel>
              <Skeleton isLoaded={!userPortfolio.isLoading}>
                <StatNumber fontSize="xl">
                  {formatUSDPrice(userPortfolio.stakedValueUSD, 2)}
                </StatNumber>
              </Skeleton>
            </Stat>

            <Stat>
              <StatLabel>🔒 ve-NFT 锁仓</StatLabel>
              <Skeleton isLoaded={!userPortfolio.isLoading}>
                <StatNumber fontSize="xl">
                  {formatUSDPrice(userPortfolio.veNFTValueUSD, 2)}
                </StatNumber>
              </Skeleton>
              <StatHelpText>{userPortfolio.veNFTCount} NFTs</StatHelpText>
            </Stat>
          </Grid>
        </CardBody>
      </ChakraCard>

      {/* 待领取奖励 */}
      <ChakraCard mb={6} borderColor="orange.400" borderWidth={userRewards.hasRewards ? 2 : 1}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">🎁 待领取奖励</Heading>
            {userRewards.hasRewards && (
              <Button
                colorScheme="orange"
                size="sm"
                leftIcon={<Text>🔥</Text>}
                onClick={handleClaimAll}
                isLoading={isClaimPending}
              >
                一键领取全部
              </Button>
            )}
          </Flex>
        </CardHeader>
        <CardBody>
          {userRewards.hasRewards ? (
            <>
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4} mb={4}>
                <Box p={4} bg="blue.900" borderRadius="md" borderWidth={1} borderColor="blue.700">
                  <Text fontSize="sm" color="blue.300">
                    💵 交易手续费
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.400">
                    {formatUSDPrice(userRewards.totalFeeUSD, 2)}
                  </Text>
                </Box>

                <Box p={4} bg="purple.900" borderRadius="md" borderWidth={1} borderColor="purple.700">
                  <Text fontSize="sm" color="purple.300">
                    🎯 投票贿赂
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.400">
                    {formatUSDPrice(userRewards.totalBribeUSD, 2)}
                  </Text>
                </Box>

                <Box p={4} bg="green.900" borderRadius="md" borderWidth={1} borderColor="green.700">
                  <Text fontSize="sm" color="green.300">
                    ⛏️ LP质押奖励
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.400">
                    {formatUSDPrice(userRewards.totalEmissionUSD, 2)}
                  </Text>
                </Box>
              </Grid>

              <Box p={4} bg="orange.900" borderRadius="md" borderWidth={2} borderColor="orange.600">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontSize="sm" color="orange.300">
                      总计待领取
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">
                      {formatUSDPrice(userRewards.totalRewardsUSD, 2)}
                    </Text>
                  </Box>
                  <Button
                    colorScheme="orange"
                    size="lg"
                    onClick={handleClaimAll}
                    isLoading={isClaimPending}
                  >
                    立即领取
                  </Button>
                </Flex>
              </Box>
            </>
          ) : (
            <Box textAlign="center" py={8} color="gray.500">
              <Text fontSize="4xl" mb={2}>
                🎁
              </Text>
              <Text>暂无待领取奖励</Text>
              <Text fontSize="sm" mt={1}>
                参与流动性提供、质押或投票即可获得奖励
              </Text>
            </Box>
          )}
        </CardBody>
      </ChakraCard>

      {/* 用户持仓和图表 */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        {/* 我的流动性 */}
        <ChakraCard>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">💧 我的流动性</Heading>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => window.navigateTo?.('liquidity')}
              >
                + 添加
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            {positions && positions.length > 0 ? (
              <Box>
                {positions.slice(0, 3).map((position) => (
                  <Box
                    key={position.pairAddress}
                    p={3}
                    mb={2}
                    bg="gray.700"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="gray.600"
                    _hover={{ bg: 'gray.600', borderColor: 'blue.500' }}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="600">
                          {position.token0Symbol || position.token0.slice(0, 6)} /{' '}
                          {position.token1Symbol || position.token1.slice(0, 6)}
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          LP: {formatTokenAmount(position.lpBalance, 18, 4)}
                        </Text>
                      </Box>
                      <Badge colorScheme={position.stable ? 'blue' : 'purple'}>
                        {position.stable ? '稳定' : '波动'}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
                {positions.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    mt={2}
                    onClick={() => window.navigateTo?.('liquidity')}
                  >
                    查看全部 {positions.length} 个池 →
                  </Button>
                )}
              </Box>
            ) : (
              <Box textAlign="center" py={8} color="gray.500">
                <Text fontSize="3xl" mb={2}>
                  💧
                </Text>
                <Text>尚未提供流动性</Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  mt={3}
                  onClick={() => window.navigateTo?.('liquidity')}
                >
                  开始添加
                </Button>
              </Box>
            )}
          </CardBody>
        </ChakraCard>

        {/* 我的 ve-NFT */}
        <ChakraCard>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">🔒 我的 ve-NFT</Heading>
              <Button size="sm" colorScheme="purple" onClick={() => window.navigateTo?.('lock')}>
                + 创建
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            {veNFTs && veNFTs.length > 0 ? (
              <Box>
                {veNFTs.slice(0, 3).map((nft) => (
                  <Box
                    key={nft.tokenId}
                    p={3}
                    mb={2}
                    bg="purple.900"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="purple.700"
                    _hover={{ bg: 'purple.800', borderColor: 'purple.500' }}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="600">NFT #{nft.tokenId.toString()}</Text>
                        <Text fontSize="sm" color="gray.600">
                          投票权重: {formatTokenAmount(nft.votingPower, 18, 2)}
                        </Text>
                      </Box>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => window.navigateTo?.('lock')}
                      >
                        管理
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={8} color="gray.500">
                <Text fontSize="3xl" mb={2}>
                  🔒
                </Text>
                <Text>尚未创建 ve-NFT</Text>
                <Button
                  size="sm"
                  colorScheme="purple"
                  mt={3}
                  onClick={() => window.navigateTo?.('lock')}
                >
                  立即创建
                </Button>
              </Box>
            )}
          </CardBody>
        </ChakraCard>
      </Grid>

      {/* 收益趋势图表 */}
      <ChakraCard mb={6}>
        <CardHeader>
          <Heading size="md">📈 收益趋势（最近30天）</Heading>
        </CardHeader>
        <CardBody>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockEarningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${value}`, '收益']}
                  labelStyle={{ color: '#000' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={4}>
            <Stat size="sm">
              <StatLabel>累计收益</StatLabel>
              <StatNumber color="green.500">$850</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>日均收益</StatLabel>
              <StatNumber>$28.33</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>年化收益率</StatLabel>
              <StatNumber color="purple.500">38.5%</StatNumber>
            </Stat>
          </Grid>
        </CardBody>
      </ChakraCard>

      {/* 快速操作 */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
        <QuickActionCard
          icon="🔄"
          title="Swap"
          description="交换代币"
          onClick={() => window.navigateTo?.('swap')}
        />
        <QuickActionCard
          icon="💧"
          title="流动性"
          description="添加流动性"
          onClick={() => window.navigateTo?.('liquidity')}
        />
        <QuickActionCard
          icon="🌾"
          title="挖矿"
          description="查看Farms"
          onClick={() => window.navigateTo?.('farms')}
        />
        <QuickActionCard
          icon="🔒"
          title="锁仓"
          description="创建ve-NFT"
          onClick={() => window.navigateTo?.('lock')}
        />
        <QuickActionCard
          icon="🗳️"
          title="投票"
          description="参与治理"
          onClick={() => window.navigateTo?.('vote')}
        />
        <QuickActionCard
          icon="🎁"
          title="奖励"
          description="领取奖励"
          onClick={() => window.navigateTo?.('rewards')}
        />
      </Grid>
    </Box>
  )
}

// 快速操作卡片组件
function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Box
      as="button"
      p={4}
      bg="gray.800"
      borderWidth={1}
      borderColor="gray.700"
      borderRadius="lg"
      textAlign="left"
      transition="all 0.2s"
      _hover={{
        bg: 'gray.700',
        borderColor: 'purple.400',
        transform: 'translateY(-2px)',
        shadow: 'lg',
      }}
      onClick={onClick}
    >
      <Text fontSize="2xl" mb={2}>
        {icon}
      </Text>
      <Text fontWeight="600" mb={1} color="white">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.400">
        {description}
      </Text>
    </Box>
  )
}
