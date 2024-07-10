require("@nomiclabs/hardhat-ganache");
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('solidity-coverage');
require("hardhat-tracer");
require('hardhat-contract-sizer');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            // runs: 999999,
          },
        },
      },
      {
        version: '0.8.2',
        settings: {
          optimizer: {
            enabled: true,
            runs: 20000,
          },
        },
      },
      {
        version: '0.7.5',
        settings: {
          "optimizer": {
            "enabled": true,
            "runs": 1337
          },
          "outputSelection": {
            "*": {
              "*": [
                "evm.bytecode",
                "evm.deployedBytecode",
                "abi"
              ]
            }
          },
          "metadata": {
            "useLiteralContent": true
          },
          "libraries": {}
        },
      },     
      {
        version: '0.6.8',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: '0.6.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: '0.4.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      }
    ],   
  },
  networks:{
    "localhost": {
      url: 'http://127.0.0.1:8545',
      gasPrice: 500000000, // 5Gwei
      timeout: 600000,
      network_id: '*'
    },
    // bsc network
    "bsc": {
      url: 'https://bsc-dataseed1.binance.org',
      accounts: ['2fa74ff6e627905c42cf92ad630746517d9f6a581a10eaff14ff516c2cc44cf6']
    },
    "bsctestnet-testnet": {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: ['2fa74ff6e627905c42cf92ad630746517d9f6a581a10eaff14ff516c2cc44cf6']
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
  },
};
