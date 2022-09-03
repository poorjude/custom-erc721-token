// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./CustomERC721.sol";
import "./interfaces/IERC20Optional.sol";
import "./interfaces/AggregatorInterfaceV3.sol";

/**
 * @title Custom ERC721 non-fungible token (version with mint in
 * dollar stablecoins).
 * 
 * @dev This contract inherits `MyERC721` and extends it giving to
 * users a posiibility to pay for mint in dollar stablecoins. The
 * price is equivalent to current ETH/USD price on the market.
 * 
 * The owner choose a stablecoin in which minting will be paid.
 * It is also possible to not allow mint by not setting the stablecoin
 * at all. After mint for users started, it is not possible to set
 * or change the stablecoin anymore.
 * NOTE: stablecoins will be assigned to the owner, so ensure that its
 * account (if it is contract) can transfer ERC20 tokens.
 * 
 * The mint price is calcuted during the transaction using data from
 * the oracle (Chainlink). The owner choose the oracle address.
 * After mint for users started, it is not possible to set
 * or change the oracle anymore.
 * NOTE: This contract can interact with Chainlink oracles only.
 */
contract MyERC721DollarsOraclized is MyERC721 {
    uint256 constant WEI_IN_ETHER_DECIMALS = 18;

    // Stablecoin properties
    IERC20Optional private _stablecoin;
    uint256 private _stablecoinDecimals;
    
    // Oracle properties
    AggregatorV3Interface private _oracle;
    uint256 private _oracleDecimals;

    /**
     * @dev See {MyERC721-constructor}.
     * NOTE: mint price is still set in Ether (actually, in wei!),
     * not in dollars.
     */
    constructor(string memory name_, string memory symbol_,
        string memory baseUri_, uint256 totalSupply_,
        uint256 tokensForCreators_, uint256 mintPrice_,
        uint256 transferFee_, uint256 burnPrice_)
        MyERC721(name_, symbol_, baseUri_, totalSupply_,
        tokensForCreators_, mintPrice_, transferFee_, burnPrice_)
    {}

    /**
     * @dev Reverts the transaction if the stablecoin address is
     * not set.
     */
    modifier MintInDollarsAllowed {
        require(address(_stablecoin) != address(0),
        "MyERC721DollarsOraclized: Mint with dollars has not been allowed!");
        _;
    }

    /**
     * @notice Returns the address of the stablecoin chosen for mint
     * in dollars.
     * Requirements: mint in dollars must be allowed.
     */
    function stablecoin() external view MintInDollarsAllowed returns (address) {
        return address(_stablecoin);
    }

    /**
     * @notice Returns the address of the oracle chosen for mint
     * in dollars.
     * Requirements: mint in dollars must be allowed.
     */
    function oracle() external view MintInDollarsAllowed returns (address) {
        return address(_oracle);
    }

    /**
     * @notice Returns the current mint price in dollars.
     * Requirements: mint in dollars must be allowed.
     */
    function mintPrice_inDollars() external view MintInDollarsAllowed returns (uint256) {
        return _neededApprovedAmount() / (10**_stablecoinDecimals) + 1;
    }

    /**
     * @notice Mints the new token paying to creators with dollar 
     * stablecoins in the amount equivalent to current ETH/USD price.
     * You should approve enough tokens to pay for the mint.
     * 
     * Requirements: (1) mint for users must have started and not ended,
     * (2) address `to` must not be the zero address, (3) mint with dollars
     * must be allowed: the stablecoin address must be set by creators,
     * (4) the caller should approve enough tokens for the contract.
     * @param to is the receiver of the new token, cannot be the zero
     * address.
     */
    function mintForUsers_inDollars(address to) external virtual MintInDollarsAllowed {
        // Requirements for "usual" mint
        require(mintForUsersStarted, "MyERC721: Mint for users has not started yet!");
        require(!mintForUsersEnded, "MyERC721: Mint for users has already ended!");
        require(to != address(0), "MyERC721: Incorrect `to` address!");

        uint256 neededAmount = _neededApprovedAmount();
        uint256 approvedAmount = _stablecoin.allowance(msg.sender, address(this));
        // Checking that the user approved enough tokens
        require(approvedAmount >= neededAmount,
        "MyERC721DollarsOraclized: You did not approve enough tokens to mint!");

        // Minting
        _mint(to);
        // Transferring stablecoins to the owner of the contract
        _stablecoin.transferFrom(msg.sender, owner(), neededAmount);
    }

    /**
     * @notice Sets the dollar stablecoin for mint in dollars.
     * Requirements: the caller must be the owner of the contract,
     * mint for users must not have started.
     * 
     * NOTE: You should ensure that the chosen token is safe and
     * that time has proved its stability and security. Otherwise,
     * all users and the contract may be damaged and/or creators may 
     * lose money.
     * @param stablecoin_ is the address of the chosen token.
     * If it equals to the zero address, then mint in dollars will not
     * be allowed for users.
     */
    function setStablecoin(address stablecoin_) external onlyOwner {
        require(!mintForUsersStarted, 
        "MyERC721DollarsOraclized: Cannot change the stablecoin when mint started!");

        _stablecoin = IERC20Optional(stablecoin_);

        // {decimals} is optional ERC20 method so we should not expect
        // that the token surely implements it
        try _stablecoin.decimals() returns (uint8 decimals_) {
            _stablecoinDecimals = decimals_;
        } catch(bytes memory) {
            if (_stablecoinDecimals != 0) { _stablecoinDecimals = 0; }
        }
    }

    /**
     * @notice Sets the address of Chainlink ETH/USD price aggregator.
     * Requirements: the caller must be the owner of the contract,
     * mint for users must not have started.
     * 
     * NOTE: In this implementation it is only possible to interact with the
     * Chainlink oracles. Do not set any other ones.
     * NOTE2: You should ensure that the chosen oracle is safe and
     * that time has proved its stability and security. Otherwise,
     * the contract may be damaged and/or creators may lose money.
     * @param oracle_ is the address of the chosen Chainlink oracle.
     */
    function setOracle(address oracle_) external onlyOwner {
        require(!mintForUsersStarted, 
        "MyERC721DollarsOraclized: Cannot change the oracle when mint started!");

        _oracle = AggregatorV3Interface(oracle_);
        _oracleDecimals = _oracle.decimals();
    }

    /**
     * @dev Returns the current ETH/USD price from the oracle
     * in its raw form (with the oracle's decimals).
     */
    function _getRawEthPrice() internal view returns (uint256) {
        ( , int256 price, , , ) = _oracle.latestRoundData();
        return uint256(price);
    }

    /**
     * @dev Returns the amount of approved tokens needed for mint
     * (therefore, with the stablecoin's decimals).
     */
    function _neededApprovedAmount() internal view returns (uint256) {
        uint256 rawEthPrice = _getRawEthPrice();
        uint256 power = WEI_IN_ETHER_DECIMALS + _oracleDecimals - _stablecoinDecimals;
        return mintPrice * rawEthPrice / (10**power);
    }
}