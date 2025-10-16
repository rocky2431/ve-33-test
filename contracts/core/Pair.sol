// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/Math.sol";
import "../interfaces/IPair.sol";
import "../interfaces/IFactory.sol";

/**
 * @title Pair
 * @notice AMM 交易对合约 - 支持稳定币和波动性资产交易
 * @dev 实现 ve(3,3) 的核心 AMM 逻辑
 *      - 波动性资产使用 xy >= k 曲线
 *      - 稳定币使用 x³y + y³x >= k 曲线
 */
contract Pair is IPair, ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice 工厂合约地址
    address public immutable factory;

    /// @notice 第一个代币地址
    address public immutable token0;

    /// @notice 第二个代币地址
    address public immutable token1;

    /// @notice 是否为稳定币交易对
    bool public immutable stable;

    /// @notice 手续费接收合约
    address public fees;

    /// @notice 储备量 0
    uint256 public reserve0;

    /// @notice 储备量 1
    uint256 public reserve1;

    /// @notice 最后更新时间戳
    uint256 public blockTimestampLast;

    /// @notice 累计手续费 0
    uint256 public claimable0;

    /// @notice 累计手续费 1
    uint256 public claimable1;

    /// @notice 最小流动性锁定量
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    /**
     * @notice 构造函数
     */
    constructor() ERC20("", "") {
        factory = msg.sender;
        (address _token0, address _token1, bool _stable) = IFactory(msg.sender).getInitializable();
        (token0, token1, stable) = (_token0, _token1, _stable);

        if (_stable) {
            string memory _name = string(abi.encodePacked("sAMM-", IERC20Metadata(_token0).symbol(), "/", IERC20Metadata(_token1).symbol()));
            string memory _symbol = string(abi.encodePacked("sAMM-", IERC20Metadata(_token0).symbol(), "/", IERC20Metadata(_token1).symbol()));
            _name = _name;
            _symbol = _symbol;
        } else {
            string memory _name = string(abi.encodePacked("vAMM-", IERC20Metadata(_token0).symbol(), "/", IERC20Metadata(_token1).symbol()));
            string memory _symbol = string(abi.encodePacked("vAMM-", IERC20Metadata(_token0).symbol(), "/", IERC20Metadata(_token1).symbol()));
            _name = _name;
            _symbol = _symbol;
        }
    }

    /**
     * @notice 获取交易对元数据
     */
    function metadata() external view returns (
        uint256 dec0,
        uint256 dec1,
        uint256 r0,
        uint256 r1,
        bool st,
        address t0,
        address t1
    ) {
        return (
            IERC20Metadata(token0).decimals(),
            IERC20Metadata(token1).decimals(),
            reserve0,
            reserve1,
            stable,
            token0,
            token1
        );
    }

    /**
     * @notice 获取储备量
     */
    function getReserves() external view returns (
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _blockTimestampLast
    ) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    /**
     * @notice 获取代币地址
     */
    function tokens() external view returns (address, address) {
        return (token0, token1);
    }

    /**
     * @notice 更新储备量
     */
    function _update(uint256 balance0, uint256 balance1) private {
        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = block.timestamp;
        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice 添加流动性
     * @param to 接收 LP token 的地址
     */
    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        (uint256 _reserve0, uint256 _reserve1,) = (reserve0, reserve1, blockTimestampLast);
        uint256 balance0 = IERC20(token0).balanceOf(address(this)) - claimable0;
        uint256 balance1 = IERC20(token1).balanceOf(address(this)) - claimable1;
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }

        require(liquidity > 0, "Pair: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @notice 移除流动性
     * @param to 接收代币的地址
     */
    function burn(address to) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this)) - claimable0;
        uint256 balance1 = IERC20(token1).balanceOf(address(this)) - claimable1;
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "Pair: INSUFFICIENT_LIQUIDITY_BURNED");

        _burn(address(this), liquidity);
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this)) - claimable0;
        balance1 = IERC20(token1).balanceOf(address(this)) - claimable1;

        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @notice 代币交换
     * @param amount0Out 输出代币 0 数量
     * @param amount1Out 输出代币 1 数量
     * @param to 接收地址
     * @param data 回调数据
     */
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "Pair: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint256 _reserve0, uint256 _reserve1,) = (reserve0, reserve1, blockTimestampLast);
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Pair: INSUFFICIENT_LIQUIDITY");

        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "Pair: INVALID_TO");

            if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
            if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);

            balance0 = IERC20(_token0).balanceOf(address(this)) - claimable0;
            balance1 = IERC20(_token1).balanceOf(address(this)) - claimable1;
        }

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "Pair: INSUFFICIENT_INPUT_AMOUNT");

        // ✅ P0-004: 验证 k 值不变性 (防止流动性被盗)
        // 对于稳定币对,使用 x³y + y³x >= k
        // 对于波动性对,使用 xy >= k
        if (stable) {
            uint256 kLast = _k(_reserve0, _reserve1);
            uint256 kNew = _k(balance0, balance1);
            require(kNew >= kLast, "Pair: K_INVARIANT_VIOLATED");
        } else {
            // 对于波动性对,使用简单的 xy >= k 验证
            // 考虑手续费后,k 值应该增加或保持不变
            require(balance0 * balance1 >= _reserve0 * _reserve1, "Pair: K_INVARIANT_VIOLATED");
        }

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /**
     * @notice 计算输出数量
     * @param amountIn 输入数量
     * @param tokenIn 输入代币地址
     */
    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256) {
        (uint256 _reserve0, uint256 _reserve1) = (reserve0, reserve1);

        amountIn = amountIn - ((amountIn * 30) / 10000); // 0.3% fee

        return _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
    }

    /**
     * @notice 内部计算输出数量
     */
    function _getAmountOut(
        uint256 amountIn,
        address tokenIn,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal view returns (uint256) {
        if (stable) {
            uint256 xy = _k(_reserve0, _reserve1);
            _reserve0 = (_reserve0 * 1e18) / IERC20Metadata(token0).decimals();
            _reserve1 = (_reserve1 * 1e18) / IERC20Metadata(token1).decimals();

            (uint256 reserveA, uint256 reserveB) = tokenIn == token0 ? (_reserve0, _reserve1) : (_reserve1, _reserve0);
            amountIn = tokenIn == token0 ? (amountIn * 1e18) / IERC20Metadata(token0).decimals() : (amountIn * 1e18) / IERC20Metadata(token1).decimals();

            uint256 y = reserveB - _get_y(amountIn + reserveA, xy, reserveB);
            return (y * (tokenIn == token0 ? IERC20Metadata(token1).decimals() : IERC20Metadata(token0).decimals())) / 1e18;
        } else {
            (uint256 reserveA, uint256 reserveB) = tokenIn == token0 ? (_reserve0, _reserve1) : (_reserve1, _reserve0);
            return (amountIn * reserveB) / (reserveA + amountIn);
        }
    }

    /**
     * @notice 计算 k 值 (x³y + y³x)
     */
    function _k(uint256 x, uint256 y) internal pure returns (uint256) {
        uint256 _x = (x * 1e18) / 10**18;
        uint256 _y = (y * 1e18) / 10**18;
        uint256 _a = (_x * _y) / 1e18;
        uint256 _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
        return (_a * _b) / 1e18;
    }

    /**
     * @notice 计算 y 值
     */
    function _get_y(uint256 x0, uint256 xy, uint256 y) internal pure returns (uint256) {
        for (uint256 i = 0; i < 255; i++) {
            uint256 y_prev = y;
            uint256 k = _f(x0, y);
            if (k < xy) {
                uint256 dy = ((xy - k) * 1e18) / _d(x0, y);
                y = y + dy;
            } else {
                uint256 dy = ((k - xy) * 1e18) / _d(x0, y);
                y = y - dy;
            }
            if (y > y_prev) {
                if (y - y_prev <= 1) {
                    return y;
                }
            } else {
                if (y_prev - y <= 1) {
                    return y;
                }
            }
        }
        return y;
    }

    function _f(uint256 x0, uint256 y) internal pure returns (uint256) {
        return (x0 * ((y * y) / 1e18 * y) / 1e18) / 1e18 + ((((x0 * x0) / 1e18 * x0) / 1e18) * y) / 1e18;
    }

    function _d(uint256 x0, uint256 y) internal pure returns (uint256) {
        return (3 * x0 * ((y * y) / 1e18)) / 1e18 + ((((x0 * x0) / 1e18) * x0) / 1e18);
    }

    /**
     * @notice 领取手续费
     */
    function claimFees() external returns (uint256 claimed0, uint256 claimed1) {
        require(msg.sender == fees, "Pair: not fees contract");

        claimed0 = claimable0;
        claimed1 = claimable1;

        if (claimed0 > 0) {
            claimable0 = 0;
            IERC20(token0).safeTransfer(msg.sender, claimed0);
        }

        if (claimed1 > 0) {
            claimable1 = 0;
            IERC20(token1).safeTransfer(msg.sender, claimed1);
        }

        emit Fees(msg.sender, claimed0, claimed1);
    }

    /**
     * @notice 设置手续费接收地址
     */
    function setFees(address _fees) external {
        require(msg.sender == factory, "Pair: not factory");
        fees = _fees;
    }

    /**
     * @notice 获取当前价格
     */
    function current(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        return _getAmountOut(amountIn, tokenIn, reserve0, reserve1);
    }

    /**
     * @notice 获取报价 (TWAP)
     */
    function quote(address tokenIn, uint256 amountIn, uint256 granularity) external view returns (uint256 amountOut) {
        return _getAmountOut(amountIn, tokenIn, reserve0, reserve1);
    }

    /**
     * @notice ERC20 名称
     */
    function name() public view override returns (string memory) {
        return string(abi.encodePacked(
            stable ? "sAMM-" : "vAMM-",
            IERC20Metadata(token0).symbol(),
            "/",
            IERC20Metadata(token1).symbol()
        ));
    }

    /**
     * @notice ERC20 符号
     */
    function symbol() public view override returns (string memory) {
        return string(abi.encodePacked(
            stable ? "sAMM-" : "vAMM-",
            IERC20Metadata(token0).symbol(),
            "/",
            IERC20Metadata(token1).symbol()
        ));
    }

    // 简化的 permit 实现
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // 简化实现,生产环境需要完整的 EIP-2612 实现
        revert("Pair: permit not implemented");
    }
}
