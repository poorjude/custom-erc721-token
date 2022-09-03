const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// We are testing only new features from the `Changeable` version here.
// See `CustomERC721.test.js` for full tests.
describe("My ERC721 non-fungible token (changeable version)", function() {
    async function deployNFTChangeable() {
        const [acc1, acc2, acc3, acc4, acc5, acc6] = await ethers.getSigners();

        const name_ = "PoorjudeNFT";
        const symbol_ = "PJNFT";

        const nftFactory = await ethers.getContractFactory("MyERC721Changeable");
        const nft = await nftFactory.deploy(name_, symbol_);
        await nft.deployed();

        const creators = [acc1, acc2, acc3]; // `acc1` is also an owner
        const users = [acc4, acc5, acc6];

        return { nft, creators, users, name_, symbol_ };
    }

    describe("Functions-setters", function() {
        it("Should set all new properties of the token correctly", async function() {
            const { nft, creators } = await loadFixture(deployNFTChangeable);

            const totalSupply = 100;
            expect(await nft.totalSupply()).to.equal(0);
            await nft.setTotalSupply(totalSupply);
            expect(await nft.totalSupply()).to.equal(totalSupply);

            const tokensForCreators = 15;
            expect(await nft.tokensForCreators()).to.equal(0);
            await nft.setTokensForCreators(tokensForCreators);
            expect(await nft.tokensForCreators()).to.equal(tokensForCreators);

            const mintPrice = ethers.utils.parseEther("0.5");
            expect(await nft.mintPrice()).to.equal(0);
            await nft.setMintPrice(mintPrice);
            expect(await nft.mintPrice()).to.equal(mintPrice);

            const transferFee = ethers.utils.parseEther("0.02");
            expect(await nft.transferFee()).to.equal(0);
            await nft.setTransferFee(transferFee);
            expect(await nft.transferFee()).to.equal(transferFee);

            const burnPrice = ethers.utils.parseEther("1.25");
            expect(await nft.burnPrice()).to.equal(0);
            await nft.setBurnPrice(burnPrice);
            expect(await nft.burnPrice()).to.equal(burnPrice);

            const baseUri = "abcde.com/";
            const tokenId = 0;
            await nft.setBaseURI(baseUri);
            await nft.startMintForCreators();
            await nft.mintForCreators(creators[0].address);
            expect(await nft.tokenURI(tokenId)).to.equal(baseUri + tokenId);
        });

        it("Should revert if caller is not the owner", async function() {
            const { nft, creators, users } = await loadFixture(deployNFTChangeable);

            const totalSupply = 100;
            await expect(nft.connect(creators[1]).setTotalSupply(totalSupply))
            .to.be.revertedWith("Ownable: caller is not the owner");

            const transferFee = ethers.utils.parseEther("0.005");
            await expect(nft.connect(users[0]).setTransferFee(transferFee))
            .to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert if the tx is made after mint for creators started", async function() {
            const { nft } = await loadFixture(deployNFTChangeable);
    
            await nft.startMintForCreators();

            const tokensForCreators = 20;
            await expect(nft.setTokensForCreators(tokensForCreators))
            .to.be.revertedWith(
                "MyERC721Changeable: Creators cannot change token settings anymore!"
            );

            const burnPrice = ethers.utils.parseEther("0.005");
            await expect(nft.setBurnPrice(burnPrice))
            .to.be.revertedWith(
                "MyERC721Changeable: Creators cannot change token settings anymore!"
            );
        });

        it("Should revert if the tx is made after mint for users started", async function() {
            const { nft } = await loadFixture(deployNFTChangeable);

            await nft.startMintForUsers();

            const totalSupply = 150;
            await expect(nft.setTotalSupply(totalSupply))
            .to.be.revertedWith(
                "MyERC721Changeable: Creators cannot change token settings anymore!"
            );

            const mintPrice = ethers.utils.parseEther("0.8");
            await expect(nft.setMintPrice(mintPrice))
            .to.be.revertedWith(
                "MyERC721Changeable: Creators cannot change token settings anymore!"
            );
        });
    });

    describe("Functions connected with mint process", function() {
        describe("Starting mint for creators", function() {
            it("Should start it", async function() {
                const { nft } = await loadFixture(deployNFTChangeable);

                expect(await nft.mintForCreatorsStarted()).to.equal(false);
                await nft.startMintForCreators();
                expect(await nft.mintForCreatorsStarted()).to.equal(true);
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, users } = await loadFixture(deployNFTChangeable);

                await expect(nft.connect(users[0]).startMintForCreators())
                .to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        describe("Starting mint for users", function() {
            it("Should automatically start and end mint for creators", async function() {
                const { nft } = await loadFixture(deployNFTChangeable);

                expect(await nft.mintForCreatorsStarted()).to.equal(false);
                expect(await nft.mintForCreatorsEnded()).to.equal(false);

                await nft.startMintForUsers();

                expect(await nft.mintForCreatorsStarted()).to.equal(true);
                expect(await nft.mintForCreatorsEnded()).to.equal(true);
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, users } = await loadFixture(deployNFTChangeable);

                await expect(nft.connect(users[0]).startMintForUsers())
                .to.be.revertedWith("Ownable: caller is not the owner");
            });
        });

        describe("Minting for creators", function() {
            it("Should revert the tx if the mint for creators has not started", async function() {
                const { nft, creators } = await loadFixture(deployNFTChangeable);

                await expect(nft.mintForCreators(creators[0].address))
                .to.be.revertedWith(
                    "MyERC721Changeable: Mint for creators has not started yet!"
                );
                await nft.startMintForCreators();
                await expect(nft.mintForCreators(creators[0].address))
                .to.not.be.reverted;
            });

            it("Should revert the tx if the mint for users has started", async function() {
                const { nft, creators } = await loadFixture(deployNFTChangeable);

                await expect(nft.mintForCreators(creators[0].address))
                .to.be.revertedWith(
                    "MyERC721Changeable: Mint for creators has not started yet!"
                );
                await nft.startMintForUsers();
                await expect(nft.mintForCreators(creators[0].address))
                .to.be.revertedWith(
                    "MyERC721: Mint for creators has already ended!"
                );
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, users } = await loadFixture(deployNFTChangeable);

                await nft.startMintForCreators();
                await expect(nft.connect(users[0]).mintForCreators(users[0].address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            });
        });
    });
});