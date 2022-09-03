// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../interfaces/IERC721Receiver.sol";

contract ERC721Receiver is IERC721Receiver {
    address public operator;
    address public from;
    uint256 public tokenId;
    bytes public data;

    function onERC721Received(
        address operator_,
        address from_,
        uint256 tokenId_,
        bytes calldata data_
    ) external returns (bytes4) {
        operator = operator_;
        from = from_;
        tokenId = tokenId_;
        data = data_;

        return IERC721Receiver.onERC721Received.selector;
    }
}

contract NotERC721Receiver {
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return bytes4(bytes("wrong function signature"));
    }
}

contract EmptyContract {
    function doNothing() external {}
}