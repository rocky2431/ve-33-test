// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleToken
 * @notice 简单的 ERC20 代币合约 - 固定供应量
 * @dev 用于测试和流动性池的代币
 */
contract SimpleToken is ERC20 {
    /**
     * @notice 构造函数
     * @param _name 代币名称
     * @param _symbol 代币符号
     * @param _totalSupply 总供应量（带精度）
     * @param _recipient 接收地址
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _recipient
    ) ERC20(_name, _symbol) {
        require(_recipient != address(0), "SimpleToken: zero address");
        _mint(_recipient, _totalSupply);
    }
}
