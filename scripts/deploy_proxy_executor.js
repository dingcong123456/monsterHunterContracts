



module.exports = async ({ ethers, getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts();

    let chainId = await getChainId();

     // contract code
     const LucksExecutor = await ethers.getContractFactory("LucksExecutor");

     // proxy
     const instance = await upgrades.deployProxy(LucksExecutor, 
         [
             setting.lzChainId, //_chainId 
             setting.isAllowTask // _allowTask
         ],
         { initializer: "initialize" }
     );
     await instance.deployed();  
     setting.deployedAddress.LucksExecutor = instance.address;

}

module.exports.tags = ["LucksExecutor", "test"]
