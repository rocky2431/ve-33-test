// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IRouter.sol";
import "../interfaces/IFactory.sol";
import "../interfaces/IPair.sol";
import "../libraries/Math.sol";

/**
 * @title Router
 * @notice 路由合约 - 提供便捷的交易和流动性操作接口
 * @dev 包装底层 Pair 合约,提供安全的用户交互接口
 */
contract Router is IRouter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice 工厂合约地址
    address public immutable factory;

    /// @notice WETH 地址
    address public immutable weth;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        _;
    }

    constructor(address _factory, address _weth) {
        factory = _factory;
        weth = _weth;
    }

    /**
     * @notice 排序代币地址
     */
    function sortTokens(address tokenA, address tokenB) public pure returns (address token0, address token1) {
        require(tokenA != tokenB, "Router: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Router: ZERO_ADDRESS");
    }

    /**
     * @notice 获取交易对地址
     */
    function pairFor(address tokenA, address tokenB, bool stable) public view returns (address pair) {
        pair = IFactory(factory).getPair(tokenA, tokenB, stable);
    }

    /**
     * @notice 计算添加流动性的数量
     */
    function _addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        require(amountADesired >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
        require(amountBDesired >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");

        address pair = pairFor(tokenA, tokenB, stable);
        if (pair == address(0) || IERC20(pair).totalSupply() == 0) {
            return (amountADesired, amountBDesired);
        }

        (uint256 reserve0, uint256 reserve1,) = IPair(pair).getReserves();
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint256 reserveA, uint256 reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    /**
     * @notice 添加流动性
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, stable, amountADesired, amountBDesired, amountAMin, amountBMin);

        address pair = pairFor(tokenA, tokenB, stable);
        if (pair == address(0)) {
            pair = IFactory(factory).createPair(tokenA, tokenB, stable);
        }

        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);

        liquidity = IPair(pair).mint(to);
    }

    /**
     * @notice 移除流动性
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) nonReentrant returns (uint256 amountA, uint256 amountB) {
        address pair = pairFor(tokenA, tokenB, stable);
        require(pair != address(0), "Router: PAIR_NOT_EXISTS");

        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = IPair(pair).burn(to);

        (address token0,) = sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        require(amountA >= amountAMin, "Router: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "Router: INSUFFICIENT_B_AMOUNT");
    }

    /**
     * @notice 精确输入代币交换
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, routes);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: INSUFFICIENT_OUTPUT_AMOUNT");

        IERC20(routes[0].from).safeTransferFrom(
            msg.sender,
            pairFor(routes[0].from, routes[0].to, routes[0].stable),
            amounts[0]
        );

        _swap(amounts, routes, to);
    }

    /**
     * @notice 内部交换逻辑
     */
    function _swap(uint256[] memory amounts, Route[] memory routes, address _to) internal {
        for (uint256 i = 0; i < routes.length; i++) {
            (address token0,) = sortTokens(routes[i].from, routes[i].to);
            uint256 amountOut = amounts[i + 1];

            (uint256 amount0Out, uint256 amount1Out) = routes[i].from == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));

            address to = i < routes.length - 1
                ? pairFor(routes[i + 1].from, routes[i + 1].to, routes[i + 1].stable)
                : _to;

            IPair(pairFor(routes[i].from, routes[i].to, routes[i].stable)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    /**
     * @notice 获取输出数量
     */
    function getAmountsOut(uint256 amountIn, Route[] memory routes) public view returns (uint256[] memory amounts) {
        amounts = new uint256[](routes.length + 1);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < routes.length; i++) {
            address pair = pairFor(routes[i].from, routes[i].to, routes[i].stable);
            require(pair != address(0), "Router: PAIR_NOT_EXISTS");

            amounts[i + 1] = IPair(pair).getAmountOut(amounts[i], routes[i].from);
        }
    }

    /**
     * @notice 计算添加流动性的预期结果
     */
    function quoteAddLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired
    ) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pair = pairFor(tokenA, tokenB, stable);

        (uint256 reserveA, uint256 reserveB) = (0, 0);
        uint256 _totalSupply = 0;

        if (pair != address(0)) {
            _totalSupply = IERC20(pair).totalSupply();
            (uint256 reserve0, uint256 reserve1,) = IPair(pair).getReserves();
            (address token0,) = sortTokens(tokenA, tokenB);
            (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        }

        if (_totalSupply == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
            liquidity = Math.sqrt(amountA * amountB) - 1000;
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                amountA = (amountBDesired * reserveA) / reserveB;
                amountB = amountBDesired;
            }
            liquidity = Math.min((amountA * _totalSupply) / reserveA, (amountB * _totalSupply) / reserveB);
        }
    }
}
