// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

/**
 * @title Interface of the ERC165 utility standard.
 * See https://eips.ethereum.org/EIPS/eip-165 for details.
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}