require("@nomicfoundation/hardhat-ethers");
require('dotenv').config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
