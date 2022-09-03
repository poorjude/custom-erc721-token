## My ERC721 non-fungible token

The `contracts` folder contains three main files:

1. The base contract, ERC721 token: `CustomERC721.sol`.
2. The changeable extension of it: `CustomERC721Changeable.sol`.
3. The extension with mint in dollar stablecoins and connection to Chainlink oracles: `CustomERC721DollarsOraclized.sol`.

*All of the contracts are provided with wide NatSpec code documentation.*

You could also find full-coverage unit-tests in the `test` folder.

### Explanation of the base contract

`CustomERC721.sol` implements all standard ERC721 functions (transferFrom, safeTransferFrom, balanceOf, etc.), including the ERC165 interface detection, and ones from ERC721Metadata extension (name, symbol, tokenURI). It also has custom burning and minting (separately for users and for creators) methods.

For transferring, burning and minting of tokens users pay different fees to creators of the token. Fees are set during a deployment of the contract and cannot be changed later. Anyway, some of them or even all of them may be set as zero.

Mint mechanism: mint is divided into two parts - for creators and for users. The first one starts immediately after the contract creation: creators can mint a pre-set amount of tokens for free. The second one starts when creators manually call a special function. If creators have not minted all of their tokens, they lose this possibility after starting the mint: users will take what remains paying fees to creators.

Also, it is possible to see how many tokens are not minted, how many were burnt, and the current supply by calling special functions. Creators can withdraw all fees (Eth) from the contract using the owner (deployer of the contract) account.

### Explanation of the 'Changeable' extension

`CustomERC721Changeable.sol` inherits the base contract and extends it giving a posiibility for creators to change major token properties. During a construction of the contract all token attributes (except name and symbol) are left blank so creators need to set it later by calling special functions.

It adds the important restriction: now mint for creators is started manually too (as it was with mint for users) and creators can set and change token properties only till the moment it will be started. Creators can call these functions-setters from the owner (the contract deployer) account.

### Explanation of the 'DollarsOraclized' extension 

`CustomERC721Changeable.sol` inherits the base contract and extends it giving to users the new mean of payment for mint: in dollar stablecoins. Needed amount of them are calculated in the next way: mint price in Ether set by creators is multiplied by a current market Ether price. Current ETH/USD price is taken from the Chainlink oracle.

Creators choose in which dollar stablecoin users will pay for the mint and an oracle from which an Eth price will be aggregated. When the mint for users is started, it will not be possible to set them anymore. And take a note: in my implementation the contract is able to interact with only Chainlink oracles.

Additionally, users may see chosen stablecoin and oracle addresses by calling special functions. They can also get current mint price in dollars from the contract and understand how many stablecoins they need to approve.

### Testing the contracts with Hardhat

Files in the `test` folder contain full-coverage unit tests written in JS for all of these contracts.

To run them, you need to have pre-installed Node.js with NPM and do the next things:

- download all files from this page to a separate folder,
- create new terminal and open the folder with downloaded files in it,
- type in `npm install --save-dev hardhat` and wait till the end of installation,
- type in `npm install --save-dev @nomicfoundation/hardhat-toolbox` and wait till the end of installation,
- type in `npx hardhat test` - this will compile all of the contracts and then will run tests.
