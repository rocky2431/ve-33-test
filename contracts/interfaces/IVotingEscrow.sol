// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVotingEscrow {
    struct Point {
        int128 bias;
        int128 slope;
        uint256 ts;
        uint256 blk;
    }

    struct LockedBalance {
        int128 amount;
        uint256 end;
    }

    event Deposit(
        address indexed provider,
        uint256 indexed tokenId,
        uint256 value,
        uint256 indexed locktime,
        uint256 depositType,
        uint256 ts
    );
    event Withdraw(address indexed provider, uint256 indexed tokenId, uint256 value, uint256 ts);
    event Supply(uint256 prevSupply, uint256 supply);

    function token() external view returns (address);
    function supply() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function balanceOfNFT(uint256 tokenId) external view returns (uint256);
    function locked(uint256 tokenId) external view returns (int128 amount, uint256 end);
    function userPointEpoch(uint256 tokenId) external view returns (uint256);

    function create_lock(uint256 value, uint256 lockDuration) external returns (uint256);
    function increase_amount(uint256 tokenId, uint256 value) external;
    function increase_unlock_time(uint256 tokenId, uint256 lockDuration) external;
    function withdraw(uint256 tokenId) external;
    function merge(uint256 from, uint256 to) external;
    function split(uint256 tokenId, uint256 amount) external returns (uint256);

    function voting(uint256 tokenId) external;
    function abstain(uint256 tokenId) external;
    function voted(uint256 tokenId) external view returns (bool);
}
