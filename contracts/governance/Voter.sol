// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IVotingEscrow.sol";
import "./Gauge.sol";
import "./Bribe.sol";

/**
 * @title Voter
 * @notice 投票管理合约 - ve(3,3) 系统的中央协调器
 * @dev 管理投票、激励分发和 Gauge/Bribe 创建
 */
contract Voter is ReentrancyGuard {
    /// @notice ve-NFT 合约
    address public immutable ve;

    /// @notice Factory 合约
    address public immutable factory;

    /// @notice 治理代币
    address public immutable token;

    /// @notice Minter 合约
    address public minter;

    /// @notice 管理员
    address public admin;

    /// @notice 所有 Gauge 列表
    address[] public allGauges;

    /// @notice Pool => Gauge 映射
    mapping(address => address) public gauges;

    /// @notice Gauge => Pool 映射
    mapping(address => address) public poolForGauge;

    /// @notice Gauge => Bribe 映射
    mapping(address => address) public bribes;

    /// @notice Gauge 是否存活
    mapping(address => bool) public isGauge;

    /// @notice Gauge 是否被 kill
    mapping(address => bool) public isKilled;

    /// @notice Pool 投票权重
    mapping(address => uint256) public weights;

    /// @notice NFT 的投票分配: tokenId => pool => 权重
    mapping(uint256 => mapping(address => uint256)) public votes;

    /// @notice NFT 投票的 Pool 列表
    mapping(uint256 => address[]) public poolVote;

    /// @notice NFT 上次投票时间
    mapping(uint256 => uint256) public lastVoted;

    /// @notice 总投票权重
    uint256 public totalWeight;

    /// @notice Gauge 类型白名单
    mapping(address => bool) public isWhitelisted;

    event GaugeCreated(address indexed gauge, address indexed creator, address indexed pool);
    event Voted(address indexed voter, uint256 indexed tokenId, uint256 weight);
    event Abstained(uint256 indexed tokenId, uint256 weight);
    event DistributeReward(address indexed sender, address indexed gauge, uint256 amount);
    event Whitelisted(address indexed whitelister, address indexed token);

    constructor(address _ve, address _factory, address _token) {
        ve = _ve;
        factory = _factory;
        token = _token;
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Voter: not admin");
        _;
    }

    /**
     * @notice 设置 Minter
     */
    function setMinter(address _minter) external onlyAdmin {
        require(minter == address(0), "Voter: minter already set");
        minter = _minter;
    }

    /**
     * @notice 重置投票
     * @param _tokenId NFT ID
     */
    function reset(uint256 _tokenId) public {
        require(IERC721(ve).ownerOf(_tokenId) == msg.sender, "Voter: not owner");
        _reset(_tokenId);
        IVotingEscrow(ve).abstain(_tokenId);
    }

    function _reset(uint256 _tokenId) internal {
        address[] storage _poolVote = poolVote[_tokenId];
        uint256 _poolVoteCnt = _poolVote.length;

        for (uint256 i = 0; i < _poolVoteCnt; i++) {
            address _pool = _poolVote[i];
            uint256 _votes = votes[_tokenId][_pool];

            if (_votes > 0) {
                weights[_pool] -= _votes;
                votes[_tokenId][_pool] = 0;
                IBribe(bribes[gauges[_pool]])._withdraw(_votes, msg.sender);
            }
        }

        delete poolVote[_tokenId];
    }

    /**
     * @notice 投票
     * @param _tokenId NFT ID
     * @param _poolVote Pool 地址列表
     * @param _weights 权重列表
     */
    function vote(
        uint256 _tokenId,
        address[] calldata _poolVote,
        uint256[] calldata _weights
    ) external nonReentrant {
        require(IERC721(ve).ownerOf(_tokenId) == msg.sender, "Voter: not owner");
        require(_poolVote.length == _weights.length, "Voter: length mismatch");
        require(_poolVote.length > 0, "Voter: no pools");
        require(_poolVote.length <= 10, "Voter: too many pools");

        // 检查投票冷却时间 (1 周)
        require(block.timestamp >= lastVoted[_tokenId] + 1 weeks, "Voter: already voted this week");

        uint256 _weight = IVotingEscrow(ve).balanceOfNFT(_tokenId);
        require(_weight > 0, "Voter: no voting power");

        // 重置之前的投票
        _reset(_tokenId);

        uint256 _totalVoteWeight = 0;
        uint256 _usedWeight = 0;

        for (uint256 i = 0; i < _poolVote.length; i++) {
            _totalVoteWeight += _weights[i];
        }

        require(_totalVoteWeight > 0, "Voter: zero total weight");

        for (uint256 i = 0; i < _poolVote.length; i++) {
            address _pool = _poolVote[i];
            address _gauge = gauges[_pool];

            require(_gauge != address(0), "Voter: gauge not exist");
            require(!isKilled[_gauge], "Voter: gauge killed");

            uint256 _poolWeight = (_weights[i] * _weight) / _totalVoteWeight;

            if (_poolWeight > 0) {
                poolVote[_tokenId].push(_pool);
                weights[_pool] += _poolWeight;
                votes[_tokenId][_pool] = _poolWeight;
                IBribe(bribes[_gauge])._deposit(_poolWeight, msg.sender);
                _usedWeight += _poolWeight;
            }
        }

        totalWeight += _usedWeight;
        lastVoted[_tokenId] = block.timestamp;

        IVotingEscrow(ve).voting(_tokenId);
        emit Voted(msg.sender, _tokenId, _usedWeight);
    }

    /**
     * @notice 白名单代币
     */
    function whitelist(address _token) external onlyAdmin {
        require(!isWhitelisted[_token], "Voter: already whitelisted");
        isWhitelisted[_token] = true;
        emit Whitelisted(msg.sender, _token);
    }

    /**
     * @notice 创建 Gauge
     * @param _pool Pool 地址
     */
    function createGauge(address _pool) external returns (address) {
        require(gauges[_pool] == address(0), "Voter: gauge exists");
        require(IFactory(factory).isPair(_pool), "Voter: not a pair");

        // 创建 Gauge
        address _gauge = address(new Gauge(_pool, ve, address(this)));

        // 创建 Bribe
        address _bribe = address(new Bribe(ve, address(this)));

        gauges[_pool] = _gauge;
        poolForGauge[_gauge] = _pool;
        bribes[_gauge] = _bribe;
        isGauge[_gauge] = true;
        allGauges.push(_gauge);

        emit GaugeCreated(_gauge, msg.sender, _pool);

        return _gauge;
    }

    /**
     * @notice Kill Gauge (停止激励)
     */
    function killGauge(address _gauge) external onlyAdmin {
        require(isGauge[_gauge], "Voter: not gauge");
        require(!isKilled[_gauge], "Voter: already killed");
        isKilled[_gauge] = true;
    }

    /**
     * @notice 复活 Gauge
     */
    function reviveGauge(address _gauge) external onlyAdmin {
        require(isGauge[_gauge], "Voter: not gauge");
        require(isKilled[_gauge], "Voter: not killed");
        isKilled[_gauge] = false;
    }

    /**
     * @notice 分发激励 (由 Minter 调用)
     */
    function distribute(address _gauge) external {
        require(msg.sender == minter, "Voter: not minter");
        require(isGauge[_gauge], "Voter: not gauge");
        require(!isKilled[_gauge], "Voter: gauge killed");

        uint256 _balance = IERC20(token).balanceOf(address(this));
        if (_balance > 0 && totalWeight > 0) {
            address _pool = poolForGauge[_gauge];
            uint256 _share = (_balance * weights[_pool]) / totalWeight;

            if (_share > 0) {
                IERC20(token).approve(_gauge, _share);
                IGauge(_gauge).notifyRewardAmount(token, _share);
                emit DistributeReward(msg.sender, _gauge, _share);
            }
        }
    }

    /**
     * @notice 批量分发
     */
    function distributeAll() external {
        require(msg.sender == minter, "Voter: not minter");

        for (uint256 i = 0; i < allGauges.length; i++) {
            address _gauge = allGauges[i];
            if (!isKilled[_gauge]) {
                this.distribute(_gauge);
            }
        }
    }

    /**
     * @notice 获取所有 Gauge 数量
     */
    function gaugesLength() external view returns (uint256) {
        return allGauges.length;
    }

    /**
     * @notice 设置管理员
     */
    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Voter: zero address");
        admin = _admin;
    }
}

// 接口定义
interface IFactory {
    function isPair(address pair) external view returns (bool);
}

interface IGauge {
    function notifyRewardAmount(address token, uint256 amount) external;
}

interface IBribe {
    function _deposit(uint256 amount, address account) external;
    function _withdraw(uint256 amount, address account) external;
}
