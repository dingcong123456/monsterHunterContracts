// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameToken is ERC20 {
    constructor() public ERC20("Gold", "GLD") {
        _mint(msg.sender, 300_000_000 ether);
    }
}