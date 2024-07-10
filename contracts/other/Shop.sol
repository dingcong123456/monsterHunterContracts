// contracts/GameItems.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Shop is ERC1155, Ownable {
     using SafeERC20 for ERC20;
    ERC20 public  gameToken;
    mapping(uint256 => uint256) public prices;
    constructor(address _gameToken) public ERC1155("https://game.example/api/item/{id}") {
         prices[1] = 100 ether;
         prices[2] = 1000 ether;
         gameToken = ERC20(_gameToken);
    }

    
    function updatePrice(uint256 index, uint256 price) external onlyOwner {
       require(prices[index]==0, "update price eror");
       prices[index] = price;
    } 
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
    function buy(uint256 index, uint256 num) external {
        require(prices[index] > 0, "not found price");
        require(num > 0, "num error");
        gameToken.safeTransferFrom(msg.sender, address(this),prices[index]*num);
        _mint(msg.sender, index, num, "");
    }
    function refund(uint256 index, uint256 num) external {
        require(prices[index] > 0, "not found price");
        require(num > 0, "num error");
        _burn(msg.sender, index, num);
        gameToken.safeTransfer(msg.sender, prices[index]*num); 
    }
}