const { ethers } = require("hardhat");

async function main() {
    const [ acc1 ] = await ethers.getSigners();

    const name_ = "PoorjudeNFT";
    const symbol_ = "PJNFT";
    const baseUri_= "example.com/nfts/";
    const totalSupply_ = 50;
    const tokensForCreators_ = 10;
    const mintPrice_ = ethers.utils.parseEther("0.01");
    const transferFee_ = ethers.utils.parseEther("0.001");
    const burnPrice_ = ethers.utils.parseEther("0.05");

    const nftFactory = await ethers.getContractFactory("MyERC721");
    const nft = await nftFactory.deploy(name_, symbol_, baseUri_, totalSupply_,
    tokensForCreators_, mintPrice_, transferFee_, burnPrice_);
        
    await nft.deployed();

    console.log(
    `"MyERC721" deployed to the address ${nft.address} 
    with the owner ${acc1.address}.`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
