// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFactory {
    event PairCreated(address indexed token0, address indexed token1, bool stable, address pair, uint);

    function isPair(address pair) external view returns (bool);
    function allPairsLength() external view returns (uint);
    function getPair(address tokenA, address tokenB, bool stable) external view returns (address);
    function createPair(address tokenA, address tokenB, bool stable) external returns (address pair);
    function pairCodeHash() external pure returns (bytes32);
    function getInitializable() external view returns (address, address, bool);
}
