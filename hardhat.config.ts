import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_INFURA! || "",
      accounts: [process.env.PRIVATE_KEY!] || []
    },
    holesky: {
      url: process.env.HOLESKY! || "",
      accounts: [process.env.PRIVATE_KEY!] || []
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY! || "",
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io"
        }
      }
    ]
  }
};

export default config;
