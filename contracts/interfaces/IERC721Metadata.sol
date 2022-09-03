// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./IERC721.sol";

/**
 * @title Interface of an ERC721 non-fungible token with metadata extension.
 * See https://eips.ethereum.org/EIPS/eip-721 for details.
 */
interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}