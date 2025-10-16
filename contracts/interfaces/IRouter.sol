// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRouter {
    struct Route {
        address from;
        address to;
        bool stable;
    }

    function factory() external view returns (address);
    function weth() external view returns (address);
    function sortTokens(address tokenA, address tokenB) external pure returns (address token0, address token1);

    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        Route[] calldata routes,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, Route[] memory routes) external view returns (uint[] memory amounts);
    function quoteAddLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint amountADesired,
        uint amountBDesired
    ) external view returns (uint amountA, uint amountB, uint liquidity);
}
