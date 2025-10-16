// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IVotingEscrow.sol";

/**
 * @title VotingEscrow
 * @notice ve-NFT 投票托管合约 - ve(3,3) 机制的核心
 * @dev 用户锁定代币获得 NFT 形式的投票权,锁定时间越长权重越大
 */
contract VotingEscrow is IVotingEscrow, ERC721Enumerable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice 锁定的代币地址
    address public immutable token;

    /// @notice 总供应量
    uint256 public supply;

    /// @notice 锁定信息映射
    mapping(uint256 => LockedBalance) public locked;

    /// @notice 用户点数历史 (用于投票权重计算)
    mapping(uint256 => Point[]) public userPointHistory;

    /// @notice 用户点数历史长度
    mapping(uint256 => uint256) public userPointEpoch;

    /// @notice 全局点数历史
    Point[] public pointHistory;

    /// @notice 全局 epoch
    uint256 public epoch;

    /// @notice 斜率变化记录 (用于优化计算)
    mapping(uint256 => int128) public slopeChanges;

    /// @notice 投票状态
    mapping(uint256 => bool) public voted;

    /// @notice Voter 合约地址
    address public voter;

    /// @notice 最小锁定时间 (1 周)
    uint256 public constant MIN_LOCK_DURATION = 1 weeks;

    /// @notice 最大锁定时间 (4 年)
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days;

    /// @notice 每周的秒数
    uint256 public constant WEEK = 1 weeks;

    /// @notice tokenId 计数器
    uint256 private _tokenIdCounter;

    /// @notice 存款类型枚举
    enum DepositType {
        DEPOSIT_FOR_TYPE,
        CREATE_LOCK_TYPE,
        INCREASE_LOCK_AMOUNT,
        INCREASE_UNLOCK_TIME
    }

    constructor(address _token) ERC721("Vote-Escrowed Token", "veToken") {
        require(_token != address(0), "VotingEscrow: zero address");
        token = _token;
        pointHistory.push(Point({bias: 0, slope: 0, ts: block.timestamp, blk: block.number}));
    }

    /**
     * @notice 设置 Voter 合约地址
     */
    function setVoter(address _voter) external {
        require(voter == address(0), "VotingEscrow: voter already set");
        require(_voter != address(0), "VotingEscrow: zero address");
        voter = _voter;
    }

    /**
     * @notice 检查是否为所有者或已授权
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /**
     * @notice 获取当前时间向下取整到周
     */
    function _floorToWeek(uint256 _t) internal pure returns (uint256) {
        return (_t / WEEK) * WEEK;
    }

    /**
     * @notice 创建锁仓
     * @param _value 锁定数量
     * @param _lockDuration 锁定时长(秒)
     */
    function create_lock(uint256 _value, uint256 _lockDuration)
        external
        nonReentrant
        returns (uint256)
    {
        require(_value > 0, "VotingEscrow: zero value");
        require(_lockDuration >= MIN_LOCK_DURATION, "VotingEscrow: lock duration too short");
        require(_lockDuration <= MAX_LOCK_DURATION, "VotingEscrow: lock duration too long");

        uint256 unlockTime = _floorToWeek(block.timestamp + _lockDuration);
        require(unlockTime > block.timestamp, "VotingEscrow: invalid unlock time");

        uint256 tokenId = ++_tokenIdCounter;
        _mint(msg.sender, tokenId);

        _deposit_for(tokenId, _value, unlockTime, locked[tokenId], DepositType.CREATE_LOCK_TYPE);

        return tokenId;
    }

    /**
     * @notice 增加锁定数量
     * @param _tokenId NFT ID
     * @param _value 增加的数量
     */
    function increase_amount(uint256 _tokenId, uint256 _value) external nonReentrant {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "VotingEscrow: not owner");
        require(_value > 0, "VotingEscrow: zero value");

        LockedBalance memory _locked = locked[_tokenId];
        require(_locked.amount > 0, "VotingEscrow: no lock found");
        require(_locked.end > block.timestamp, "VotingEscrow: lock expired");

        _deposit_for(_tokenId, _value, 0, _locked, DepositType.INCREASE_LOCK_AMOUNT);
    }

    /**
     * @notice 延长锁定时间
     * @param _tokenId NFT ID
     * @param _lockDuration 延长的时长
     */
    function increase_unlock_time(uint256 _tokenId, uint256 _lockDuration) external nonReentrant {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "VotingEscrow: not owner");

        LockedBalance memory _locked = locked[_tokenId];
        require(_locked.amount > 0, "VotingEscrow: no lock found");

        uint256 unlockTime = _floorToWeek(block.timestamp + _lockDuration);
        require(unlockTime > _locked.end, "VotingEscrow: new unlock time must be greater");
        require(unlockTime <= block.timestamp + MAX_LOCK_DURATION, "VotingEscrow: lock duration too long");

        _deposit_for(_tokenId, 0, unlockTime, _locked, DepositType.INCREASE_UNLOCK_TIME);
    }

    /**
     * @notice 提取解锁的代币
     * @param _tokenId NFT ID
     */
    function withdraw(uint256 _tokenId) external nonReentrant {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "VotingEscrow: not owner");
        require(!voted[_tokenId], "VotingEscrow: already voted");

        LockedBalance memory _locked = locked[_tokenId];
        require(_locked.amount > 0, "VotingEscrow: no lock found");
        require(block.timestamp >= _locked.end, "VotingEscrow: lock not expired");

        uint256 value = uint256(int256(_locked.amount));

        locked[_tokenId] = LockedBalance(0, 0);
        supply -= value;

        // 销毁 NFT
        _burn(_tokenId);

        IERC20(token).safeTransfer(msg.sender, value);

        emit Withdraw(msg.sender, _tokenId, value, block.timestamp);
        emit Supply(supply + value, supply);
    }

    /**
     * @notice 内部存款函数
     */
    function _deposit_for(
        uint256 _tokenId,
        uint256 _value,
        uint256 unlockTime,
        LockedBalance memory _locked,
        DepositType depositType
    ) internal {
        uint256 supplyBefore = supply;
        supply += _value;

        // 显式复制每个字段以避免引用问题
        LockedBalance memory oldLocked;
        oldLocked.amount = _locked.amount;
        oldLocked.end = _locked.end;

        _locked.amount += int128(int256(_value));

        if (unlockTime != 0) {
            _locked.end = unlockTime;
        }

        locked[_tokenId] = _locked;

        // 记录检查点
        _checkpoint(_tokenId, oldLocked, _locked);

        if (_value > 0) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), _value);
        }

        emit Deposit(msg.sender, _tokenId, _value, _locked.end, uint256(depositType), block.timestamp);
        emit Supply(supplyBefore, supply);
    }

    /**
     * @notice 记录检查点 (更新投票权重)
     */
    function _checkpoint(
        uint256 _tokenId,
        LockedBalance memory oldLocked,
        LockedBalance memory newLocked
    ) internal {
        Point memory uOld;
        Point memory uNew;
        int128 oldDslope = 0;
        int128 newDslope = 0;
        uint256 _epoch = epoch;

        if (_tokenId != 0) {
            // 计算旧的斜率和偏差
            if (oldLocked.end > block.timestamp && oldLocked.amount > 0) {
                uOld.slope = oldLocked.amount / int128(int256(MAX_LOCK_DURATION));
                uOld.bias = uOld.slope * int128(int256(oldLocked.end - block.timestamp));
            }

            // 计算新的斜率和偏差
            if (newLocked.end > block.timestamp && newLocked.amount > 0) {
                uNew.slope = newLocked.amount / int128(int256(MAX_LOCK_DURATION));
                uNew.bias = uNew.slope * int128(int256(newLocked.end - block.timestamp));
            }

            // 更新斜率变化
            oldDslope = slopeChanges[oldLocked.end];
            if (newLocked.end != 0) {
                if (newLocked.end == oldLocked.end) {
                    newDslope = oldDslope;
                } else {
                    newDslope = slopeChanges[newLocked.end];
                }
            }
        }

        // 获取上一个点
        // epoch表示已完成的checkpoint次数
        // pointHistory[epoch]恰好是上一次checkpoint的结果（或初始点）
        Point memory lastPoint = pointHistory[_epoch];

        // 计算新的slope和bias
        int128 newSlope = lastPoint.slope + (uNew.slope - uOld.slope);
        int128 newBias = lastPoint.bias + (uNew.bias - uOld.bias);

        if (newSlope < 0) {
            newSlope = 0;
        }
        if (newBias < 0) {
            newBias = 0;
        }

        // 创建新的Point并记录到pointHistory
        epoch = _epoch + 1;
        pointHistory.push(Point({
            bias: newBias,
            slope: newSlope,
            ts: block.timestamp,
            blk: block.number
        }));

        // 更新斜率变化
        if (oldLocked.end > block.timestamp) {
            oldDslope += uOld.slope;
            if (newLocked.end == oldLocked.end) {
                oldDslope -= uNew.slope;
            }
            slopeChanges[oldLocked.end] = oldDslope;
        }

        if (newLocked.end > block.timestamp && newLocked.end > oldLocked.end) {
            newDslope -= uNew.slope;
            slopeChanges[newLocked.end] = newDslope;
        }

        // 记录用户点历史
        if (_tokenId != 0) {
            userPointEpoch[_tokenId] += 1;
            uNew.ts = block.timestamp;
            uNew.blk = block.number;
            userPointHistory[_tokenId].push(uNew);
        }
    }

    /**
     * @notice 获取 NFT 的投票权重(余额)
     * @param _tokenId NFT ID
     */
    function balanceOfNFT(uint256 _tokenId) external view returns (uint256) {
        uint256 _epoch = userPointEpoch[_tokenId];
        if (_epoch == 0) {
            return 0;
        }

        Point memory lastPoint = userPointHistory[_tokenId][_epoch - 1];
        lastPoint.bias -= lastPoint.slope * int128(int256(block.timestamp - lastPoint.ts));
        if (lastPoint.bias < 0) {
            lastPoint.bias = 0;
        }

        return uint256(int256(lastPoint.bias));
    }

    /**
     * @notice 获取指定时间的投票权重
     * @param _tokenId NFT ID
     * @param _t 时间戳
     */
    function balanceOfNFTAt(uint256 _tokenId, uint256 _t) external view returns (uint256) {
        uint256 _epoch = userPointEpoch[_tokenId];
        if (_epoch == 0) {
            return 0;
        }

        Point memory lastPoint = userPointHistory[_tokenId][_epoch - 1];
        lastPoint.bias -= lastPoint.slope * int128(int256(_t - lastPoint.ts));
        if (lastPoint.bias < 0) {
            lastPoint.bias = 0;
        }

        return uint256(int256(lastPoint.bias));
    }

    /**
     * @notice 获取总投票权重
     */
    function totalSupply() public view override(ERC721Enumerable, IVotingEscrow) returns (uint256) {
        uint256 _epoch = epoch;
        if (_epoch == 0) {
            return 0;
        }

        Point memory lastPoint = pointHistory[pointHistory.length - 1];
        return _supplyAt(lastPoint, block.timestamp);
    }

    /**
     * @notice 获取指定时间的总投票权重
     */
    function totalSupplyAt(uint256 _t) external view returns (uint256) {
        uint256 _epoch = epoch;
        if (_epoch == 0) {
            return 0;
        }

        Point memory lastPoint = pointHistory[pointHistory.length - 1];
        return _supplyAt(lastPoint, _t);
    }

    /**
     * @notice 内部函数:计算指定时间的总供应量
     */
    function _supplyAt(Point memory point, uint256 t) internal view returns (uint256) {
        Point memory lastPoint = point;
        uint256 ti = _floorToWeek(lastPoint.ts);

        for (uint256 i = 0; i < 255; i++) {
            ti += WEEK;
            int128 dSlope = 0;
            if (ti > t) {
                ti = t;
            } else {
                dSlope = slopeChanges[ti];
            }
            lastPoint.bias -= lastPoint.slope * int128(int256(ti - lastPoint.ts));
            if (ti == t) {
                break;
            }
            lastPoint.slope += dSlope;
            lastPoint.ts = ti;
        }

        if (lastPoint.bias < 0) {
            lastPoint.bias = 0;
        }

        return uint256(int256(lastPoint.bias));
    }

    /**
     * @notice 标记为已投票
     */
    function voting(uint256 _tokenId) external {
        require(msg.sender == voter, "VotingEscrow: not voter");
        voted[_tokenId] = true;
    }

    /**
     * @notice 标记为未投票
     */
    function abstain(uint256 _tokenId) external {
        require(msg.sender == voter, "VotingEscrow: not voter");
        voted[_tokenId] = false;
    }

    /**
     * @notice 合并两个 NFT
     * @param _from 源 NFT
     * @param _to 目标 NFT
     */
    function merge(uint256 _from, uint256 _to) external nonReentrant {
        require(_isApprovedOrOwner(msg.sender, _from), "VotingEscrow: not owner of from");
        require(_isApprovedOrOwner(msg.sender, _to), "VotingEscrow: not owner of to");
        require(!voted[_from], "VotingEscrow: from voted");
        require(!voted[_to], "VotingEscrow: to voted");

        LockedBalance memory _locked0 = locked[_from];
        LockedBalance memory _locked1 = locked[_to];

        require(_locked0.amount > 0, "VotingEscrow: from has no lock");
        require(_locked1.amount > 0, "VotingEscrow: to has no lock");
        require(_locked0.end > block.timestamp, "VotingEscrow: from lock expired");
        require(_locked1.end > block.timestamp, "VotingEscrow: to lock expired");

        uint256 value = uint256(int256(_locked0.amount));
        uint256 end = _locked0.end >= _locked1.end ? _locked0.end : _locked1.end;

        locked[_from] = LockedBalance(0, 0);
        _checkpoint(_from, _locked0, LockedBalance(0, 0));
        _burn(_from);

        _deposit_for(_to, value, end, _locked1, DepositType.INCREASE_LOCK_AMOUNT);
    }

    /**
     * @notice 分割 NFT
     * @param _tokenId 源 NFT
     * @param _amount 分割数量
     */
    function split(uint256 _tokenId, uint256 _amount) external nonReentrant returns (uint256) {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "VotingEscrow: not owner");
        require(!voted[_tokenId], "VotingEscrow: already voted");

        LockedBalance memory _locked = locked[_tokenId];
        require(_locked.amount > int128(int256(_amount)), "VotingEscrow: insufficient amount");
        require(_locked.end > block.timestamp, "VotingEscrow: lock expired");

        // 减少原 NFT 的数量
        locked[_tokenId].amount -= int128(int256(_amount));
        _checkpoint(_tokenId, _locked, locked[_tokenId]);

        // 创建新 NFT
        uint256 newTokenId = ++_tokenIdCounter;
        _mint(msg.sender, newTokenId);
        locked[newTokenId] = LockedBalance(int128(int256(_amount)), _locked.end);
        _checkpoint(newTokenId, LockedBalance(0, 0), locked[newTokenId]);

        return newTokenId;
    }

    /**
     * @notice 覆盖 transferFrom 以防止已投票的 NFT 被转移
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(!voted[tokenId], "VotingEscrow: already voted");
        super.transferFrom(from, to, tokenId);
    }
}
