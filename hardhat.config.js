require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");

const GOERLI_PRIVATE_KEY = "your private key"
const ALCHEMY_API_KEY = "your api key";


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};
