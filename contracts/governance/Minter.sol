// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IVotingEscrow.sol";

/**
 * @title Minter
 * @notice 代币铸造合约 - 管理每周代币增发和分发
 * @dev 实现反稀释机制,为锁仓者提供代币补偿
 */
contract Minter {
    /// @notice 治理代币
    address public immutable token;

    /// @notice ve-NFT 合约
    address public immutable ve;

    /// @notice Voter 合约
    address public voter;

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

    event Mint(address indexed sender, uint256 weekly, uint256 circulatingSupply);

    constructor(address _token, address _ve) {
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
     * @notice 开始铸造
     */
    function start() external {
        require(msg.sender == token, "Minter: not token");
        require(activePeriod == 0, "Minter: already started");
        activePeriod = block.timestamp / WEEK * WEEK;
    }

    /**
     * @notice 计算流通供应量
     */
    function circulatingSupply() public view returns (uint256) {
        return IERC20(token).totalSupply() - IVotingEscrow(ve).supply();
    }

    /**
     * @notice 计算可铸造数量
     */
    function calculateEmission() public view returns (uint256) {
        return weekly;
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

            emit Mint(msg.sender, _emission, _circulatingSupply);

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
     */
    function update_period() external returns (uint256) {
        uint256 _emission = _updatePeriod();

        if (_emission > 0 && voter != address(0)) {
            // 30% 给 ve 持有者 (通过 Voter 分发)
            uint256 _forVe = (_emission * VE_DISTRIBUTION) / 100;

            // 70% 给流动性提供者 (通过 Gauge 分发)
            uint256 _forGauges = _emission - _forVe;

            // 铸造代币
            IToken(token).mint(address(this), _emission);

            // 批准并转给 Voter
            IERC20(token).approve(voter, _emission);

            // Voter 会自动分发给各个 Gauge
            IVoter(voter).distributeAll();
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
