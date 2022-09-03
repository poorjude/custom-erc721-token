const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("My ERC721 non-fungible token", function() {
    async function deployNFT() { // with empty token base URI
        const [acc1, acc2, acc3, acc4, acc5, acc6] = await ethers.getSigners();

        const name_ = "PoorjudeNFT";
        const symbol_ = "PJNFT";
        const baseUri_= "";
        const totalSupply_ = 10;
        const tokensForCreators_ = 3;
        const mintPrice_ = ethers.utils.parseUnits("1.0", "gwei");
        const transferFee_ = ethers.utils.parseUnits("0.1", "gwei");
        const burnPrice_ = ethers.utils.parseUnits("5.0", "gwei");
        // such low prices are due to overflow problems with BigNumbers

        const nftFactory = await ethers.getContractFactory("MyERC721");
        const nft = await nftFactory.deploy(name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_);
        await nft.deployed();

        const creators = [acc1, acc2, acc3]; // `acc1` is also an owner
        const users = [acc4, acc5, acc6];

        return { nft, creators, users, name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_ };
    }

    async function deployNFT2() { 
    // with non-empty token base URI and zero fees for everything
        const [acc1, acc2, acc3, acc4, acc5, acc6] = await ethers.getSigners();

        const name_ = "PoorjudeNFT";
        const symbol_ = "PJNFT";
        const baseUri_= "example.com/nfts/";
        const totalSupply_ = 5;
        const tokensForCreators_ = 3;
        const mintPrice_ = 0;
        const transferFee_ = 0;
        const burnPrice_ = 0;

        const nftFactory = await ethers.getContractFactory("MyERC721");
        const nft = await nftFactory.deploy(name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_);
        await nft.deployed();

        const creators = [acc1, acc2, acc3]; // `acc1` is also an owner
        const users = [acc4, acc5, acc6];

        return { nft, creators, users, name_, symbol_, baseUri_, totalSupply_,
            tokensForCreators_, mintPrice_, transferFee_, burnPrice_ };
    }

    describe("Deployment", function() {
        it("Should be deployed", async function() {
            const { nft } = await loadFixture(deployNFT);

            expect(nft.address).not.to.be.undefined;
        });

        it("Should set the right owner", async function() {
            const { nft, creators } = await loadFixture(deployNFT);

            expect(await nft.owner()).to.equal(creators[0].address);
        });

        describe("Setting token properties", function() { 
            it("Should set the right supply of the token", async function() {
                const { nft, totalSupply_ } = await loadFixture(deployNFT);
     
                expect(await nft.totalSupply()).to.equal(totalSupply_);
            });

            it("Should set the right amount of tokens for creators", async function() {
                const { nft, creators, tokensForCreators_ } = await loadFixture(deployNFT);
                
                expect(await nft.tokensForCreators()).to.equal(tokensForCreators_);
            });

            it("Should set the right mint price", async function() {
                const { nft, mintPrice_ } = await loadFixture(deployNFT);
                
                expect(await nft.mintPrice()).to.equal(mintPrice_);
            });

            it("Should set the right transfer fee", async function() {
                const { nft, transferFee_ } = await loadFixture(deployNFT);
                
                expect(await nft.transferFee()).to.equal(transferFee_);
            });

            it("Should set the right burn price", async function() {
                const { nft, burnPrice_ } = await loadFixture(deployNFT);
                
                expect(await nft.burnPrice()).to.equal(burnPrice_);
            });
        });
    });

    describe("Standard ERC721Metadata functions", function() {
        it("Should show the right name of the token", async function() {
            const { nft, name_ } = await loadFixture(deployNFT);
 
            expect(await nft.name()).to.equal(name_);
        });

        it("Should show the right symbol of the token", async function() {
            const { nft, symbol_ } = await loadFixture(deployNFT);
 
            expect(await nft.symbol()).to.equal(symbol_);
        });

        describe("Token URI", function() {
            it("Should show the right URI of tokens if it was left blank", async function() {
                const { nft, creators } = await loadFixture(deployNFT);
                
                await nft.mintForCreators(creators[0].address);
                await nft.mintForCreators(creators[0].address);
                expect(await nft.tokenURI(0)).to.equal("");
                expect(await nft.tokenURI(1)).to.equal("");
            });
    
            it("Should show the right URI of tokens if it was set", async function() {
                const { nft, creators, baseUri_ } = await loadFixture(deployNFT2);
                
                await nft.mintForCreators(creators[0].address);
                await nft.mintForCreators(creators[0].address);
                expect(await nft.tokenURI(0)).to.equal(baseUri_ + "0");
                expect(await nft.tokenURI(1)).to.equal(baseUri_ + "1");
            });

            it("Should revert the tx if token with invalid ID was queried", async function() {
                const { nft, creators } = await loadFixture(deployNFT);
     
                await expect(nft.tokenURI(0))
                .to.be.revertedWith("MyERC721: Token with such ID does not exist!");

                await nft.mintForCreators(creators[1].address);

                await expect(nft.tokenURI(0))
                .to.not.be.revertedWith("MyERC721: Token with such ID does not exist!");
                await expect(nft.tokenURI(538))
                .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
            });
        });
    });

    describe("Standard ERC721 functions", function() {
            describe("Read functions", function() {
                describe("`ownerOf`", function() {
                    it("Should return the correct owner of the token", async function() {
                        const { nft, creators, users, mintPrice_ } = await loadFixture(deployNFT);
    
                        await nft.mintForCreators(creators[0].address);
    
                        expect(await nft.ownerOf(0)).to.equal(creators[0].address);
    
                        await nft.startMintForUsers();
                        await nft.connect(users[0]).mintForUsers(
                            users[0].address, 
                            { value: mintPrice_ }
                        );
    
                        expect(await nft.ownerOf(1)).to.equal(users[0].address);
                    });
    
                    it("Should revert the tx if invalid token ID is queried", async function() {
                        const { nft, creators } = await loadFixture(deployNFT);
    
                        await expect(nft.ownerOf(0))
                        .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
    
                        await nft.mintForCreators(creators[0].address);
                        await expect(nft.ownerOf(0))
                        .to.not.be.revertedWith("MyERC721: Token with such ID does not exist!");
    
                        await expect(nft.ownerOf(59))
                        .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                    });
                });
    
                describe("`balanceOf`", function() {
                    it("Should return the correct balances", async function() {
                        const { nft, creators } = await loadFixture(deployNFT);
    
                        expect(await nft.balanceOf(creators[0].address))
                        .to.equal(0);
    
                        await nft.mintForCreators(creators[0].address);
                        expect(await nft.balanceOf(creators[0].address))
                        .to.equal(1);
    
                        expect(await nft.balanceOf(creators[1].address))
                        .to.equal(0);
                    });
    
                    it("Should revert the tx if balance of the zero address is queried", async function() {
                        const { nft } = await loadFixture(deployNFT);
    
                        await expect(nft.balanceOf(ethers.constants.AddressZero))
                        .to.be.revertedWith("MyERC721: Incorrect address!");
                    });
                });
    
                describe("`getApproved`", function() {
                    it("Should return the correct approved address", async function() {
                        const { nft, creators, users } = await loadFixture(deployNFT);
    
                        await nft.mintForCreators(creators[0].address);
                        await nft.approve(users[0].address, 0);
    
                        expect(await nft.getApproved(0)).to.equal(users[0].address);
    
                        await nft.approve(creators[1].address, 0);
    
                        expect(await nft.getApproved(0)).to.equal(creators[1].address);
                    });
    
                    it("Should return the zero address if no approval was made", async function() {
                        const { nft, creators } = await loadFixture(deployNFT);
    
                        await nft.mintForCreators(creators[0].address);
    
                        expect(await nft.getApproved(0))
                        .to.equal(ethers.constants.AddressZero);
                    });
    
                    it("Should revert the tx if invalid token ID is queried", async function() {
                        const { nft, creators } = await loadFixture(deployNFT);
    
                        await expect(nft.getApproved(0))
                        .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
    
                        await nft.mintForCreators(creators[0].address);
    
                        await expect(nft.getApproved(0))
                        .to.not.be.revertedWith("MyERC721: Token with such ID does not exist!");
                        await expect(nft.getApproved(123))
                        .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                    });
                });
    
                describe("`isApprovedForAll`", function() {
                    it("Should return the right address of an operator", async function() {
                        const { nft, creators, users } = await loadFixture(deployNFT);
    
                        expect(await nft.isApprovedForAll(
                            creators[0].address, 
                            users[1].address
                        )).to.equal(false);
    
                        nft.setApprovalForAll(users[1].address, true);
    
                        expect(await nft.isApprovedForAll(
                            creators[0].address, 
                            users[1].address
                        )).to.equal(true);
    
                        expect(await nft.isApprovedForAll(
                            creators[0].address, 
                            users[0].address
                        )).to.equal(false);
    
                        expect(await nft.isApprovedForAll(
                            creators[1].address, 
                            users[0].address
                        )).to.equal(false);
    
                        nft.setApprovalForAll(users[1].address, false);
    
                        expect(await nft.isApprovedForAll(
                            creators[0].address, 
                            users[1].address
                        )).to.equal(false);
                    });
                });
            });
    
        describe("Write functions", function() {
            describe("Approving of tokens", function() {
                it("Should approve the tokens right", async function() {
                    const { nft, creators, users } = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);

                    await nft.approve(users[0].address, 0);

                    expect(await nft.getApproved(0)).to.equal(users[0].address);

                    await nft.mintForCreators(creators[1].address);

                    await nft.connect(creators[1]).approve(creators[0].address, 1);

                    expect(await nft.getApproved(1)).to.equal(creators[0].address);
                });

                it("Should revert the tx if caller is not an owner/operator", async function() {
                    const { nft, creators, users } = await loadFixture(deployNFT);

                    // 1
                    await nft.mintForCreators(users[1].address);

                    await expect(nft.approve(users[0].address, 0))
                    .to.be.revertedWith("MyERC721: You are not an owner nor an operator!");

                    await expect(nft.connect(users[1]).approve(users[0].address, 0))
                    .to.not.be.revertedWith("MyERC721: You are not an owner nor an operator!");

                    // 2
                    await nft.mintForCreators(creators[1].address);

                    await expect(nft.connect(users[2]).approve(creators[0].address, 0))
                    .to.be.revertedWith("MyERC721: You are not an owner nor an operator!");

                    await expect(nft.connect(users[1]).approve(creators[0].address, 1))
                    .to.be.revertedWith("MyERC721: You are not an owner nor an operator!");

                    // 3 (2.1)
                    await nft.connect(creators[1]).setApprovalForAll(users[2].address, true);

                    await expect(nft.connect(users[2]).approve(creators[0].address, 0))
                    .to.be.revertedWith("MyERC721: You are not an owner nor an operator!");

                    await expect(nft.connect(users[2]).approve(creators[0].address, 1))
                    .to.not.be.revertedWith("MyERC721: You are not an owner nor an operator!");
                });

                it("Should revert the tx if there is no token with such ID", async function() {
                    const { nft, creators, users, burnPrice_ } = 
                    await loadFixture(deployNFT);

                    // 1
                    await expect(nft.approve(users[0].address, 0))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    await nft.mintForCreators(creators[0].address);

                    await expect(nft.approve(users[0].address, 0))
                    .to.not.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    await nft.burn(creators[0].address, 0, { value: burnPrice_ });

                    await expect(nft.approve(users[0].address, 0))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    // 2
                    await expect(nft.approve(users[0].address, 321))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                });
                    
                it("Should emit `Approval` event with the right properties", async function() {
                    const { nft, creators, users } = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);

                    await expect(nft.approve(users[0].address, 0))
                    .to.emit(nft, "Approval").withArgs(
                        creators[0].address,
                        users[0].address,
                        0
                    );

                    await nft.mintForCreators(creators[1].address);

                    await expect(nft.connect(creators[1]).approve(creators[0].address, 1))
                    .to.emit(nft, "Approval").withArgs(
                        creators[1].address,
                        creators[0].address,
                        1
                    );
                });
            });
    
            describe("Setting operators", function() {
                it("Should set the operator right", async function() {
                    const { nft, creators, users } = await loadFixture(deployNFT);

                    await nft.setApprovalForAll(users[0].address, true);

                    expect(
                    await nft.isApprovedForAll(creators[0].address, users[0].address)
                    ).to.equal(true);

                    await nft.setApprovalForAll(users[0].address, false);
                    
                    expect(
                    await nft.isApprovedForAll(creators[0].address, users[0].address)
                    ).to.equal(false);

                    await nft.connect(users[1])
                    .setApprovalForAll(creators[0].address, true);
                    
                    expect(
                    await nft.isApprovedForAll(users[1].address, creators[0].address)
                    ).to.equal(true);
                });

                it("Should emit `ApprovalForAll` event with the right properties", async function() {
                    const { nft, creators, users } = await loadFixture(deployNFT);

                    await expect(nft.setApprovalForAll(users[0].address, true))
                    .to.emit(nft, "ApprovalForAll").withArgs(
                        creators[0].address,
                        users[0].address,
                        true
                    );

                    await expect(
                    nft.connect(users[1]).setApprovalForAll(creators[1].address, false)
                    )
                    .to.emit(nft, "ApprovalForAll").withArgs(
                        users[1].address,
                        creators[1].address,
                        false
                    );
                });
            });
    
            describe("Transferring tokens", function() {
                it("Should transfer them if caller is an owner", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    await nft.transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);

                    await nft.mintForCreators(users[0].address);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 1 };
                    await nft.connect(users[0]).transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should transfer them if caller is an operator", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    await nft.setApprovalForAll(creators[1].address, true);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    await nft.connect(creators[1]).transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);

                    await nft.mintForCreators(users[0].address);
                    await nft.connect(users[0]).setApprovalForAll(creators[0].address, true);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 3 };
                    await nft.transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should transfer them if caller is an approved one", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    // 1
                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    await nft.approve(to, tokenId);
                    await nft.connect(creators[1]).transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);

                    // 2
                    await nft.mintForCreators(users[0].address);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 1 };
                    await nft.connect(users[0]).approve(users[1].address, tokenId);
                    await nft.connect(users[1]).transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);

                    // 3
                    await nft.mintForCreators(creators[1].address);
                    await nft.connect(creators[1]).setApprovalForAll(users[1].address, true);
                    from = creators[1].address;
                    to = users[2].address;
                    tokenId = 2;
                    value = { value: transferFee_ + 10 };
                    await nft.connect(users[1]).approve(to, tokenId);
                    await nft.connect(users[1]).transferFrom(from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should change balances of a sender/receiver", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.transferFrom(from, to, tokenId, value))
                    .to.changeTokenBalances(nft, [from, to], [-1, 1]);

                    await nft.mintForCreators(users[0].address);
                    await nft.connect(users[0]).setApprovalForAll(creators[0].address, true);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 1 };

                    await expect(nft.transferFrom(from, to, tokenId, value))
                    .to.changeTokenBalances(nft, [from, to], [-1, 1]);
                });

                it("Should revert the tx if caller cannot transfer the token", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    // 1
                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyErc721: You are not an owner, an operator nor an approved one!"
                    );

                    // 2
                    await nft.mintForCreators(users[0].address);
                    await nft.connect(users[0]).setApprovalForAll(creators[0].address, true);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 1 };

                    await expect(nft.connect(users[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyErc721: You are not an owner, an operator nor an approved one!"
                    );

                    // 3
                    await nft.connect(users[0]).setApprovalForAll(creators[0].address, false);

                    await expect(nft.connect(creators[0])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyErc721: You are not an owner, an operator nor an approved one!"
                    );
                });

                it("Should revert the tx if there is no token with such ID", async function() {
                    const { nft, creators, transferFee_ } 
                    = await loadFixture(deployNFT);

                    // 1
                    let from = creators[1].address;
                    let to = creators[0].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyERC721: Token with such ID does not exist!"
                    );

                    // 2
                    await nft.mintForCreators(creators[1].address);

                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.not.be.revertedWith(
                        "MyERC721: Token with such ID does not exist!"
                    );

                    // 3
                    tokenId = 555;
                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyERC721: Token with such ID does not exist!"
                    );
                });

                it("Should revert the tx if `to` is the zero address", async function() {
                    const { nft, creators, transferFee_ } 
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[1].address);
                    let from = creators[1].address;
                    let to = ethers.constants.AddressZero;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith("MyERC721: Incorrect `to` address!");
                });

                it("Should revert the tx if `from` is not the owner of the token", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = users[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    
                    await expect(nft.transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyERC721: `from` address is not an owner of `tokenId` token!"
                    );
                });

                it("Should revert the tx if caller didn't send enough Ether", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ - 1 };
                    
                    await expect(nft.transferFrom(from, to, tokenId, value))
                    .to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to transfer a token!"
                    );

                    await expect(nft.transferFrom(from, to, tokenId))
                    .to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to transfer a token!"
                    );
                });

                it("Should emit `Transfer` event with the right properties", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    // 1
                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    
                    await expect(nft.transferFrom(from, to, tokenId, value))
                    .to.emit(nft, "Transfer").withArgs(from, to, tokenId);

                    // 2
                    await nft.mintForCreators(users[0].address);
                    await nft.connect(users[0]).setApprovalForAll(creators[1].address, true);
                    from = users[0].address;
                    to = creators[0].address;
                    tokenId = 1;
                    value = { value: transferFee_ + 153 };
                    
                    await expect(nft.connect(creators[1])
                    .transferFrom(from, to, tokenId, value))
                    .to.emit(nft, "Transfer").withArgs(from, to, tokenId);
                });
            });
    
            describe("Transferring tokens safely", function() {
                it("Should transfer them if caller is an owner", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    await nft["safeTransferFrom(address,address,uint256)"]
                    (from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should transfer them if caller is an operator", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    await nft.setApprovalForAll(creators[1].address, true);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let data = "0x1234";
                    let value = { value: transferFee_ };
                    await nft.connect(creators[1])
                    ["safeTransferFrom(address,address,uint256,bytes)"]
                    (from, to, tokenId, data, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should transfer them if caller is an approved one", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    await nft.approve(to, tokenId);
                    await nft.connect(creators[1])
                    ["safeTransferFrom(address,address,uint256)"](from, to, tokenId, value);

                    expect(await nft.ownerOf(tokenId)).to.equal(to);
                });

                it("Should change balances of a sender/receiver", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.changeTokenBalances(nft, [from, to], [-1, 1]);
                });

                it("Should revert the tx if caller cannot transfer the token", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let data = "0x1256af";
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                        ["safeTransferFrom(address,address,uint256,bytes)"]
                        (from, to, tokenId, data, value)
                    )
                    .to.be.revertedWith(
                        "MyErc721: You are not an owner, an operator nor an approved one!"
                    );
                });

                it("Should revert the tx if there is no token with such ID", async function() {
                    const { nft, creators, transferFee_ } 
                    = await loadFixture(deployNFT);

                    let from = creators[1].address;
                    let to = creators[0].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.be.revertedWith(
                        "MyERC721: Token with such ID does not exist!"
                    );
                });

                it("Should revert the tx if `to` is the zero address", async function() {
                    const { nft, creators, transferFee_ } 
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[1].address);
                    let from = creators[1].address;
                    let to = ethers.constants.AddressZero;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await expect(nft.connect(creators[1])
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.be.revertedWith("MyERC721: Incorrect `to` address!");
                });

                it("Should revert the tx if `from` is not the owner of the token", async function() {
                    const { nft, creators, users, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = users[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let data = "0x123456";
                    let value = { value: transferFee_ };
                    
                    await expect(nft
                        ["safeTransferFrom(address,address,uint256,bytes)"]
                        (from, to, tokenId, data, value)
                    )
                    .to.be.revertedWith(
                        "MyERC721: `from` address is not an owner of `tokenId` token!"
                    );
                });

                it("Should revert the tx if caller didn't send enough Ether", async function() {
                    const { nft, creators, transferFee_ }
                    = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ - 1 };
                    
                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to transfer a token!"
                    );

                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId)
                    )
                    .to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to transfer a token!"
                    );
                });

                it("Should check whether the contract can receive ERC721 or not", async function() {
                    const { nft, creators, transferFee_ } = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    // 1
                    const notReceiverFactory = await ethers.getContractFactory("NotERC721Receiver");
                    const notReceiver = await notReceiverFactory.deploy();
                    await notReceiver.deployed();
                    to = notReceiver.address;

                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.be.revertedWith("MyERC721: `to` address is not an ERC721 receiver!");

                    // 2
                    const emptyContractFactory = await ethers.getContractFactory("EmptyContract");
                    const emptyContract = await emptyContractFactory.deploy();
                    await emptyContract.deployed();
                    to = emptyContract.address;

                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.be.reverted;

                    // 3
                    const receiverFactory = await ethers.getContractFactory("ERC721Receiver");
                    const receiver = await receiverFactory.deploy();
                    await receiver.deployed();
                    to = receiver.address;

                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.not.be.revertedWith("MyERC721: `to` address is not an ERC721 receiver!");
                });

                it("Should send the tx without data to a contract right", async function() {
                    const { nft, creators, users, transferFee_ } = await loadFixture(deployNFT);

                    const receiverFactory = await ethers.getContractFactory("ERC721Receiver");
                    const receiver = await receiverFactory.deploy();
                    await receiver.deployed();
                    
                    // 1
                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = receiver.address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };

                    await nft["safeTransferFrom(address,address,uint256)"]
                    (from, to, tokenId, value);

                    expect(await receiver.operator()).to.equal(from);
                    expect(await receiver.from()).to.equal(from);
                    expect(await receiver.tokenId()).to.equal(tokenId);
                    expect(await receiver.data()).to.equal("0x");

                    // 2
                    await nft.mintForCreators(creators[1].address);
                    await nft.connect(creators[1]).setApprovalForAll(users[0].address, true);
                    from = creators[1].address;
                    tokenId = 1;

                    await nft.connect(users[0])
                    ["safeTransferFrom(address,address,uint256)"]
                    (from, to, tokenId, value);

                    expect(await receiver.operator()).to.equal(users[0].address);
                    expect(await receiver.from()).to.equal(from);
                    expect(await receiver.tokenId()).to.equal(tokenId);
                    expect(await receiver.data()).to.equal("0x");
                });

                it("Should send the tx with any data to a contract right", async function() {
                    const { nft, creators, users, transferFee_ } = await loadFixture(deployNFT);

                    const receiverFactory = await ethers.getContractFactory("ERC721Receiver");
                    const receiver = await receiverFactory.deploy();
                    await receiver.deployed();
                    
                    // 1
                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = receiver.address;
                    let tokenId = 0;
                    let data = "0x123456";
                    let value = { value: transferFee_ };

                    await nft["safeTransferFrom(address,address,uint256,bytes)"]
                    (from, to, tokenId, data, value);

                    expect(await receiver.operator()).to.equal(from);
                    expect(await receiver.from()).to.equal(from);
                    expect(await receiver.tokenId()).to.equal(tokenId);
                    expect(await receiver.data()).to.equal(data);

                    // 2
                    await nft.mintForCreators(creators[1].address);
                    await nft.connect(creators[1]).approve(users[0].address, 1);
                    from = creators[1].address;
                    tokenId = 1;
                    data = "0xffffffffff";

                    await nft.connect(users[0])
                    ["safeTransferFrom(address,address,uint256,bytes)"]
                    (from, to, tokenId, data, value);

                    expect(await receiver.operator()).to.equal(users[0].address);
                    expect(await receiver.from()).to.equal(from);
                    expect(await receiver.tokenId()).to.equal(tokenId);
                    expect(await receiver.data()).to.equal(data);
                });

                it("Should emit `Transfer` event with the right properties", async function() {
                    const { nft, creators, transferFee_ } = await loadFixture(deployNFT);

                    await nft.mintForCreators(creators[0].address);
                    let from = creators[0].address;
                    let to = creators[1].address;
                    let tokenId = 0;
                    let value = { value: transferFee_ };
                    
                    await expect(nft
                        ["safeTransferFrom(address,address,uint256)"]
                        (from, to, tokenId, value)
                    )
                    .to.emit(nft, "Transfer").withArgs(from, to, tokenId);
                });
            });
        });
    });

    describe("Functions with access for only owner (creators)", function() {
        describe("Minting for creators", function() {
            it("Should mint tokens", async function() {
                const { nft, creators } = await loadFixture(deployNFT);

                await nft.mintForCreators(creators[0].address);
                await nft.mintForCreators(creators[1].address);

                expect(await nft.ownerOf(0)).to.equal(creators[0].address);
                expect(await nft.ownerOf(1)).to.equal(creators[1].address);
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, creators, users } = await loadFixture(deployNFT);
                
                await expect(nft.mintForCreators(creators[0].address))
                .to.not.be.reverted;
                await expect(nft.connect(users[0]).mintForCreators(creators[0].address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should stop mint for creators if all tokens for them are minted",
            async function() {
                const { nft, creators, tokensForCreators_ } = await loadFixture(deployNFT);
                
                for (let i = 0; i < tokensForCreators_; ++i) {
                    await nft.mintForCreators(creators[0].address);
                }

                await expect(nft.mintForCreators(creators[0].address))
                .to.be.revertedWith("MyERC721: Mint for creators has already ended!");
            });
        });
        
        describe("Starting mint for users", function() {
            it("Should allow users to mint tokens", async function() {
                const { nft, users, mintPrice_ } = await loadFixture(deployNFT);

                expect(await nft.mintForUsersStarted()).to.equal(false);
                
                await nft.startMintForUsers();

                expect(await nft.mintForUsersStarted()).to.equal(true);

                await expect(nft.connect(users[0])
                .mintForUsers( users[0].address, { value: mintPrice_ } ))
                .not.to.be.revertedWith("MyERC721: Mint for users has not started yet!");
            });

            it("Should stop mint for creators if it didn't end earlier", async function() {
                const { nft, creators } = await loadFixture(deployNFT);

                expect(await nft.mintForCreatorsEnded()).to.equal(false);
                
                await nft.startMintForUsers();

                expect(await nft.mintForCreatorsEnded()).to.equal(true);

                await expect(nft.mintForCreators(creators[0].address))
                .to.be.revertedWith("MyERC721: Mint for creators has already ended!");
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, users } = await loadFixture(deployNFT);
                
                await expect(nft.connect(users[0]).startMintForUsers())
                .to.be.revertedWith("Ownable: caller is not the owner");

                await expect(nft.startMintForUsers()).to.not.be.reverted;
            });
        });

        describe("Withdrawing all Ether from the contract", function() {
            it("Should withdraw all Ether", async function() {
                const { nft, creators, users, mintPrice_, transferFee_ } 
                = await loadFixture(deployNFT);

                await nft.startMintForUsers();
                await nft.connect(users[1]).mintForUsers(
                    users[1].address, 
                    { value: mintPrice_ + 100 }
                );
                await nft.connect(users[0]).mintForUsers(
                    users[0].address, 
                    { value: mintPrice_ }
                );
                await nft.connect(users[1]).transferFrom(
                    users[1].address,
                    users[0].address,
                    0,
                    { value: transferFee_ }
                );

                const contractBalance = await ethers.provider.getBalance(nft.address);;

                await expect(nft.withdrawAll(creators[1].address))
                .to.changeEtherBalances(
                    [nft.address, creators[1].address],
                    [ethers.BigNumber.from("-" + contractBalance), 
                        ethers.BigNumber.from(contractBalance)]
                )
            });

            it("Should revert the tx if caller is not the owner", async function() {
                const { nft, users } = await loadFixture(deployNFT);
                
                await expect(nft.connect(users[0]).withdrawAll(users[0].address))
                .to.be.revertedWith("Ownable: caller is not the owner");
            });
        });
    });

    describe("Functions connected with mint (for users) and burn", function() {
        describe("Read functions", function() {
            it("Should show the right amount of minted tokens", async function() {
                const { nft, creators, users, totalSupply_, mintPrice_ } 
                = await loadFixture(deployNFT);

                expect(await nft.howManyNotMinted()).to.equal(totalSupply_);

                await nft.mintForCreators(creators[0].address);

                expect(await nft.howManyNotMinted()).to.equal(totalSupply_ - 1);

                await nft.startMintForUsers();
                const value = { value: mintPrice_ };
                await nft.connect(users[0]).mintForUsers(users[0].address, value);
                await nft.connect(users[1]).mintForUsers(users[1].address, value);

                expect(await nft.howManyNotMinted()).to.equal(totalSupply_ - 3);
            });

            it("Should show the right amount of burnt tokens", async function() {
                const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                await nft.mintForCreators(creators[0].address);
                await nft.mintForCreators(creators[1].address);
                await nft.mintForCreators(creators[1].address);
                const value = { value: burnPrice_ };

                expect(await nft.howManyBurnt()).to.equal(0);

                await nft.burn(creators[0].address, 0, value);

                expect(await nft.howManyBurnt()).to.equal(1);

                await nft.connect(creators[1]).burn(creators[1].address, 1, value);
                await nft.connect(creators[1]).burn(creators[1].address, 2, value);

                expect(await nft.howManyBurnt()).to.equal(3);
            });
        });

        describe("Write functions", function() {
            describe("Minting of tokens", function() {
                it("Should mint new tokens", async function() {
                    const { nft, creators, users, mintPrice_, totalSupply_ } 
                    = await loadFixture(deployNFT);

                    let to = users[0].address;
                    let value = { value: mintPrice_ };

                    expect(await nft.howManyNotMinted()).to.equal(totalSupply_);
                    expect(await nft.balanceOf(to)).to.equal(0);

                    await nft.startMintForUsers();
                    await nft.connect(users[0]).mintForUsers(to, value);

                    expect(await nft.howManyNotMinted()).to.equal(totalSupply_ - 1);
                    expect(await nft.balanceOf(to)).to.equal(1);
                    expect(await nft.ownerOf(0)).to.equal(to);

                    to = creators[1].address;
                    value = { value: mintPrice_ + 10 };

                    expect(await nft.balanceOf(to)).to.equal(0);

                    await nft.connect(creators[1]).mintForUsers(to, value);

                    expect(await nft.howManyNotMinted()).to.equal(totalSupply_ - 2);
                    expect(await nft.balanceOf(to)).to.equal(1);
                    expect(await nft.ownerOf(1)).to.equal(to);
                });

                it("Should work only if the mint has started", async function() {
                    const { nft, users, mintPrice_ } 
                    = await loadFixture(deployNFT);

                    let to = users[0].address;
                    let value = { value: mintPrice_ };

                    await expect(nft.mintForUsers(to, value))
                    .to.be.revertedWith("MyERC721: Mint for users has not started yet!");
                    
                    await nft.startMintForUsers();

                    await expect(nft.mintForUsers(to, value))
                    .to.not.be.revertedWith("MyERC721: Mint for users has not started yet!");
                });
                
                it("Should end mint if the last token was minted", async function() {
                    const { nft, users, mintPrice_, totalSupply_ } 
                    = await loadFixture(deployNFT);

                    let to;
                    let value = { value: mintPrice_ };

                    await nft.startMintForUsers();

                    for (let i = 0; i < totalSupply_; ++i) {
                        to = users[i % users.length].address;
                        await nft.mintForUsers(to, value);
                    }

                    expect(await nft.howManyNotMinted()).to.equal(0);
                    expect(await nft.mintForUsersEnded()).to.equal(true);
                });

                it("Should not work if the mint has already ended", async function() {
                    const { nft, users, mintPrice_, totalSupply_ } 
                    = await loadFixture(deployNFT);

                    let to;
                    let value = { value: mintPrice_ };

                    await nft.startMintForUsers();

                    for (let i = 0; i < totalSupply_; ++i) {
                        to = users[i % users.length].address;
                        await nft.mintForUsers(to, value);
                    }

                    expect(await nft.mintForUsersEnded()).to.equal(true);
                    await expect(nft.mintForUsers(to, value))
                    .to.be.revertedWith("MyERC721: Mint for users has already ended!");
                });

                it("Should revert the tx if caller didn't send enough Ether", async function() {
                    const { nft, users, creators, mintPrice_ } 
                    = await loadFixture(deployNFT);

                    let to = creators[0].address;
                    let value = { value: mintPrice_ - 1 };

                    await nft.startMintForUsers();

                    await expect(nft.mintForUsers(to, value))
                    .to.be.revertedWith("MyERC721: You did not send enough Ether to mint!");

                    await expect(nft.connect(users[0]).mintForUsers(to))
                    .to.be.revertedWith("MyERC721: You did not send enough Ether to mint!");
                });

                it("Should revert the tx if `to` is the zero address", async function() {
                    const { nft, mintPrice_ } = await loadFixture(deployNFT);

                    let to = ethers.constants.AddressZero;
                    let value = { value: mintPrice_ };

                    await nft.startMintForUsers();

                    await expect(nft.mintForUsers(to, value))
                    .to.be.revertedWith("MyERC721: Incorrect `to` address!");
                });

                it("Should emit `Transfer` event with `from` == the zero address", async function() {
                    const { nft, users, mintPrice_ } = await loadFixture(deployNFT);

                    let from = ethers.constants.AddressZero;
                    let to = users[0].address;
                    let value = { value: mintPrice_ };

                    await nft.startMintForUsers();

                    await expect(nft.mintForUsers(to, value))
                    .to.emit(nft, "Transfer").withArgs(from, to, 0);
                    to = users[1].address;
                    await expect(nft.mintForUsers(to, value))
                    .to.emit(nft, "Transfer").withArgs(from, to, 1);
                });
            });

            describe("Burning of tokens", function() {
                it("Should burn them", async function() {
                    const { nft, creators, users, mintPrice_, burnPrice_, 
                        totalSupply_ } = await loadFixture(deployNFT);

                    let to = creators[0].address; // 0
                    let value = { value: mintPrice_ };
                    await nft.mintForCreators(to);
                    to = creators[1].address; // 1
                    await nft.mintForCreators(to);
                    to = users[0].address; // 2
                    await nft.startMintForUsers();
                    await nft.mintForUsers(to, value);

                    value = { value: burnPrice_ };

                    await nft.burn(creators[0].address, 0, value)

                    expect(await nft.howManyBurnt()).to.equal(1);
                    expect(await nft.totalSupply()).to.equal(totalSupply_ - 1);
                    await expect(nft.ownerOf(0))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    await nft.connect(creators[1]).burn(creators[1].address, 1, value)
                    await nft.connect(users[0]).burn(users[0].address, 2, value)

                    expect(await nft.howManyBurnt()).to.equal(3);
                    expect(await nft.totalSupply()).to.equal(totalSupply_ - 3);
                    await expect(nft.ownerOf(1))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                    await expect(nft.ownerOf(2))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                });

                it("Should revert the tx if caller cannot burn the token", async function() {
                    const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                    let owner = creators[0].address;
                    let value = { value: burnPrice_ };
                    await nft.mintForCreators(owner);

                    await expect(nft.connect(creators[1])
                    .burn(owner, 0, value)
                    ).to.be.revertedWith(
                        "MyErc721: You are not an owner, an operator nor an approved one!"
                    );
                });

                it("Should revert the tx if caller didn't send enough Ether", async function() {
                    const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                    let owner = creators[0].address;
                    let value = { value: burnPrice_ - 1 };
                    let tokenId = 0;
                    await nft.mintForCreators(owner);

                    await expect(nft.burn(owner, tokenId, value)).to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to burn a token!"
                    );

                    await expect(nft.burn(owner, tokenId)).to.be.revertedWith(
                        "MyERC721: You did not send enough Ether to burn a token!"
                    );
                });
                
                it("Should revert the tx if there is no token with such ID", async function() {
                    const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                    let owner = creators[0].address;
                    let value = { value: burnPrice_ };

                    await expect(nft.burn(owner, 0, value))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    await nft.mintForCreators(owner);

                    await expect(nft.burn(owner, 0, value))
                    .to.not.be.revertedWith("MyERC721: Token with such ID does not exist!");

                    await expect(nft.burn(owner, 567, value))
                    .to.be.revertedWith("MyERC721: Token with such ID does not exist!");
                });

                it("Should revert the tx if `from` is not the actual token owner", async function() {
                    const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                    let owner = creators[0].address;
                    let value = { value: burnPrice_ };

                    await nft.mintForCreators(owner);

                    await expect(nft.burn(creators[1].address, 0, value))
                    .to.be.revertedWith(
                        "MyERC721: `from` address is not an owner of `tokenId` token!"
                    );
                });

                it("Should emit `Transfer` event with `to` == the zero address", async function() {
                    const { nft, creators, burnPrice_ } = await loadFixture(deployNFT);

                    let owner = creators[0].address;
                    let to = ethers.constants.AddressZero;
                    let tokenId = 0;
                    let value = { value: burnPrice_ };

                    await nft.mintForCreators(owner);

                    await expect(nft.burn(owner, tokenId, value))
                    .to.emit(nft, "Transfer").withArgs(owner, to, tokenId);

                    owner = creators[1].address;
                    tokenId = 1;
                    await nft.mintForCreators(owner);

                    await expect(nft.connect(creators[1]).burn(owner, tokenId, value))
                    .to.emit(nft, "Transfer").withArgs(owner, to, tokenId);
                });
            });
        });
    });
});