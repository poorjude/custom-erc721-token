// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./IERC20.sol";

/**
 * @title The interface with optional methods from the ERC20
 * token standard.
 * See https://eips.ethereum.org/EIPS/eip-20 for details.
 */
interface IERC20Optional is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}