// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

/**
 * @title Interface of an ERC721 non-fungible token receiver 
 * (if the receiver is a smart contract).
 * See https://eips.ethereum.org/EIPS/eip-721 for details.
 */
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns(bytes4);
}