// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Bribe
 * @notice 投票贿赂合约 - 项目方可以提供贿赂以吸引投票者
 * @dev 投票给该 Gauge 的 ve-NFT 持有者可以领取贿赂奖励
 */
contract Bribe is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice ve-NFT 合约地址
    address public immutable ve;

    /// @notice Voter 合约地址
    address public immutable voter;

    /// @notice 奖励代币列表
    address[] public rewards;

    /// @notice 奖励代币是否已添加
    mapping(address => bool) public isReward;

    /// @notice 奖励数据结构
    struct Reward {
        uint256 periodFinish;        // 奖励结束时间
        uint256 rewardRate;          // 每秒奖励率
        uint256 lastUpdateTime;      // 最后更新时间
        uint256 rewardPerTokenStored; // 每个投票权的累计奖励
    }

    /// @notice 奖励代币信息
    mapping(address => Reward) public rewardData;

    /// @notice 总投票权重
    uint256 public totalSupply;

    /// @notice 用户投票权重
    mapping(address => uint256) public balanceOf;

    /// @notice 用户已支付的每代币奖励
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;

    /// @notice 用户奖励
    mapping(address => mapping(address => uint256)) public rewards_for;

    /// @notice 奖励持续时间 (7 天)
    uint256 public constant DURATION = 7 days;

    /// @notice 最小贿赂金额 (防止粉尘攻击)
    /// @dev P0-047: 防止攻击者用极小金额填满rewards数组
    uint256 public constant MIN_BRIBE_AMOUNT = 100 * 1e18; // 100 tokens

    /// @notice 检查点数据 (记录用户投票历史)
    struct Checkpoint {
        uint256 timestamp;
        uint256 balanceOf;
    }

    /// @notice 用户检查点列表
    mapping(address => Checkpoint[]) public checkpoints;

    /// @notice 供应检查点列表
    Checkpoint[] public supplyCheckpoints;

    event RewardAdded(address indexed rewardToken, uint256 reward);
    event RewardPaid(address indexed user, address indexed rewardToken, uint256 reward);
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(address _ve, address _voter) {
        ve = _ve;
        voter = _voter;
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
     * @notice 计算每个投票权的奖励
     */
    function rewardPerToken(address token) public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardData[token].rewardPerTokenStored;
        }
        return rewardData[token].rewardPerTokenStored +
            ((lastTimeRewardApplicable(token) - rewardData[token].lastUpdateTime) *
                rewardData[token].rewardRate * 1e18) / totalSupply;
    }

    /**
     * @notice 计算用户可领取的奖励
     */
    function earned(address token, address account) public view returns (uint256) {
        return (balanceOf[account] * (rewardPerToken(token) - userRewardPerTokenPaid[token][account])) / 1e18 +
            rewards_for[token][account];
    }

    /**
     * @notice 存入投票权重 (由 Voter 调用)
     */
    function _deposit(uint256 amount, address account) external {
        require(msg.sender == voter, "Bribe: not voter");
        require(amount > 0, "Bribe: zero amount");

        _updateRewards(account);

        totalSupply += amount;
        balanceOf[account] += amount;

        // 记录检查点
        _writeCheckpoint(account, balanceOf[account]);
        _writeSupplyCheckpoint();

        emit Deposit(account, amount);
    }

    /**
     * @notice 提取投票权重 (由 Voter 调用)
     */
    function _withdraw(uint256 amount, address account) external {
        require(msg.sender == voter, "Bribe: not voter");
        require(amount > 0, "Bribe: zero amount");

        _updateRewards(account);

        totalSupply -= amount;
        balanceOf[account] -= amount;

        // 记录检查点
        _writeCheckpoint(account, balanceOf[account]);
        _writeSupplyCheckpoint();

        emit Withdraw(account, amount);
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
     * @notice 通知奖励数量
     * @param token 奖励代币地址
     * @param amount 奖励数量
     * @dev P0-047: 添加最小贿赂金额检查,防止粉尘攻击
     */
    function notifyRewardAmount(address token, uint256 amount) external nonReentrant {
        require(amount >= MIN_BRIBE_AMOUNT, "Bribe: amount too small");

        // 转入代币
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // 添加新的奖励代币
        if (!isReward[token]) {
            require(rewards.length < 10, "Bribe: too many rewards");
            rewards.push(token);
            isReward[token] = true;
        }

        _updateRewards(address(0));

        if (block.timestamp >= rewardData[token].periodFinish) {
            rewardData[token].rewardRate = amount / DURATION;
        } else {
            uint256 remaining = rewardData[token].periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardData[token].rewardRate;
            rewardData[token].rewardRate = (amount + leftover) / DURATION;
        }

        require(rewardData[token].rewardRate > 0, "Bribe: reward rate too low");
        require(
            rewardData[token].rewardRate * DURATION <= IERC20(token).balanceOf(address(this)),
            "Bribe: reward amount exceeds balance"
        );

        rewardData[token].lastUpdateTime = block.timestamp;
        rewardData[token].periodFinish = block.timestamp + DURATION;

        emit RewardAdded(token, amount);
    }

    /**
     * @notice 记录用户检查点
     */
    function _writeCheckpoint(address account, uint256 balance) internal {
        uint256 _nCheckpoints = checkpoints[account].length;

        if (_nCheckpoints > 0 && checkpoints[account][_nCheckpoints - 1].timestamp == block.timestamp) {
            checkpoints[account][_nCheckpoints - 1].balanceOf = balance;
        } else {
            checkpoints[account].push(Checkpoint({timestamp: block.timestamp, balanceOf: balance}));
        }
    }

    /**
     * @notice 记录总供应检查点
     */
    function _writeSupplyCheckpoint() internal {
        uint256 _nCheckpoints = supplyCheckpoints.length;

        if (_nCheckpoints > 0 && supplyCheckpoints[_nCheckpoints - 1].timestamp == block.timestamp) {
            supplyCheckpoints[_nCheckpoints - 1].balanceOf = totalSupply;
        } else {
            supplyCheckpoints.push(Checkpoint({timestamp: block.timestamp, balanceOf: totalSupply}));
        }
    }

    /**
     * @notice 获取用户在指定时间的投票权重
     */
    function balanceOfAt(address account, uint256 timestamp) external view returns (uint256) {
        uint256 _nCheckpoints = checkpoints[account].length;
        if (_nCheckpoints == 0) {
            return 0;
        }

        // 二分查找
        uint256 min = 0;
        uint256 max = _nCheckpoints - 1;
        while (min < max) {
            uint256 mid = (min + max + 1) / 2;
            if (checkpoints[account][mid].timestamp <= timestamp) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }

        return checkpoints[account][min].balanceOf;
    }

    /**
     * @notice 获取指定时间的总供应量
     */
    function totalSupplyAt(uint256 timestamp) external view returns (uint256) {
        uint256 _nCheckpoints = supplyCheckpoints.length;
        if (_nCheckpoints == 0) {
            return 0;
        }

        // 二分查找
        uint256 min = 0;
        uint256 max = _nCheckpoints - 1;
        while (min < max) {
            uint256 mid = (min + max + 1) / 2;
            if (supplyCheckpoints[mid].timestamp <= timestamp) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }

        return supplyCheckpoints[min].balanceOf;
    }
}
