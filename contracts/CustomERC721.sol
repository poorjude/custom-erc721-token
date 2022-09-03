// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "./interfaces/IERC721Metadata.sol";
import "./interfaces/IERC165.sol";
import "./interfaces/IERC721Receiver.sol";
import "./openzeppelin/Ownable.sol";
import "./openzeppelin/Strings.sol";

/**
 * @title Custom ERC721 non-fungible token.
 * 
 * @dev This token implements all standard ERC721 functions
 * (including ERC165) and ones from ERC721Metadata extension.
 * It also has burning and minting (separately for users and
 * for creators) methods.
 * 
 * For transferring, burning and minting of tokens users pay
 * different (pre-set during deployment of the contract) fees 
 * to creators of the token. However, some of them or even all of
 * them may be set as zero.
 * 
 * Mint mechanism: mint is divided into two parts - for creators
 * and for users. The first one starts immediately after the contract
 * creation: creators can mint a pre-set amount of tokens for free. The
 * second one starts when creators manually call a special function.
 * If creators have not minted all of their tokens, they lose this
 * possibility after starting the mint: users will take what remains 
 * paying fees to creators.
 * 
 * Also, it is possible to see how many tokens are not minted,
 * how many were burnt, and the current supply by calling special 
 * functions. Creators can withdraw all fees (Eth) from the contract 
 * using the owner account.
 */
contract MyERC721 is IERC721Metadata, IERC165, Ownable {
    using Strings for uint256;

    // Token ID => owner of token
    mapping(uint256 => address) _owners;

    // Owner of tokens => an amount of his/her tokens 
    mapping(address => uint256) _balances;

    // Token ID => whom approved for
    mapping(uint256 => address) _approvals;

    // Owner of tokens => who can operate all of his/her tokens => true/false
    mapping(address => mapping(address => bool)) _approvalsForAll;

    /**
     * @dev See {IERC721Metadata-name}.
     */
    string public name;

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    string public symbol;

    string baseUri;

    /**
     * @notice Returns the total supply of the token.
     */
    uint256 public totalSupply;

    /**
     * @notice Returns the amount of tokens which are going to
     * be assigned to creators.
     */
    uint256 public tokensForCreators;

    uint256 mintedTokensCounter;

    /**
     * @notice Returns fee (in wei) paid to the creators during 
     * reselling of the tokens.
     */
    uint256 public transferFee;
    
    /**
     * @notice Returns price of mint in wei.
     */
    uint256 public mintPrice;

    /**
     * @notice Returns price of burn in wei.
     */
    uint256 public burnPrice;

    /**
     * @notice Returns true if mint for creators of the token
     * has ended or false if not.
     */
    bool public mintForCreatorsEnded;

    /**
     * @notice Returns true if mint for normal users has started
     * or false if not.
     */
    bool public mintForUsersStarted;

    /**
     * @notice Returns true if mint for normal users has already
     * ended or false if not.
     */
    bool public mintForUsersEnded;

    /**
     * @dev Sets all token properties during deployment of the contract.
     * 
     * @param name_ sets the name of the token.
     * @param symbol_ sets the symbol of the token.
     * @param baseUri_ sets the base token URI (leave it as an empty string
     * if you do not plan to provide the token URI at all).
     * @param totalSupply_ sets the total supply of the token.
     * @param tokensForCreators_ sets the max amount of tokens that will 
     * be possible to mint for creators.
     * @param mintPrice_ sets mint price for users (in wei).
     * @param transferFee_ sets fee for transfer of a token (in wei).
     * @param burnPrice_ sets price of burning a token (in wei).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseUri_,
        uint256 totalSupply_,
        uint256 tokensForCreators_,
        uint256 mintPrice_,
        uint256 transferFee_,
        uint256 burnPrice_
        ) {
        require(totalSupply_ >= tokensForCreators_, 
        "MyERC721: Amount of tokens assigned to creators exceeds total supply of tokens!");

        // Setting token properties
        name = name_;
        symbol = symbol_;
        baseUri = baseUri_;
        totalSupply = totalSupply_;
        tokensForCreators = tokensForCreators_;
        mintPrice = mintPrice_;
        transferFee = transferFee_;
        burnPrice = burnPrice_;
    }

    /**
     * @dev Reverts transaction if the token does not exist.
     * NOTE: Tokens which are not minted yet are considered as non-existent ones.
     */
    modifier TokenMustExist(uint256 tokenId) {
        require(_owners[tokenId] != address(0), 
        "MyERC721: Token with such ID does not exist!");
        _;
    }

    /**
     * @dev Reverts transaction if caller cannot transfer the token.
     */
    modifier CanTransfer(uint256 tokenId) {
        require(_isOwnerOrOperator(tokenId) || _isApproved(tokenId),
        "MyErc721: You are not an owner, an operator nor an approved one!");
        _;
    }

    /**
     * @dev Reverts transaction if caller cannot approve the token.
     */
    modifier CanApprove(uint256 tokenId) {
        require(_isOwnerOrOperator(tokenId), 
        "MyERC721: You are not an owner nor an operator!");
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) external view virtual returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) external view 
    TokenMustExist(tokenId) returns (string memory) {
        return 
            bytes(baseUri).length == 0 
            ? "" 
            : string.concat(baseUri, tokenId.toString());
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "MyERC721: Incorrect address!");
        return _balances[owner];
    }

    /**
     * @notice Returns an amount of not minted tokens.
     */
    function howManyNotMinted() external view returns (uint256) {
        return totalSupply - mintedTokensCounter;
    }

    /**
     * @notice Returns an amount of burnt tokens.
     */
    function howManyBurnt() external view returns (uint256) {
        return _balances[address(0)];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) external view
        TokenMustExist(tokenId) returns (address) {
        return _owners[tokenId];
    }

    /**
     * @dev See {IERC721-approve}.
     * 
     * Emits `Approval`.
     */
    function approve(address approved, uint256 tokenId)
        TokenMustExist(tokenId) CanApprove(tokenId) external payable {
        _approvals[tokenId] = approved;
        emit Approval(_owners[tokenId], approved, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) external view
        TokenMustExist(tokenId) returns (address) {
        return _approvals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     * 
     * Emits `ApprovalForAll`.
     */
    function setApprovalForAll(address operator, bool approved) external {
        _approvalsForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _approvalsForAll[owner][operator];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from, 
        address to, 
        uint256 tokenId
        ) public payable 
        TokenMustExist(tokenId)
        CanTransfer(tokenId) {
        require(msg.value >= transferFee,
        "MyERC721: You did not send enough Ether to transfer a token!");
        require(from == _owners[tokenId], 
        "MyERC721: `from` address is not an owner of `tokenId` token!");
        require(to != address(0), 
        "MyERC721: Incorrect `to` address!");

        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from, 
        address to, 
        uint256 tokenId, 
        bytes memory data
        ) public payable {
        transferFrom(from, to, tokenId);

        if (to.code.length > 0) {
            bytes4 result = 
            IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data);

            require(result == IERC721Receiver.onERC721Received.selector,
            "MyERC721: `to` address is not an ERC721 receiver!");
        }
    }
    
    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from, 
        address to, 
        uint256 tokenId
        ) external payable {
        safeTransferFrom(from, to, tokenId, bytes(""));
    }

    /**
     * @notice Mints the new token.
     * Requirements: (1) mint for users must have started and not ended,
     * (2) caller must send Ether equal to or higher than {mintPrice},
     * (3) address `to` must not be the zero address.
     * @param to is the address where the minted token goes, cannot be
     * the zero address.
     */
    function mintForUsers(address to) external payable {
        require(mintForUsersStarted, 
        "MyERC721: Mint for users has not started yet!");
        require(!mintForUsersEnded, 
        "MyERC721: Mint for users has already ended!");
        require(msg.value >= mintPrice, 
        "MyERC721: You did not send enough Ether to mint!");
        require(to != address(0), 
        "MyERC721: Incorrect `to` address!");

        _mint(to);
    }

    /**
     * @notice Burns the token.
     * Requirements: the token must exist and caller must be an owner,
     * an operator or an approved one.
     * @param from is an address of the current token owner.
     * @param tokenId is the token ID.
     */
    function burn(address from, uint256 tokenId) 
        external payable TokenMustExist(tokenId) CanTransfer(tokenId) {
        require(msg.value >= burnPrice,
        "MyERC721: You did not send enough Ether to burn a token!");
        require(from == _owners[tokenId],
        "MyERC721: `from` address is not an owner of `tokenId` token!");

        _transfer(from, address(0), tokenId);
        totalSupply -= 1;
    }

    /**
     * @notice Withdraws all ether from the contract.
     * Requirements: caller must be the owner of the contract.
     * @param to is the address of an Ether receiver.
     */
    function withdrawAll(address to) external onlyOwner {
        payable(to).transfer(address(this).balance);
    }

    /**
     * @notice Mints the new token. If amount of minted tokens reachs amount of
     * tokens for creators, then mint for creators ends.
     * Requirements: caller must be the owner of the contract, mint for creators
     * must not have ended.
     * @param to is the address of a token receiver.
     */
    function mintForCreators(address to) public virtual onlyOwner {
        require(!mintForCreatorsEnded, 
        "MyERC721: Mint for creators has already ended!");

        _mint(to);

        if (mintedTokensCounter >= tokensForCreators) {
            mintForCreatorsEnded = true;
        }
    }

    /**
     * @notice Starts mint for normal users. 
     * NOTE: If mint for creators has not ended yet, then it automatically ends
     * after calling this function, so with the start of mint for users 
     * creators cannot using {mintForCreators} anymore.
     * 
     * Requirements: caller must be the owner of the contract.
     */
    function startMintForUsers() public virtual onlyOwner {
        if (mintForCreatorsEnded == false) {
            mintForCreatorsEnded = true;
        }
        mintForUsersStarted = true;
    }

    /**
     * @dev Transfers the token from one address to another.
     * Deletes an approved address for the token.
     * 
     * Emits `Transfer` event.
     */
    function _transfer(address from, address to, uint256 tokenId) internal {
        _balances[from] -= 1;
        _balances[to] += 1;
        if (_approvals[tokenId] != address(0)) {
            _approvals[tokenId] = address(0);
        }
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Mints the new token.
     * If the last token is minted then mint ends (`mintForUsersEnded` == true).
     * 
     * Emits `Transfer` event.
     */
    function _mint(address to) internal {
        uint256 tokenId = mintedTokensCounter;

        mintedTokensCounter += 1;
        if (mintedTokensCounter >= totalSupply) {
            mintForUsersEnded = true;
        }
        _balances[to] += 1;

        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Returns true if caller can transfer and approve tokens and false if not.
     */
    function _isOwnerOrOperator(uint256 tokenId)
        internal view returns(bool) {
        address owner = _owners[tokenId];
        return msg.sender == owner || _approvalsForAll[owner][msg.sender];
    }
    
    /**
     * @dev Returns true if caller is an approved one for the token.
     */
    function _isApproved(uint256 tokenId) internal view returns(bool) {
        return msg.sender == _approvals[tokenId];
    }
}