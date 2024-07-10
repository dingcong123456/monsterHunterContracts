// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require("hardhat");;
module.exports = async ({ ethers, getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  Shop = await deploy("Shop", {
    from: deployer,
    args: ['0xB5CE03331Ba5E70782931fb91032fed93cB066F3'],
    skipIfAlreadyDeployed: true,
    log: true,
  });
  console.log(`DEPLOY >> shop deployed! ${Shop.address}`);

};


module.exports.tags = ["Executor", "test"];
// 0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf

