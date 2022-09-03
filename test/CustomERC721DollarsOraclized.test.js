const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// We are testing only new features from the `DollarsOraclized` version here.
// See `CustomERC721.test.js` for full tests.
describe("My ERC721 non-fungible token (minting with dollar stablecoins version)", function() {
    async function deployNFTDollarsAllContracts() {
        const [acc1, acc2, acc3, acc4, acc5, acc6] = await ethers.getSigners();

        const name_ = "PoorjudeNFT";
        const symbol_ = "PJNFT";
        const baseUri_= "example.com/nfts/";
        const totalSupply_ = 10;
        const tokensForCreators_ = 3;
        const mintPrice_ = ethers.utils.parseEther("0.5");
        const transferFee_ = ethers.utils.parseEther("0.01");
        const burnPrice_ = ethers.utils.parseEther("1.0");

        const nftFactory = await ethers.getContractFactory("MyERC721DollarsOraclized");
        const nft = await nftFactory.deploy(name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_);
        await nft.deployed();

        const oracleFactory = await ethers.getContractFactory("Oracle");
        const oracle = await oracleFactory.deploy();
        await oracle.deployed();
        const oracleDecimals = await oracle.decimals()

        const stablecoinFactory = await ethers.getContractFactory("Stablecoin");
        const stablecoin = await stablecoinFactory.deploy();
        await stablecoin.deployed();
        const stablecoinDecimals = await stablecoin.decimals()

        const creators = [acc1, acc2, acc3]; // `acc1` is also an owner
        const users = [acc4, acc5, acc6];

        return { 
            nft, oracle, oracleDecimals, stablecoin, stablecoinDecimals, 
            creators, users, name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_ 
        };
    }

    describe("Read functions", function() {
        describe("Getting the stablecoin address", function() {
            it("Should return the right address", async function() {
                const { nft, stablecoin } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setStablecoin(stablecoin.address);
                expect(await nft.stablecoin()).to.equal(stablecoin.address);
            });

            it("Should revert the tx if mint in dollars was not allowed", async function() {
                const { nft } = await loadFixture(deployNFTDollarsAllContracts);

                await expect(nft.stablecoin()).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Mint with dollars has not been allowed!"
                );
            });
        });

        describe("Getting the oracle address", function() {
            it("Should return the right address", async function() {
                const { nft, oracle, stablecoin } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                expect(await nft.oracle()).to.equal(oracle.address);
            });

            it("Should revert the tx if mint in dollars was not allowed", async function() {
                const { nft, oracle } = await loadFixture(deployNFTDollarsAllContracts);

                await expect(nft.oracle()).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Mint with dollars has not been allowed!"
                );

                await nft.setOracle(oracle.address);

                await expect(nft.oracle()).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Mint with dollars has not been allowed!"
                );
            });        
        });

        describe("Getting the current ETH/USD price", function() {
            it("Should return the right price", async function() {
                const { nft, stablecoin, oracle, oracleDecimals, mintPrice_ } 
                = await loadFixture(deployNFTDollarsAllContracts);

                const mintPriceInEth = ethers.utils.formatEther(mintPrice_);
                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);

                let ethPrice = 1532.3456;
                await oracle.setEthPrice(ethPrice * (10**oracleDecimals));

                expect(await nft.mintPrice_inDollars()).to.equal(
                    Math.ceil(ethPrice * mintPriceInEth)
                );

                ethPrice = 1801.000347;
                await oracle.setEthPrice(ethPrice * (10**oracleDecimals));

                expect(await nft.mintPrice_inDollars()).to.equal(
                    Math.ceil(ethPrice * mintPriceInEth)
                );
            });

            it("Should revert the tx if mint in dollars was not allowed", async function() {
                const { nft, oracle } = await loadFixture(deployNFTDollarsAllContracts);

                await expect(nft.mintPrice_inDollars()).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Mint with dollars has not been allowed!"
                );

                await nft.setOracle(oracle.address);

                await expect(nft.mintPrice_inDollars()).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Mint with dollars has not been allowed!"
                );
            });            
        });
    });

    describe("Write functions", function() {
        describe("Setting the stablecoin", function() {
            it("Should set the right address of it", async function() {
                const { nft, stablecoin } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setStablecoin(stablecoin.address);
                expect(await nft.stablecoin()).to.equal(stablecoin.address);
            });

            it("Should set the right decimals if the token has them", async function() {
                const { nft, stablecoin, stablecoinDecimals }
                = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setStablecoin(stablecoin.address);
                const rawDecimals = ethers.utils.hexZeroPad(stablecoinDecimals, 32);

                expect(await ethers.provider.getStorageAt(nft.address, 15))
                .to.equal(rawDecimals);
            });

            it("Should set the right decimals if the token does not have them", async function() {
                const { nft } = await loadFixture(deployNFTDollarsAllContracts);

                const emptyContractFactory = await ethers.getContractFactory("EmptyContract");
                const emptyContract = await emptyContractFactory.deploy();
                await emptyContract.deployed();

                await nft.setStablecoin(emptyContract.address);

                expect(await ethers.provider.getStorageAt(nft.address, 15))
                .to.equal(ethers.constants.HashZero);
            });

            it("Should revert the tx if the caller is not the owner", async function() {
                const { nft, users, stablecoin } = await loadFixture(deployNFTDollarsAllContracts);

                await expect(nft.connect(users[0]).setStablecoin(stablecoin.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should revert the tx if mint for users has started", async function() {
                const { nft, stablecoin } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.startMintForUsers();
                await expect(nft.setStablecoin(stablecoin.address)).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Cannot change the stablecoin when mint started!"
                );
            });
        });

        describe("Setting the oracle", function() {
            it("Should set the right address of it", async function() {
                const { nft, stablecoin, oracle } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                expect(await nft.oracle()).to.equal(oracle.address);
            });

            it("Should set the right decimals", async function() {
                const { nft, oracle, oracleDecimals } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.setOracle(oracle.address);
                const rawDecimals = ethers.utils.hexZeroPad(oracleDecimals, 32);

                expect(await ethers.provider.getStorageAt(nft.address, 17))
                .to.equal(rawDecimals);
            });

            it("Should revert the tx if the caller is not the owner", async function() {
                const { nft, users, oracle } = await loadFixture(deployNFTDollarsAllContracts);

                await expect(nft.connect(users[0]).setOracle(oracle.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should revert the tx if mint for users has started", async function() {
                const { nft, oracle } = await loadFixture(deployNFTDollarsAllContracts);

                await nft.startMintForUsers();
                await expect(nft.setOracle(oracle.address)).to.be.revertedWith(
                    "MyERC721DollarsOraclized: Cannot change the oracle when mint started!"
                );
            });
        });

        describe("Minting for users with stablecoins", function() {
            it("Should mint new tokens", async function() {
                const { nft, oracle, oracleDecimals, stablecoin, stablecoinDecimals,
                users } = await loadFixture(deployNFTDollarsAllContracts);
                
                const stablecoinMultiplier = 10**stablecoinDecimals;
                const oracleMultiplier = 10**oracleDecimals;
                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                await stablecoin.setNewBalance(users[0].address, 10000 * stablecoinMultiplier);
                await stablecoin.setNewBalance(users[1].address, 10000 * stablecoinMultiplier);
                await nft.startMintForUsers();

                // 1
                let userAddress = users[0].address;
                let ethPrice = 1532.653412;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);

                let neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[0]).approve(nft.address, neededAmount);

                await nft.connect(users[0]).mintForUsers_inDollars(userAddress);

                expect(await nft.balanceOf(userAddress)).to.equal(1);
                expect(await nft.ownerOf(0)).to.equal(userAddress);

                // 2
                userAddress = users[1].address;
                ethPrice = 1945.0012078;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);

                neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[1]).approve(nft.address, neededAmount);

                await nft.connect(users[1]).mintForUsers_inDollars(userAddress);

                expect(await nft.balanceOf(userAddress)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(userAddress);
            });

            it("Should transfer stablecoins from the user to the owner", async function() {
                const { nft, oracle, oracleDecimals, stablecoin, stablecoinDecimals,
                users } = await loadFixture(deployNFTDollarsAllContracts);
                
                const stablecoinMultiplier = 10**stablecoinDecimals;
                const oracleMultiplier = 10**oracleDecimals;
                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                await stablecoin.setNewBalance(users[0].address, 10000 * stablecoinMultiplier);
                await stablecoin.setNewBalance(users[1].address, 10000 * stablecoinMultiplier);
                await nft.startMintForUsers();

                // 1
                let userAddress = users[0].address;
                let ethPrice = 1532.653412;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);

                let neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[0]).approve(nft.address, neededAmount);

                await nft.connect(users[0]).mintForUsers_inDollars(userAddress);

                expect(await nft.balanceOf(userAddress)).to.equal(1);
                expect(await nft.ownerOf(0)).to.equal(userAddress);

                // 2
                userAddress = users[1].address;
                ethPrice = 1945.0012078;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);

                neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[1]).approve(nft.address, neededAmount);

                await nft.connect(users[1]).mintForUsers_inDollars(userAddress);

                expect(await nft.balanceOf(userAddress)).to.equal(1);
                expect(await nft.ownerOf(1)).to.equal(userAddress);
            });

            it("Should revert the tx if mint in dollars was not allowed", async function() {
                const { nft, oracle, oracleDecimals, stablecoin, stablecoinDecimals,
                users, creators } = await loadFixture(deployNFTDollarsAllContracts);
                    
                const ownerAddress = creators[0].address;
                const stablecoinMultiplier = 10**stablecoinDecimals;
                const oracleMultiplier = 10**oracleDecimals;
                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                await stablecoin.setNewBalance(users[0].address, 10000 * stablecoinMultiplier);
                await stablecoin.setNewBalance(users[1].address, 10000 * stablecoinMultiplier);
                await nft.startMintForUsers();
    
                // 1
                let userAddress = users[0].address;
                let ethPrice = 1532.653412;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);
    
                let neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[0]).approve(nft.address, neededAmount);
    
                await nft.connect(users[0]).mintForUsers_inDollars(userAddress);

                let ownerBalance = Math.ceil(
                    await stablecoin.balanceOf(ownerAddress) / stablecoinMultiplier
                );

                expect(ownerBalance).to.equal(neededAmount / stablecoinMultiplier);
                
                // transferring all dollars from owner acc to clear its balance
                const rawOwnerBalance = await stablecoin.balanceOf(ownerAddress);
                stablecoin.transfer(creators[1].address, rawOwnerBalance);
    
                // 2
                userAddress = users[1].address;
                ethPrice = 1945.0012078;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);
    
                neededAmount = await nft.mintPrice_inDollars() * stablecoinMultiplier;
                await stablecoin.connect(users[1]).approve(nft.address, neededAmount);
    
                await nft.connect(users[1]).mintForUsers_inDollars(userAddress);
    
                ownerBalance = Math.ceil(
                    await stablecoin.balanceOf(ownerAddress) / stablecoinMultiplier
                );

                expect(ownerBalance).to.equal(neededAmount / stablecoinMultiplier);
            });

            it("Should revert the tx if the user didn't approve enough dollars", async function() {
                const { nft, oracle, oracleDecimals, stablecoin, stablecoinDecimals,
                users, creators } = await loadFixture(deployNFTDollarsAllContracts);

                const stablecoinMultiplier = 10**stablecoinDecimals;
                const oracleMultiplier = 10**oracleDecimals;
                await nft.setStablecoin(stablecoin.address);
                await nft.setOracle(oracle.address);
                await stablecoin.setNewBalance(users[0].address, 10000 * stablecoinMultiplier);
                await stablecoin.setNewBalance(users[1].address, 10000 * stablecoinMultiplier);
                await nft.startMintForUsers();
        
                // 1
                let userAddress = users[0].address;
                let ethPrice = 1532.653412;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);
        
                let neededAmount = (await nft.mintPrice_inDollars() - 2) * stablecoinMultiplier;
                await stablecoin.connect(users[0]).approve(nft.address, neededAmount);
        
                
    
                await expect(nft.connect(users[0]).mintForUsers_inDollars(userAddress))
                .to.be.revertedWith(
                    "MyERC721DollarsOraclized: You did not approve enough tokens to mint!"
                );
        
                // 2
                userAddress = users[1].address;
                ethPrice = 1945.0012078;
                await oracle.setEthPrice(ethPrice * oracleMultiplier);
        
                // (no approving at all)
    
                await expect(nft.connect(users[1]).mintForUsers_inDollars(userAddress))
                .to.be.revertedWith(
                    "MyERC721DollarsOraclized: You did not approve enough tokens to mint!"
                );           
            });
        });
    });
});