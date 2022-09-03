// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../interfaces/AggregatorInterfaceV3.sol";

contract Oracle is AggregatorV3Interface {
    int256 ethPrice;

    // `newPrice` should be already multiplied to needed decimals
    function setEthPrice(int256 newPrice) external {
        ethPrice = newPrice;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function latestRoundData()
        external
        view
        returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
        ) { 
        return (0, ethPrice, 0, 0, 0);
    }

    function description() external view returns (string memory) {}
    function version() external view returns (uint256) {}
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
        ) 
    {}
}