// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "../interfaces/IERC20Optional.sol";

contract Stablecoin is IERC20Optional {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    function setNewBalance(address owner, uint256 amount) external {
        _balances[owner] = amount;
    }

    function decimals() external pure returns (uint8) {
        return 6;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Not enough tokens!");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 approvedAmount = _allowances[from][msg.sender];
        require(approvedAmount >= amount, "Not enough approved tokens!");
        require(_balances[from] >= amount, "Not enough tokens on `from` balance!");

        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function totalSupply() external view returns (uint256) {}
    function name() external view returns (string memory) {}
    function symbol() external view returns (string memory) {}
}