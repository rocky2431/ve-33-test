// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPair {
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint reserve0, uint reserve1);
    event Fees(address indexed sender, uint amount0, uint amount1);

    function metadata() external view returns (
        uint dec0,
        uint dec1,
        uint r0,
        uint r1,
        bool st,
        address t0,
        address t1
    );

    function claimFees() external returns (uint claimed0, uint claimed1);
    function tokens() external view returns (address, address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function stable() external view returns (bool);

    function permit(
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function burn(address to) external returns (uint amount0, uint amount1);
    function mint(address to) external returns (uint liquidity);
    function getReserves() external view returns (uint _reserve0, uint _reserve1, uint _blockTimestampLast);
    function getAmountOut(uint amountIn, address tokenIn) external view returns (uint);
    function current(address tokenIn, uint amountIn) external view returns (uint amountOut);
    function quote(address tokenIn, uint amountIn, uint granularity) external view returns (uint amountOut);
}
