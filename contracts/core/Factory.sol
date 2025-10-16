// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFactory.sol";
import "./Pair.sol";

/**
 * @title Factory
 * @notice 交易对工厂合约 - 负责创建和管理所有交易对
 * @dev 实现无需许可的交易对创建
 */
contract Factory is IFactory {
    /// @notice 是否已暂停
    bool public isPaused;

    /// @notice 管理员地址
    address public admin;

    /// @notice 待初始化的交易对参数
    address private _temp_token0;
    address private _temp_token1;
    bool private _temp_stable;

    /// @notice 所有交易对列表
    address[] public allPairs;

    /// @notice 交易对映射: tokenA => tokenB => stable => pair
    mapping(address => mapping(address => mapping(bool => address))) public getPair;

    /// @notice 是否为有效交易对
    mapping(address => bool) public isPair;

    constructor() {
        admin = msg.sender;
        isPaused = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Factory: not admin");
        _;
    }

    /**
     * @notice 获取所有交易对数量
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /**
     * @notice 创建交易对
     * @param tokenA 代币 A 地址
     * @param tokenB 代币 B 地址
     * @param stable 是否为稳定币交易对
     */
    function createPair(
        address tokenA,
        address tokenB,
        bool stable
    ) external returns (address pair) {
        require(!isPaused, "Factory: paused");
        require(tokenA != tokenB, "Factory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Factory: ZERO_ADDRESS");
        require(getPair[token0][token1][stable] == address(0), "Factory: PAIR_EXISTS");

        // 设置初始化参数
        _temp_token0 = token0;
        _temp_token1 = token1;
        _temp_stable = stable;

        // 创建交易对
        pair = address(new Pair{salt: keccak256(abi.encodePacked(token0, token1, stable))}());

        // 清除临时变量
        delete _temp_token0;
        delete _temp_token1;
        delete _temp_stable;

        // 注册交易对
        getPair[token0][token1][stable] = pair;
        getPair[token1][token0][stable] = pair;
        allPairs.push(pair);
        isPair[pair] = true;

        emit PairCreated(token0, token1, stable, pair, allPairs.length);
    }

    /**
     * @notice 获取初始化参数 (仅供 Pair 合约调用)
     */
    function getInitializable() external view returns (address, address, bool) {
        return (_temp_token0, _temp_token1, _temp_stable);
    }

    /**
     * @notice 获取交易对代码哈希
     */
    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(Pair).creationCode);
    }

    /**
     * @notice 设置暂停状态
     */
    function setPause(bool _state) external onlyAdmin {
        isPaused = _state;
    }

    /**
     * @notice 设置管理员
     */
    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Factory: zero address");
        admin = _admin;
    }
}
