// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Gauge
 * @notice 流动性激励分发合约 - 根据投票权重分发奖励
 * @dev 支持多种奖励代币,LP 根据其 ve-NFT 权重获得奖励
 */
contract Gauge is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice 质押的 LP 代币
    address public immutable stake;

    /// @notice ve-NFT 合约地址
    address public immutable ve;

    /// @notice Voter 合约地址
    address public immutable voter;

    /// @notice 总质押量
    uint256 public totalSupply;

    /// @notice 用户质押余额
    mapping(address => uint256) public balanceOf;

    /// @notice 奖励代币列表
    address[] public rewards;

    /// @notice 奖励代币是否已添加
    mapping(address => bool) public isReward;

    /// @notice 奖励数据
    struct Reward {
        uint256 periodFinish;        // 奖励结束时间
        uint256 rewardRate;          // 每秒奖励率
        uint256 lastUpdateTime;      // 最后更新时间
        uint256 rewardPerTokenStored; // 每个代币的累计奖励
    }

    /// @notice 奖励代币信息映射
    mapping(address => Reward) public rewardData;

    /// @notice 用户已支付的每代币奖励
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;

    /// @notice 用户奖励
    mapping(address => mapping(address => uint256)) public rewards_for;

    /// @notice 奖励持续时间 (7 天)
    uint256 public constant DURATION = 7 days;

    /// @notice 精度常量 (用于高精度奖励计算)
    /// @dev P0-042: 使用更高精度(1e36)避免小额质押时的精度损失
    uint256 public constant PRECISION = 1e36;

    /// @notice 最小奖励金额
    uint256 public constant MIN_REWARD_AMOUNT = 1e18;

    /// @notice Fees 合约地址
    address public fees;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardAdded(address indexed rewardToken, uint256 reward);
    event RewardPaid(address indexed user, address indexed rewardToken, uint256 reward);

    constructor(address _stake, address _ve, address _voter) {
        stake = _stake;
        ve = _ve;
        voter = _voter;
    }

    /**
     * @notice 设置 Fees 合约地址
     */
    function setFees(address _fees) external {
        require(msg.sender == voter, "Gauge: not voter");
        fees = _fees;
    }

    /**
     * @notice 获取奖励代币数量
     */
    function rewardsListLength() external view returns (uint256) {
        return rewards.length;
    }

    /**
     * @notice 最后一次奖励适用时间
     */
    function lastTimeRewardApplicable(address token) public view returns (uint256) {
        return block.timestamp < rewardData[token].periodFinish ? block.timestamp : rewardData[token].periodFinish;
    }

    /**
     * @notice 计算每个代币的奖励
     * @dev P0-042: 使用更高精度(1e36)避免小额质押时精度损失
     */
    function rewardPerToken(address token) public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardData[token].rewardPerTokenStored;
        }

        // 使用更高精度计算
        uint256 timeElapsed = lastTimeRewardApplicable(token) - rewardData[token].lastUpdateTime;
        uint256 rewardIncrement = (timeElapsed * rewardData[token].rewardRate * PRECISION) / totalSupply;

        return rewardData[token].rewardPerTokenStored + rewardIncrement;
    }

    /**
     * @notice 计算用户可领取的奖励
     * @dev 使用PRECISION匹配rewardPerToken的精度
     */
    function earned(address token, address account) public view returns (uint256) {
        return (balanceOf[account] * (rewardPerToken(token) - userRewardPerTokenPaid[token][account])) / PRECISION +
            rewards_for[token][account];
    }

    /**
     * @notice 获取某个代币的奖励
     */
    function getRewardForDuration(address token) external view returns (uint256) {
        return rewardData[token].rewardRate * DURATION;
    }

    /**
     * @notice 质押 LP 代币
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Gauge: zero amount");
        _updateRewards(msg.sender);

        IERC20(stake).safeTransferFrom(msg.sender, address(this), amount);
        totalSupply += amount;
        balanceOf[msg.sender] += amount;

        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice 质押 LP 代币(为其他地址)
     */
    function depositFor(address account, uint256 amount) external nonReentrant {
        require(amount > 0, "Gauge: zero amount");
        _updateRewards(account);

        IERC20(stake).safeTransferFrom(msg.sender, address(this), amount);
        totalSupply += amount;
        balanceOf[account] += amount;

        emit Deposit(account, amount);
    }

    /**
     * @notice 提取 LP 代币
     */
    function withdraw(uint256 amount) public nonReentrant {
        require(amount > 0, "Gauge: zero amount");
        _updateRewards(msg.sender);

        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;
        IERC20(stake).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice 领取所有奖励
     */
    function getReward() external nonReentrant {
        _updateRewards(msg.sender);

        for (uint256 i = 0; i < rewards.length; i++) {
            address token = rewards[i];
            uint256 reward = rewards_for[token][msg.sender];
            if (reward > 0) {
                rewards_for[token][msg.sender] = 0;
                IERC20(token).safeTransfer(msg.sender, reward);
                emit RewardPaid(msg.sender, token, reward);
            }
        }
    }

    /**
     * @notice 提取并领取奖励
     */
    function withdrawAndGetReward(uint256 amount) external {
        withdraw(amount);
        this.getReward();
    }

    /**
     * @notice 退出 (提取全部并领取奖励)
     */
    function exit() external {
        withdraw(balanceOf[msg.sender]);
        this.getReward();
    }

    /**
     * @notice 更新用户奖励
     */
    function _updateRewards(address account) internal {
        for (uint256 i = 0; i < rewards.length; i++) {
            address token = rewards[i];
            rewardData[token].rewardPerTokenStored = rewardPerToken(token);
            rewardData[token].lastUpdateTime = lastTimeRewardApplicable(token);

            if (account != address(0)) {
                rewards_for[token][account] = earned(token, account);
                userRewardPerTokenPaid[token][account] = rewardData[token].rewardPerTokenStored;
            }
        }
    }

    /**
     * @notice 通知奖励数量 (由 Voter 或 Bribe 调用)
     * @param token 奖励代币地址
     * @param reward 奖励数量
     * @dev P0-042: 添加最小奖励金额检查
     */
    function notifyRewardAmount(address token, uint256 reward) external nonReentrant {
        require(reward >= MIN_REWARD_AMOUNT, "Gauge: reward too small");

        // 添加新的奖励代币
        if (!isReward[token]) {
            require(rewards.length < 10, "Gauge: too many rewards");
            rewards.push(token);
            isReward[token] = true;
        }

        _updateRewards(address(0));

        if (block.timestamp >= rewardData[token].periodFinish) {
            rewardData[token].rewardRate = reward / DURATION;
        } else {
            uint256 remaining = rewardData[token].periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardData[token].rewardRate;
            rewardData[token].rewardRate = (reward + leftover) / DURATION;
        }

        require(rewardData[token].rewardRate > 0, "Gauge: reward rate too low");
        require(
            rewardData[token].rewardRate * DURATION <= IERC20(token).balanceOf(address(this)),
            "Gauge: reward amount exceeds balance"
        );

        rewardData[token].lastUpdateTime = block.timestamp;
        rewardData[token].periodFinish = block.timestamp + DURATION;

        emit RewardAdded(token, reward);
    }

    /**
     * @notice 领取费用 (从 Pair 合约)
     */
    function claimFees() external nonReentrant returns (uint256 claimed0, uint256 claimed1) {
        require(msg.sender == voter, "Gauge: not voter");
        if (fees != address(0)) {
            (claimed0, claimed1) = IFees(fees).claimFeesFor(address(this));
        }
    }
}

interface IFees {
    function claimFeesFor(address recipient) external returns (uint256, uint256);
}
