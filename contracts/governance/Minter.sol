// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IVotingEscrow.sol";

/**
 * @title Minter
 * @notice 代币铸造合约 - 管理每周代币增发和分发
 * @dev 实现反稀释机制,为锁仓者提供代币补偿
 */
contract Minter is Ownable {
    /// @notice 治理代币
    address public immutable token;

    /// @notice ve-NFT 合约
    address public immutable ve;

    /// @notice Voter 合约
    address public voter;

    /// @notice RewardsDistributor 合约 (ve持有者奖励分配)
    address public rewardsDistributor;

    /// @notice 初始供应量
    uint256 public constant INITIAL_SUPPLY = 20_000_000 * 1e18;

    /// @notice 每周增发量
    uint256 public weekly = (INITIAL_SUPPLY * 2) / 100; // 初始 2%

    /// @notice 增发衰减率 (每周减少 1%)
    uint256 public constant EMISSION_DECAY = 99;

    /// @notice 衰减基数
    uint256 public constant EMISSION_BASE = 100;

    /// @notice 激活时间
    uint256 public activePeriod;

    /// @notice 每周的秒数
    uint256 public constant WEEK = 1 weeks;

    /// @notice ve 持有者的分配比例 (30%)
    uint256 public constant VE_DISTRIBUTION = 30;

    /// @notice 尾部排放比例 (2% 的流通供应)
    uint256 public constant TAIL_EMISSION_RATE = 200; // 2%
    uint256 public constant TAIL_EMISSION_BASE = 10000;

    event Mint(address indexed sender, uint256 weekly, uint256 circulatingSupply, uint256 forVe, uint256 forGauges);

    constructor(address _token, address _ve) Ownable(msg.sender) {
        token = _token;
        ve = _ve;
    }

    /**
     * @notice 设置 Voter 合约
     */
    function setVoter(address _voter) external {
        require(voter == address(0), "Minter: voter already set");
        require(_voter != address(0), "Minter: zero address");
        voter = _voter;
    }

    /**
     * @notice 设置 RewardsDistributor 合约
     * @dev 只能设置一次，只有owner可以调用
     */
    function setRewardsDistributor(address _rewardsDistributor) external onlyOwner {
        require(rewardsDistributor == address(0), "Minter: already set");
        require(_rewardsDistributor != address(0), "Minter: zero address");
        rewardsDistributor = _rewardsDistributor;
    }

    /**
     * @notice 开始铸造
     * @dev 只有owner可以调用
     */
    function start() external onlyOwner {
        require(activePeriod == 0, "Minter: already started");
        activePeriod = block.timestamp / WEEK * WEEK;
    }

    /**
     * @notice 计算流通供应量
     * @dev 防止下溢
     */
    function circulatingSupply() public view returns (uint256) {
        uint256 _totalSupply = IERC20(token).totalSupply();
        uint256 _lockedSupply = IVotingEscrow(ve).supply();
        return _totalSupply > _lockedSupply ? _totalSupply - _lockedSupply : 0;
    }

    /**
     * @notice 计算可铸造数量
     * @dev P0-036: 添加尾部排放机制,确保长期可持续性
     */
    function calculateEmission() public view returns (uint256) {
        uint256 _circulating = circulatingSupply();
        uint256 _baseEmission = weekly;

        // 计算尾部排放 = 流通供应 × 2%
        uint256 _tailEmission = (_circulating * TAIL_EMISSION_RATE) / TAIL_EMISSION_BASE;

        // 返回较大值,确保排放永远不会低于2%
        return _baseEmission > _tailEmission ? _baseEmission : _tailEmission;
    }

    /**
     * @notice 更新 period (内部函数)
     */
    function _updatePeriod() internal returns (uint256) {
        require(activePeriod > 0, "Minter: not started");
        uint256 _period = activePeriod;
        uint256 _currentPeriod = block.timestamp / WEEK * WEEK;

        if (_period < _currentPeriod) {
            activePeriod = _currentPeriod;

            uint256 _weekly = weekly;
            uint256 _circulatingSupply = circulatingSupply();

            // 计算本周增发量
            uint256 _emission = calculateEmission();

            // 衰减
            weekly = (_weekly * EMISSION_DECAY) / EMISSION_BASE;

            // 注意: 这里只是更新 period,不进行分配,所以 forVe 和 forGauges 都是 0
            emit Mint(msg.sender, _emission, _circulatingSupply, 0, 0);

            return _emission;
        }

        return 0;
    }

    /**
     * @notice 更新 period (每周调用一次)
     */
    function updatePeriod() external returns (uint256) {
        return _updatePeriod();
    }

    /**
     * @notice 铸造并分发代币
     * @dev P0-035: 修复30/70双重分配逻辑
     */
    function update_period() external returns (uint256) {
        uint256 _emission = _updatePeriod();

        if (_emission > 0) {
            // 计算30/70分配
            uint256 _forVe = (_emission * VE_DISTRIBUTION) / 100;
            uint256 _forGauges = _emission - _forVe;

            // 铸造代币
            IToken(token).mint(address(this), _emission);

            // ✅ 分配给ve持有者 (通过 RewardsDistributor)
            if (rewardsDistributor != address(0) && _forVe > 0) {
                IERC20(token).approve(rewardsDistributor, _forVe);
                IRewardsDistributor(rewardsDistributor).notifyRewardAmount(_forVe);
            }

            // ✅ 分配给LP提供者 (通过 Voter)
            if (voter != address(0) && _forGauges > 0) {
                IERC20(token).transfer(voter, _forGauges);
                IVoter(voter).distributeAll();
            }

            emit Mint(msg.sender, _emission, circulatingSupply(), _forVe, _forGauges);
        }

        return _emission;
    }
}

interface IToken {
    function mint(address to, uint256 amount) external;
}

interface IVoter {
    function distributeAll() external;
}

interface IRewardsDistributor {
    function notifyRewardAmount(uint256 amount) external;
}
