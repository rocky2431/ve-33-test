// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IVotingEscrow.sol";

/**
 * @title RewardsDistributor
 * @notice ve持有者奖励分配合约 - 实现30%排放的rebase机制
 * @dev 核心功能:
 *      1. 接收Minter分配的30%排放
 *      2. 按ve持有者的投票权重比例分配rebase奖励
 *      3. 支持单个和批量领取
 *      4. 防止重复领取
 */
contract RewardsDistributor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice VotingEscrow合约地址
    address public immutable votingEscrow;

    /// @notice 治理代币地址
    address public immutable token;

    /// @notice Minter合约地址
    address public minter;

    /// @notice 时间周期常量 (1周)
    uint256 public constant WEEK = 7 days;

    /// @notice 每个epoch的总奖励数量
    /// @dev epoch => 奖励金额
    mapping(uint256 => uint256) public tokensPerEpoch;

    /// @notice 用户每个epoch的领取记录
    /// @dev tokenId => epoch => 是否已领取
    mapping(uint256 => mapping(uint256 => bool)) public claimed;

    /// @notice 奖励添加事件
    event RewardAdded(uint256 indexed epoch, uint256 amount);

    /// @notice Rebase领取事件
    event RebaseClaimed(
        uint256 indexed tokenId,
        uint256 indexed epoch,
        uint256 reward,
        address indexed owner
    );

    /// @notice Minter设置事件
    event MinterSet(address indexed minter);

    /**
     * @notice 构造函数
     * @param _ve VotingEscrow合约地址
     * @param _token 治理代币地址
     */
    constructor(address _ve, address _token) {
        require(_ve != address(0), "RewardsDistributor: zero ve address");
        require(_token != address(0), "RewardsDistributor: zero token address");

        votingEscrow = _ve;
        token = _token;
    }

    /**
     * @notice 设置Minter地址
     * @param _minter Minter合约地址
     * @dev 只能设置一次
     */
    function setMinter(address _minter) external {
        require(minter == address(0), "RewardsDistributor: minter already set");
        require(_minter != address(0), "RewardsDistributor: zero minter address");

        minter = _minter;
        emit MinterSet(_minter);
    }

    /**
     * @notice 添加奖励 (由Minter调用)
     * @param amount 奖励数量
     * @dev 每个epoch只能添加一次
     */
    function notifyRewardAmount(uint256 amount) external nonReentrant {
        require(msg.sender == minter, "RewardsDistributor: not minter");
        require(amount > 0, "RewardsDistributor: zero amount");

        uint256 epoch = block.timestamp / WEEK;

        // 累积奖励(支持同一epoch多次调用)
        tokensPerEpoch[epoch] += amount;

        // 从Minter转入奖励代币
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit RewardAdded(epoch, amount);
    }

    /**
     * @notice 领取rebase奖励
     * @param tokenId veNFT ID
     * @return reward 领取的奖励数量
     */
    function claimRebase(uint256 tokenId) public nonReentrant returns (uint256 reward) {
        // 验证所有权
        require(
            IERC721(votingEscrow).ownerOf(tokenId) == msg.sender,
            "RewardsDistributor: not owner"
        );

        uint256 epoch = block.timestamp / WEEK;

        // 防止重复领取
        require(
            !claimed[tokenId][epoch],
            "RewardsDistributor: already claimed"
        );

        // 计算奖励
        reward = _calculateReward(tokenId, epoch);
        require(reward > 0, "RewardsDistributor: zero reward");

        // 标记已领取
        claimed[tokenId][epoch] = true;

        // 转账奖励
        IERC20(token).safeTransfer(msg.sender, reward);

        emit RebaseClaimed(tokenId, epoch, reward, msg.sender);
    }

    /**
     * @notice 批量领取多个veNFT的rebase奖励
     * @param tokenIds veNFT ID数组
     * @return totalReward 总领取数量
     */
    function claimMany(uint256[] calldata tokenIds) external returns (uint256 totalReward) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalReward += claimRebase(tokenIds[i]);
        }
    }

    /**
     * @notice 计算veNFT在指定epoch的奖励
     * @param tokenId veNFT ID
     * @param epoch 时间周期
     * @return reward 奖励数量
     */
    function _calculateReward(
        uint256 tokenId,
        uint256 epoch
    ) internal view returns (uint256 reward) {
        // 获取该epoch的总奖励
        uint256 totalReward = tokensPerEpoch[epoch];
        if (totalReward == 0) {
            return 0;
        }

        // 获取用户的投票权重
        uint256 userPower = IVotingEscrow(votingEscrow).balanceOfNFT(tokenId);
        if (userPower == 0) {
            return 0;
        }

        // 获取总投票权重
        uint256 totalPower = IVotingEscrow(votingEscrow).totalSupply();
        if (totalPower == 0) {
            return 0;
        }

        // 按比例计算奖励
        reward = (totalReward * userPower) / totalPower;
    }

    /**
     * @notice 查询veNFT的待领取奖励
     * @param tokenId veNFT ID
     * @return reward 待领取数量
     */
    function claimable(uint256 tokenId) external view returns (uint256 reward) {
        uint256 epoch = block.timestamp / WEEK;

        // 如果已领取,返回0
        if (claimed[tokenId][epoch]) {
            return 0;
        }

        return _calculateReward(tokenId, epoch);
    }

    /**
     * @notice 查询历史epoch的奖励数量
     * @param epoch 时间周期
     * @return amount 奖励数量
     */
    function getEpochReward(uint256 epoch) external view returns (uint256 amount) {
        return tokensPerEpoch[epoch];
    }

    /**
     * @notice 查询veNFT是否已领取指定epoch的奖励
     * @param tokenId veNFT ID
     * @param epoch 时间周期
     * @return isClaimed 是否已领取
     */
    function isClaimedFor(uint256 tokenId, uint256 epoch) external view returns (bool isClaimed) {
        return claimed[tokenId][epoch];
    }

    /**
     * @notice 获取当前epoch
     * @return currentEpoch 当前时间周期
     */
    function getCurrentEpoch() external view returns (uint256 currentEpoch) {
        return block.timestamp / WEEK;
    }
}
