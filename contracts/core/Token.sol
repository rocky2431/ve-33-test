// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Token
 * @notice 治理代币合约 - ve(3,3) DEX 的核心治理代币
 * @dev 基于 ERC20 标准,带有铸造权限控制
 */
contract Token is ERC20, Ownable {
    /// @notice 铸币者地址
    address public minter;

    /// @notice 铸币者变更事件
    event MinterChanged(address indexed oldMinter, address indexed newMinter);

    /**
     * @notice 构造函数
     * @param _name 代币名称
     * @param _symbol 代币符号
     */
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {}

    /**
     * @notice 设置铸币者
     * @param _minter 新的铸币者地址
     */
    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Token: zero address");
        address oldMinter = minter;
        minter = _minter;
        emit MinterChanged(oldMinter, _minter);
    }

    /**
     * @notice 铸造代币
     * @param account 接收地址
     * @param amount 铸造数量
     */
    function mint(address account, uint256 amount) external {
        require(msg.sender == minter, "Token: not minter");
        _mint(account, amount);
    }
}
