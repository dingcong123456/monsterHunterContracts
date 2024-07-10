const { ethers, Wallet, BigNumber, utils } = require("ethers");
const helper_abi =
  require("../artifacts/contracts/other/Helper.sol/Helper.json").abi;
const execute_abi =
  require("../artifacts/contracts/Execute.sol/Executor.json").abi;

const gameitems_abi =
  require("../artifacts/contracts/mock/GameItems.sol/GameItems.json").abi;
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
const taskItem =  {
    seller: "0x2Ef6c4Cf5744CA26Ae1915c8684d4b5d5D16c879",
    nftContract: "0x393A7167B733bd2Ad2174419314355252a047A9A",
    tokenIds: [1],
    tokenAmounts: [1],
    acceptToken: "0xB5CE03331Ba5E70782931fb91032fed93cB066F3",
    status: 1,
    startTime: getTimestamp(new Date().getTime() + 20 * 1000),
    endTime: getTimestamp(new Date().getTime() + 24 * 60 * 60 * 1000),
    targetAmount: utils.parseEther("10"),
    price: utils.parseEther("1"),
    copyId:0,
    amountCollected: 0,
    depositId: 0,
  }

async function setAcceptTokens() {
  const provider = new ethers.providers.JsonRpcProvider(infra_url);
  const wallet = new Wallet(privateKey, provider);

  let helper_contract = new ethers.Contract(
    "0x303E0BF6a156e3371B5D565cfd4593aD044925Ea",
    helper_abi,
    wallet
  );

  try {
    await helper_contract.setAcceptTokens(['0xB5CE03331Ba5E70782931fb91032fed93cB066F3'],true);
  } catch (error) {
    console.log(error);
  }
  
}

async function setProxy() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.setProxy("0xCd514Aca4978EFd3B3DCE1CEeeF25E4cec749be8","0xD80949c7e8e747Aae9C1cbC721FbEC6688919bcF");
    } catch (error) {
      console.log(error);
    }
    
  }
  async function setHelper() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.setHelper("0x303E0BF6a156e3371B5D565cfd4593aD044925Ea");
    } catch (error) {
      console.log(error);
    }
    
  }
async function createTask(title,note) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.createTask(taskItem,{title,note});
    } catch (error) {
      console.log(error);
    }
    
  }


async function setApprovalForAll() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x393A7167B733bd2Ad2174419314355252a047A9A",
      gameitems_abi,
      wallet
    );
  
    try {
      await execute_contract.setApprovalForAll("0xD80949c7e8e747Aae9C1cbC721FbEC6688919bcF",true);
    } catch (error) {
      console.log(error);
    }
    
  }

  async function joinTask(privateKey2,taskid,num) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);
  
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.joinTask('0x33326bd584BFbba655cA8026b070D9a3E165a0E6',taskid,num,'');
    } catch (error) {
      console.log(error);
    }
    
  }

  async function allowance() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);
  
    let execute_contract = new ethers.Contract(
      "0xB5CE03331Ba5E70782931fb91032fed93cB066F3",
      gametoken_abi,
      wallet
    );
  
    try {
      await execute_contract.approve('0xCd514Aca4978EFd3B3DCE1CEeeF25E4cec749be8', utils.parseEther("100"));
    } catch (error) {
      console.log(error);
    }
    
  }

  async function snedtoken() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);
  
    let execute_contract = new ethers.Contract(
      "0xB5CE03331Ba5E70782931fb91032fed93cB066F3",
      gametoken_abi,
      wallet
    );
    await execute_contract.transfer(
        ws[4].a,
        utils.parseEther("1000")
    ) ;
   
    return;

    ws.forEach(async w => {
        try {
            console.log(w)
            await execute_contract.transfer(
                w.a,
                utils.parseEther("1000")
            ) ;
          
            
        } catch (error) {
            console.log(error)
        }
        
    });
    
  }


  async function sendbnb() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider); 
    await wallet.sendTransaction({
        to:ws[1].a,
        value:utils.parseEther("0.02")
    }) ;
    console.log(1)
    await wallet.sendTransaction({
        to:ws[2].a,
        value:utils.parseEther("0.02")
    }) ;
    console.log(1)
    await wallet.sendTransaction({
        to:ws[3].a,
        value:utils.parseEther("0.02")
    }) ;
    console.log(1)
    await wallet.sendTransaction({
        to:ws[4].a,
        value:utils.parseEther("0.02")
    }) ;
    console.log(1)
    await wallet.sendTransaction({
        to:ws[5].a,
        value:utils.parseEther("0.02")
    }) ;
    await wallet.sendTransaction({
        to:ws[6].a,
        value:utils.parseEther("0.02")
    }) ;
    await wallet.sendTransaction({
        to:ws[7].a,
        value:utils.parseEther("0.02")
    }) ;
    await wallet.sendTransaction({
        to:ws[8].a,
        value:utils.parseEther("0.02")
    }) ;
    await wallet.sendTransaction({
        to:ws[9].a,
        value:utils.parseEther("0.02")
    }) ;
    console.log(1)
return
    try {
        ws.forEach(async w => {
            console.log(w.a)
            try {
                await wallet.sendTransaction({
                    to:w.a,
                    value:utils.parseEther("0.02")
                }) ;
                console.log(1)
                
            } catch (error) {
                console.log(error)
            }
            
        });
    } catch (error) {
        console.log(error)
    }
  
    
  }

//   testhelp()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// 0x086a5B857299f70f5C1B3449A46cD6b96B350a2D
// 0x918F9a44A6fedECC5A73AF17cF582aA3c371E03D
// 0x50828A39D264E1bE7C29bB21B8626d4B57CF025e
// 0x8441246D26fd8a7a7Ba42df61a9271E27d348E0F
// 0x0a7e8C16E128f2d03bc3A4bB1F12301194664717
// 0x7561fC795F26084c27A68e1311F4E6244bF610EC
// 0x6A2E7AdbE983c6e8C93C335aaCc57B11ACE03555
// 0xD3395e730351268d0f95469ff700Ce2b980208bc
// 0xF000b125119CE383F2542AF89baAbb715ABeA964
// 0xCfdAD84C9e9EbAAbc4dc7fbC24C61C35546FA85f
async function joinTasks(num) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(ws[num].p, provider);

    let execute_contract1 = new ethers.Contract(
        "0xB5CE03331Ba5E70782931fb91032fed93cB066F3",
        gametoken_abi,
        wallet
      );
    
      try {
        await execute_contract1.approve('0xCd514Aca4978EFd3B3DCE1CEeeF25E4cec749be8', utils.parseEther("100"));
      } catch (error) {
        console.log(error);
      }
  
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.joinTask('0x33326bd584BFbba655cA8026b070D9a3E165a0E6',1,1,'');
    } catch (error) {
      console.log(error);
    }
    
  }

  async function closeTask(num) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);

    
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.closeTask(num);
    } catch (error) {
      console.log(error);
    }
    
  }
  async function pickWinner(num) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);

    
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
      await execute_contract.pickWinner(num);
    } catch (error) {
      console.log(error);
    }
    
  }



async function testhelp() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x303E0BF6a156e3371B5D565cfd4593aD044925Ea",
      helper_abi,
      wallet
    );
  
    try {
      let res = await execute_contract.getAutoClose();
      console.log(res);
    } catch (error) {
      console.log(error);
    }
    
  }

  async function getTask(num) {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);

    
    let execute_contract = new ethers.Contract(
      "0x893BAB56Cb5f4E319f402A5d0100566A363C9300",
      execute_abi,
      wallet
    );
  
    try {
     let res =  await execute_contract.getTask(num);
        console.log(res);
    } catch (error) {
      console.log(error);
    }
    
  }

  async function getNftBalance() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey2, provider);
  
    let execute_contract = new ethers.Contract(
      "0x393A7167B733bd2Ad2174419314355252a047A9A",
      gameitems_abi,
      wallet
    );
  
    try {
      let res = await execute_contract.balanceOf('0x7561fC795F26084c27A68e1311F4E6244bF610EC', 0);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
    
  }

  async function transferFromNft() {
    const provider = new ethers.providers.JsonRpcProvider(infra_url);
    const wallet = new Wallet(privateKey, provider);
  
    let execute_contract = new ethers.Contract(
      "0x393A7167B733bd2Ad2174419314355252a047A9A",
      gameitems_abi,
      wallet
    );
  
    try {
      let res = await execute_contract.safeTransferFrom('0x2Ef6c4Cf5744CA26Ae1915c8684d4b5d5D16c879','0x01413C57395f40Be59153B7828608b22c63Da334',1,10,"0x");
      console.log(res);
    } catch (error) {
      console.log(error);
    }
    
  }

  //  closeTask(39);
  //  setTimeout(()=>{
  //   pickWinner(3);
  //  },3600)
  // pickWinner(3);
  // testhelp()
  // createTask(13,'')

 joinTask(ws[2].p,'54',9)
 
