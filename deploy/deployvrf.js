// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require("hardhat");
const setting = {
  bsctestnet_testnet_token: {
    BNB: "0x0000000000000000000000000000000000000000",
    WBNB: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
    BUSD: "0xEa3Bdd2527CF4689761F0FD4219B41eE6560534c",
    USDC: "0xed2525f7DB9480db1495493C0b21df78a421e1dE",
    USDT: "0xc2E825be6cDa0D4C1441652dddC31B74862C469e",
  },
  bsctestnet_testnet_tokens:[
    "0x0000000000000000000000000000000000000000"
  ],
  bsctestnet_testnet_chainlink: {
    vrfId: 1914,
    linkToken: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",
    vrfCoordinator: "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
    linkKeyHash:
      "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
    keeper: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
  },
  multisigAddress: "0x33326bd584BFbba655cA8026b070D9a3E165a0E6",
};
setting.WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();



  // VRF = await deploy("VRF", {
  //   from: deployer,
  //   args: [
  //     setting.bsctestnet_testnet_chainlink.vrfId,
  //     setting.bsctestnet_testnet_chainlink.vrfCoordinator,
  //     setting.bsctestnet_testnet_chainlink.linkToken,
  //     setting.bsctestnet_testnet_chainlink.linkKeyHash,
  //     "0x893BAB56Cb5f4E319f402A5d0100566A363C9300"
  //   ],
  //   skipIfAlreadyDeployed: true,
  //   log: true,
  // });

  // console.log(`DEPLOY >> VRF deployed! ${VRF.address}`);
  // return;

};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

module.exports.tags = ["Executor", "test"];

