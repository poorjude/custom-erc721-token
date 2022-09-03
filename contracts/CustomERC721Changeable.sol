// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./CustomERC721.sol";

/**
 * @title Custom ERC721 non-fungible token (changeable version).
 * 
 * @dev This contract inherits `MyERC721` and extends it giving
 * a posiibility to change major token properties for creators 
 * (for the owner). During construction of the contract all except
 * name and symbol of the token are left blank so creators need to
 * set it calling special functions before the mint starts.
 * 
 * It adds the important restriction: now mint for creators
 * is started manually too (as with mint for users) and creators
 * can set and change token properties only till it starts.
 */
contract MyERC721Changeable is MyERC721 {
    /**
     * @notice Returns true if mint for creators of the token
     * has started or false if not. If it returns `true`,
     * no changing of the token properties is allowed anymore.
     */
    bool public mintForCreatorsStarted;

    /**
     * @dev Sets name and symbol of the token leaving other
     * properties blank.
     * 
     * For explanation of parameters see {MyERC721-constructor}.
     */
    constructor(string memory name, string memory symbol) 
    MyERC721(name, symbol, "", 0, 0, 0, 0, 0) {}

    /**
     * @dev Reverts the transaction if mint for creators has started.
     */
    modifier BeforeMintForCreators {
        require(!mintForCreatorsStarted, 
        "MyERC721Changeable: Creators cannot change token settings anymore!");
        _;
    }

    /**
     * @notice Starts mint for creators. Therefore, creators lose
     * possibility to change token settings anymore.
     * 
     * Requirements: caller must be the owner.
     */
    function startMintForCreators() external onlyOwner {
        mintForCreatorsStarted = true;
    }

    /**
     * @dev Overrides the same function: now if mint for creators
     * has not started manually by calling other function, they
     * cannot mint.
     * @notice Requirements: mint for creators must have started.
     */
    function mintForCreators(address to) public override {
        require(mintForCreatorsStarted, 
        "MyERC721Changeable: Mint for creators has not started yet!");
        super.mintForCreators(to);
    }

    /**
     * @dev Overrides the same function: now if mint for creators
     * has not started manually by calling other function, calling
     * this one will automatically start it (and instantly end) to
     * prohibit changing token settings by creators.
     * 
     * @notice If mint for creators has not started yet, then it 
     * automatically ends after calling of this function.
     */
    function startMintForUsers() public override {
        if (mintForCreatorsStarted == false) {
            mintForCreatorsStarted = true;
        }
        super.startMintForUsers();
    }

    /**
     * @notice Sets the new base URI of the token.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setBaseURI(string calldata baseUri_) external onlyOwner BeforeMintForCreators {
        baseUri = baseUri_;
    }

    /**
     * @notice Sets the new total supply of the token.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setTotalSupply(uint256 totalSupply_) external onlyOwner BeforeMintForCreators {
        totalSupply = totalSupply_;
    }

    /**
     * @notice Sets the new amount of tokens assigned to creators.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setTokensForCreators(uint256 tokensForCreators_) external onlyOwner BeforeMintForCreators {
        tokensForCreators = tokensForCreators_;
    }

    /**
     * @notice Sets the new mint price.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setMintPrice(uint256 mintPrice_) external onlyOwner BeforeMintForCreators {
        mintPrice = mintPrice_;
    }

    /**
     * @notice Sets the new transfer fee of the token.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setTransferFee(uint256 transferFee_) external onlyOwner BeforeMintForCreators {
        transferFee = transferFee_;
    }

    /**
     * @notice Sets the new burn price.
     * Requirements: the caller must be the owner, mint for creators
     * must not have started.
     */
    function setBurnPrice(uint256 burnPrice_) external onlyOwner BeforeMintForCreators {
        burnPrice = burnPrice_;
    }
}