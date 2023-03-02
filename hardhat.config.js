require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require('hardhat-deploy');
// Load from .env file
require("dotenv").config();

const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY || "";
const GOERLI_NODE_URL = process.env.GOERLI_NODE_URL || "";

const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || "";
const MAINNET_NODE_URL = process.env.MAINNET_NODE_URL || "";


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  namedAccounts: {
      deployer: 0
  },
};

if (GOERLI_PRIVATE_KEY && GOERLI_NODE_URL) {
  module.exports.networks = {
    goerli: {
      url: GOERLI_NODE_URL,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  };
}

if (MAINNET_PRIVATE_KEY && MAINNET_NODE_URL) {
  module.exports.networks = {
    mainnet: {
      url: MAINNET_NODE_URL,
      accounts: [MAINNET_PRIVATE_KEY],
    },
  };
}
