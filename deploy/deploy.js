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

  //2
  // GameItems = await deploy("GameItems", {
  //   from: deployer,
  //   args: [],
  //   skipIfAlreadyDeployed: true,
  //   log: true,
  // });
  // console.log(`DEPLOY >> GameItems deployed! ${GameItems.address}`);

  // //3
  // GameToken = await deploy("GameToken", {
  //   from: deployer,
  //   args: [],
  //   skipIfAlreadyDeployed: true,
  //   log: true,
  // });
  // console.log(
  //   `DEPLOY >> GameToken deployed! ${GameToken.address}`
  // );


  return;
  //  Deploy Contracts
  let Executor;
  let ProxyTokenStation;
  let ProxyNFTStation;
  let Helper;
  let VRF;
  let AutoCloseTask;
  let AutoDrawTask;

  //1. contract code
  const code = await ethers.getContractFactory("Executor");
  // deployProxy
  const instance = await upgrades.deployProxy(code, [true], {
    initializer: "initialize",
  });
  await instance.deployed();
  // get contract
  Executor = code.attach(instance.address);

  console.log(`DEPLOY >> Proxy Executor deployed! ${Executor.address}`);

  //2
  ProxyNFTStation = await deploy("ProxyNFTStation", {
    from: deployer,
    args: [Executor.address],
    skipIfAlreadyDeployed: true,
    log: true,
  });
  console.log(`DEPLOY >> ProxyNFTStation deployed! ${ProxyNFTStation.address}`);

  //3
  ProxyTokenStation = await deploy("ProxyTokenStation", {
    from: deployer,
    args: [Executor.address, setting.WETH],
    skipIfAlreadyDeployed: true,
    log: true,
  });
  console.log(
    `DEPLOY >> ProxyTokenStation deployed! ${ProxyTokenStation.address}`
  );

  VRF = await deploy("VRF", {
    from: deployer,
    args: [
      setting.bsctestnet_testnet_chainlink.vrfId,
      setting.bsctestnet_testnet_chainlink.vrfCoordinator,
      setting.bsctestnet_testnet_chainlink.linkToken,
      setting.bsctestnet_testnet_chainlink.linkKeyHash,
      Executor.address,
    ],
    skipIfAlreadyDeployed: true,
    log: true,
  });

  console.log(`DEPLOY >> VRF deployed! ${VRF.address}`);

  AutoCloseTask = await deploy("AutoCloseTask", {
    from: deployer,
    args: [
      setting.bsctestnet_testnet_chainlink.keeper, //_keeperRegAddr The address of the keeper registry contract
      Executor.address,
    ], 
    skipIfAlreadyDeployed: true,
    log: true,
  });

  console.log(`DEPLOY >> AutoCloseTask deployed! ${AutoCloseTask.address}`);

  AutoDrawTask = await deploy("AutoDrawTask", {
    from: deployer,
    args: [
      setting.bsctestnet_testnet_chainlink.keeper, //_keeperRegAddr The address of the keeper registry contract
      Executor.address, //LucksExecutor contract
    ],
    skipIfAlreadyDeployed: true,
    log: true,
  });

  console.log(`DEPLOY >> AutoDrawTask deployed! ${AutoDrawTask.address}`);

  Helper = await deploy("Helper", {
    from: deployer,
    args: [
      setting.bsctestnet_testnet_tokens,
      setting.multisigAddress, //protocolFee recipient
      500, // protocolFee 2%
      setting.multisigAddress,
      1000, // protocolFee 2%
      Executor.address, // LucksExecutor
      VRF.address, //LucksVRF
      AutoCloseTask.address, // LucksAutoCloseTask
      AutoDrawTask.address, // LucksAutoDrawTask
    ],
    skipIfAlreadyDeployed: true,
    log: true,
  });

  console.log(`DEPLOY >> Helper deployed! ${Helper.address}`);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

module.exports.tags = ["Executor", "test"];
// DEPLOY >> Proxy Executor deployed! 0x893BAB56Cb5f4E319f402A5d0100566A363C9300
// deploying "ProxyNFTStation" (tx: 0x533840b556c911a1c868099c60166ffb3c3e183484cbc08ee0e5724906e6efb0)...: deployed at 0xD80949c7e8e747Aae9C1cbC721FbEC6688919bcF with 1402135 gas
// DEPLOY >> ProxyNFTStation deployed! 0xD80949c7e8e747Aae9C1cbC721FbEC6688919bcF
// deploying "ProxyTokenStation" (tx: 0x04cc078d18f8af87e348b3cb7c955c3d6899668a3fd3337caf9cb55513ff0912)...: deployed at 0xCd514Aca4978EFd3B3DCE1CEeeF25E4cec749be8 with 1055079 gas
// DEPLOY >> ProxyTokenStation deployed! 0xCd514Aca4978EFd3B3DCE1CEeeF25E4cec749be8
// deploying "VRF" (tx: 0xe39a0093c77f8e33badfae097dca43a49fb7d12fe1b90797433dce7b366617a4)...: deployed at 0xb1BB64e9401e1EE822887357c8f20179bF677543 with 874655 gas
// DEPLOY >> VRF deployed! 0x43aF8392DFa68108E837Bd0a061237973d5e7Fc0
// deploying "AutoCloseTask" (tx: 0x568f62402a8957a27867d62cf19274a8679e33c1263bf959588b81339564bae7)...: deployed at 0x8C89b1F356F966c9B5E17415fA43D0fb560b29b3 with 1486113 gas
// DEPLOY >> AutoCloseTask deployed! 0x8C89b1F356F966c9B5E17415fA43D0fb560b29b3
// deploying "AutoDrawTask" (tx: 0x07f8fe2d4bd1e5b43e356aa9ab207a69608f08544b801239c26cf0e498ce1361)...: deployed at 0x150C1C70D945Bfff54612DD2e3F41Bb73a861cAe with 1545599 gas
// DEPLOY >> AutoDrawTask deployed! 0x150C1C70D945Bfff54612DD2e3F41Bb73a861cAe
// deploying "Helper" (tx: 0x96760a2e74a8e740096d10b091b7ce2af712be5688e913297943e44b5295f032)...: deployed at 0x303E0BF6a156e3371B5D565cfd4593aD044925Ea with 2301105 gas
// DEPLOY >> Helper deployed! 0x303E0BF6a156e3371B5D565cfd4593aD044925Ea


// DEPLOY >> GameItems deployed! 0x393A7167B733bd2Ad2174419314355252a047A9A
// DEPLOY >> GameToken deployed! 0xB5CE03331Ba5E70782931fb91032fed93cB066F3
