const { ethers, Wallet, BigNumber, utils } = require("ethers");
const shop_abi =
  require("../artifacts/contracts/other/Shop.sol/Shop.json").abi;
const gametoken_abi =
  require("../artifacts/contracts/mock/GameToken.sol/GameToken.json").abi;
const privateKey =
  "2fa74ff6e627905c42cf92ad630746517d9f6a581a10eaff14ff516c2cc44cf6";
  const privateKey2 =
  "d6f1305ba5001814ecb94b0d8d5a0715fc5ad54a34c95f5f919cef0426fa304b";
const infra_url =
  "https://data-seed-prebsc-1-s1.binance.org:8545";

  const getTimestamp = function (timestampms) {
    timestampms = timestampms || Date.now();
    return Math.floor(timestampms / 1000);
  }


const ws = [{
    a:"0x086a5B857299f70f5C1B3449A46cD6b96B350a2D",
    p:'0x753cb280f6a5f39b12613a3173492987023bee96328701e4c596033d24b3b961'
},
{
    a:"0x918F9a44A6fedECC5A73AF17cF582aA3c371E03D",
    p:'0x1defe0b5c58613df25837a0eab6f2c5dda5a259e0c2028588fbcc5f305ee0f7b'
},
{
    a:"0x50828A39D264E1bE7C29bB21B8626d4B57CF025e",
    p:'0x3ef86c2c456d7df9d876b4a107c5f4f94188c92b9ac50e0135aa76511bbc0cd3'
},
{
    a:"0x8441246D26fd8a7a7Ba42df61a9271E27d348E0F",
    p:'0xc1b27c24a8413b3d75d451d7863101397d895b93210cb157cc1d56fc346b945c'
},
{
    a:"0x0a7e8C16E128f2d03bc3A4bB1F12301194664717",
    p:'0x7b636f6a17764c17a31c5b9c81432b32b3ab87a76e9bd94a51dd29d457af3f27'
},
{
    a:"0x7561fC795F26084c27A68e1311F4E6244bF610EC",
    p:'0xfe33811d647fdf51beed09037fc09ac0a8c7214a36385dcfa6afb35de73c510f'
},
{
    a:"0x6A2E7AdbE983c6e8C93C335aaCc57B11ACE03555",
    p:'0x383962a3c71a65d71535a8c2451be3759e0770eaa83a7ea9a3d2a3a4a2518095'
},
{
    a:"0xD3395e730351268d0f95469ff700Ce2b980208bc",
    p:'0x34922cec8e72a2eadbb9dec9936cbfae4b76f7037da2f22863e9240bf8cb859a'
},
{
    a:"0xF000b125119CE383F2542AF89baAbb715ABeA964",
    p:'0x35813fb6b2f6f1a26c4fbaa6eed15fd12fd54e0f42e7c4c70562707bdad846db'
},
{
    a:"0xCfdAD84C9e9EbAAbc4dc7fbC24C61C35546FA85f",
    p:'0x2dd0ffbc757f5c971eb69f0945946ff782d683b0cad1e6632b557ae3799dece8'
},
]

async function allowance() {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey2, provider);

  let execute_contract = new ethers.Contract(
    "0xB5CE03331Ba5E70782931fb91032fed93cB066F3",
    gametoken_abi,
    wallet
  );

  try {
    await execute_contract.approve('0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf', utils.parseEther("1000000"));
  } catch (error) {
    console.log(error);
  }
  
}

async function buy() {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey2, provider);

  let execute_contract = new ethers.Contract(
    "0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf",
    shop_abi,
    wallet
  );

  try {
    await execute_contract.buy(2, 2);
  } catch (error) {
    console.log(error);
  }
  
}
async function refund() {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey2, provider);

  let execute_contract = new ethers.Contract(
    "0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf",
    shop_abi,
    wallet
  );

  try {
    await execute_contract.refund(1, 1);
  } catch (error) {
    console.log(error);
  }
  
}

async function setURI() {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey, provider);

  let execute_contract = new ethers.Contract(
    "0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf",
    shop_abi,
    wallet
  );

  try {
    await execute_contract.setURI("https://monster-hunter-metadata.herokuapp.com/api/item/{id}");
  } catch (error) {
    console.log(error);
  }
  
}

async function getURI(id) {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey, provider);

  let execute_contract = new ethers.Contract(
    "0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf",
    shop_abi,
    wallet
  );

  try {
    let res = await execute_contract.uri(id);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
  
}

async function updatePrice(index,price) {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey, provider);

  let execute_contract = new ethers.Contract(
    "0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf",
    shop_abi,
    wallet
  );

  try {
    await execute_contract.updatePrice(index,price);
  } catch (error) {
    console.log(error);
  }
  
}
buy(6,1)
// updatePrice(6,ethers.utils.parseEther("10000"));
// 0x36a592e4aa6B122796d0EedA0bB15b266b751Aaf




