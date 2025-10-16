// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRewardsDistributor
 * @notice RewardsDistributor合约接口
 */
interface IRewardsDistributor {
    /// @notice 添加奖励
    function notifyRewardAmount(uint256 amount) external;

    /// @notice 领取rebase奖励
    function claimRebase(uint256 tokenId) external returns (uint256 reward);

    /// @notice 批量领取
    function claimMany(uint256[] calldata tokenIds) external returns (uint256 totalReward);

    /// @notice 查询待领取奖励
    function claimable(uint256 tokenId) external view returns (uint256 reward);

    /// @notice 获取epoch奖励
    function getEpochReward(uint256 epoch) external view returns (uint256 amount);

    /// @notice 获取当前epoch
    function getCurrentEpoch() external view returns (uint256 currentEpoch);
}
